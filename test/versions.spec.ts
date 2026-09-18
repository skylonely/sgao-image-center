import { env, SELF } from 'cloudflare:test';
import { afterEach, describe, expect, it } from 'vitest';
import { ownerFetch } from './auth-fixture';
import { VERSION_PREFIX } from '../src/trash';

const key = 'versions-tests/photo.png';
const first = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 1]);
const second = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 2]);

async function seed(bytes = first) {
	await env.IMAGES.put(key, bytes, {
		httpMetadata: { contentType: 'image/png', cacheControl: 'public, max-age=300' },
		customMetadata: { originalFilename: 'original.png', uploadedAt: '2026-09-18T00:00:00Z' },
	});
}

async function replace(bytes = second) {
	const current = await env.IMAGES.head(key);
	const body = new FormData();
	body.set('replace', 'version-v1'); body.set('replaceKey', key); body.set('conflict', 'reject');
	body.set('expectedEtag', current!.etag); body.set('expectedVersion', current!.version);
	body.set('file', new File([bytes], 'replacement.png', { type: 'image/png' }));
	return ownerFetch('https://example.com/api/upload', { method: 'POST', body });
}

async function versions() {
	return ownerFetch(`https://example.com/api/versions?key=${encodeURIComponent(key)}`);
}

afterEach(async () => {
	await env.IMAGES.delete(key);
	const records = await env.IMAGES.list({ prefix: `${VERSION_PREFIX}records/`, include: ['customMetadata'] });
	const keys = records.objects.filter((object) => object.customMetadata?.originalKey === key).flatMap((object) => {
		const id = object.key.split('/').at(-1) ?? '';
		return [object.key, `${VERSION_PREFIX}data/${id}`];
	});
	if (keys.length) await env.IMAGES.delete(keys);
});

describe('image replacement and version history', () => {
	it('keeps an exact private old version before replacing a public image', async () => {
		await seed();
		const response = await replace();
		expect(response.status).toBe(200);
		const result = await response.json<{ historyId: string; replaced: boolean }>();
		expect(result.replaced).toBe(true);
		const list = await (await versions()).json<{ versions: Array<{ id: string; size: number; contentType: string }> }>();
		expect(list.versions).toEqual([expect.objectContaining({ id: result.historyId, size: first.length, contentType: 'image/png' })]);
		const preview = await ownerFetch(`https://example.com/api/versions?view=preview&key=${encodeURIComponent(key)}&id=${result.historyId}`);
		expect(preview.status).toBe(200); expect(preview.headers.get('Cache-Control')).toContain('private');
		expect(new Uint8Array(await preview.arrayBuffer())).toEqual(first);
		const hidden = await SELF.fetch(`https://example.com/${VERSION_PREFIX}data/${result.historyId}`);
		expect(hidden.status).toBe(404); await hidden.text();
		const publicImage = await SELF.fetch(`https://example.com/${key}?replacement`);
		expect(publicImage.status).toBe(200); await publicImage.arrayBuffer();
		expect(new Uint8Array(await (await env.IMAGES.get(key))!.arrayBuffer())).toEqual(second);
		expect((await (await ownerFetch('https://example.com/api/files')).json<{ files: Array<{ key: string }> }>()).files.some((file) => file.key.startsWith(VERSION_PREFIX))).toBe(false);
	});

	it('restores a selected version and preserves the current image as a newer history entry', async () => {
		await seed();
		const replaced = await (await replace()).json<{ historyId: string }>();
		const current = await env.IMAGES.head(key);
		const response = await ownerFetch('https://example.com/api/versions', {
			method: 'POST', headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action: 'restore', key, id: replaced.historyId, expectedEtag: current!.etag, expectedVersion: current!.version }),
		});
		expect(response.status).toBe(200);
		expect(new Uint8Array(await (await env.IMAGES.get(key))!.arrayBuffer())).toEqual(first);
		const list = await (await versions()).json<{ versions: Array<{ id: string }> }>();
		expect(list.versions).toHaveLength(2);
		expect(list.versions.some((version) => version.id === replaced.historyId)).toBe(true);
	});

	it('rejects stale replacement requests without creating a version or overwriting a concurrent change', async () => {
		await seed();
		const current = await env.IMAGES.head(key);
		await env.IMAGES.put(key, second, { httpMetadata: { contentType: 'image/png' } });
		const body = new FormData();
		body.set('replace', 'version-v1'); body.set('replaceKey', key); body.set('conflict', 'reject');
		body.set('expectedEtag', current!.etag); body.set('expectedVersion', current!.version);
		body.set('file', new File([first], 'replacement.png', { type: 'image/png' }));
		const response = await ownerFetch('https://example.com/api/upload', { method: 'POST', body });
		expect(response.status).toBe(409);
		expect(new Uint8Array(await (await env.IMAGES.get(key))!.arrayBuffer())).toEqual(second);
		expect((await (await versions()).json<{ versions: unknown[] }>()).versions).toHaveLength(0);
	});

	it('retains no more than five historical versions for one path', async () => {
		await seed();
		for (let index = 0; index < 6; index += 1) {
			const bytes = new Uint8Array([...second, index]);
			expect((await replace(bytes)).status).toBe(200);
		}
		expect((await (await versions()).json<{ versions: unknown[] }>()).versions).toHaveLength(5);
	});
});
