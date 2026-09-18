import { env, SELF } from 'cloudflare:test';
import { afterEach, describe, expect, it } from 'vitest';
import { ownerFetch } from './auth-fixture';
import { moveImage, MoveError } from '../src/move';
import { moveToTrash } from '../src/trash';

const prefix = 'move-tests/';
const key = `${prefix}source/驾驶证.png`;
const target = `${prefix}target/驾驶证.png`;
const bytes = new Uint8Array([1, 2, 3, 4]);
async function seed(path = key) {
	return (await env.IMAGES.put(path, bytes, { httpMetadata: { contentType: 'image/png', cacheControl: 'max-age=60' }, customMetadata: { originalFilename: 'license.png', note: 'keep' } }))!;
}
async function move(directory: string, objects: Pick<R2Object, 'key' | 'etag' | 'version'>[], extra = {}) {
	return ownerFetch('https://example.com/api/files', { method: 'POST', headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ action: 'move', directory, files: objects.map((file) => ({ key: file.key, expectedEtag: file.etag, expectedVersion: file.version })), ...extra }) });
}
function wrapped(overrides: Partial<{ get: R2Bucket['get']; head: R2Bucket['head']; put: (key: string, value: Parameters<R2Bucket['put']>[1], options?: R2PutOptions) => Promise<R2Object | null> }>) {
	return { get: env.IMAGES.get.bind(env.IMAGES), head: env.IMAGES.head.bind(env.IMAGES), put: env.IMAGES.put.bind(env.IMAGES), ...overrides } as R2Bucket;
}
afterEach(async () => {
	const objects = await env.IMAGES.list({ prefix });
	await env.IMAGES.delete(objects.objects.map((object) => object.key));
	await env.IMAGES.delete('move-tests-root.png');
	const records = await env.IMAGES.list({ prefix: '__sgao_trash/records/' });
	for (const record of records.objects) {
		const manifest = await env.IMAGES.get(record.key);
		if ((await manifest?.json<{ key: string }>())?.key.startsWith(prefix)) {
			await env.IMAGES.delete([record.key, record.key.replace('/records/', '/data/')]);
		}
	}
});

describe('batch image directory moves', () => {
	it('requires an owner session and same origin before writing', async () => {
		await seed();
		const response = await SELF.fetch('https://example.com/api/files', { method: 'POST', headers: { Origin: 'https://example.com' }, body: '{}' });
		expect(response.status).toBe(401);
		const crossSite = await ownerFetch('https://example.com/api/files', { method: 'POST', headers: { 'Sec-Fetch-Site': 'cross-site' }, body: '{}' });
		expect(crossSite.status).toBe(403); expect(await env.IMAGES.head(target)).toBeNull();
	});
	it('copies bytes and metadata, returns encoded URLs, hides the old path before cache and lists only the destination', async () => {
		const source = await seed();
		await caches.default.put(new Request(`https://example.com/${key.split('/').map(encodeURIComponent).join('/')}`), new Response('cached-old'));
		const response = await move(`${prefix}target`, [source]);
		expect(response.status).toBe(200); expect(response.headers.get('Cache-Control')).toBe('no-store');
		const result = await response.json<{ moved: Array<{ previousKey: string; file: { key: string; url: string; version: string } }>; failed: unknown[] }>();
		expect(result.moved[0].previousKey).toBe(key); expect(result.moved[0].file.key).toBe(target);
		expect(result.moved[0].file.url).toContain(encodeURIComponent('驾驶证.png')); expect(result.moved[0].file.version).toBeTruthy(); expect(result.failed).toEqual([]);
		const copied = await env.IMAGES.get(target); expect(new Uint8Array(await copied!.arrayBuffer())).toEqual(bytes);
		expect(copied?.httpMetadata).toMatchObject({ contentType: 'image/png', cacheControl: 'max-age=60' });
		expect(copied?.customMetadata).toMatchObject({ originalFilename: 'license.png', note: 'keep', previousKey: key });
		expect((await env.IMAGES.head(key))?.customMetadata?.sgaoTrashId).toMatch(/^move:/);
		expect((await SELF.fetch(`https://example.com/${key.split('/').map(encodeURIComponent).join('/')}`)).status).toBe(404);
		const listed = await (await ownerFetch(`https://example.com/api/files?prefix=${prefix}`)).json<{ files: Array<{ key: string }> }>();
		expect(listed.files.map((file) => file.key)).toEqual([target]);
	});
	it('reports mixed success, existing-target conflict, same-directory skip and missing source individually', async () => {
		const source = await seed(); const conflict = await seed(`${prefix}other/existing.png`); const same = await seed(`${prefix}target/stay.png`);
		await env.IMAGES.put(`${prefix}target/existing.png`, 'existing');
		const missing = { ...source, key: `${prefix}missing.png` };
		const result = await (await move(`${prefix}target`, [source, conflict, same, missing])).json<{ moved: unknown[]; skipped: unknown[]; failed: unknown[] }>();
		expect(result.moved).toHaveLength(1); expect(result.skipped).toEqual([{ key: same.key }]); expect(result.failed).toHaveLength(2);
		expect(await (await env.IMAGES.get(`${prefix}target/existing.png`))?.text()).toBe('existing'); expect((await env.IMAGES.head(conflict.key))?.etag).toBe(conflict.etag);
	});
	it('does not overwrite files with the same basename selected from different directories', async () => {
		const a = await seed(); const b = await seed(`${prefix}other/驾驶证.png`);
		const result = await (await move(`${prefix}target`, [a, b])).json<{ moved: unknown[]; failed: Array<{ key: string }> }>();
		expect(result.moved).toHaveLength(1); expect(result.failed[0].key).toBe(b.key); expect((await env.IMAGES.head(b.key))?.customMetadata?.sgaoTrashId).toBeUndefined();
	});
	it('rejects invalid directories, UTF-8 overlong targets and reserved paths before moving anything', async () => {
		const source = await seed();
		for (const directory of ['/leading', 'a//b', '../escape', 'a/../b', 'a\\b', 'a\u0000b', '__sgao_trash/data', 'admin', 'api/files', '长'.repeat(350)]) {
			expect((await move(directory, [source])).status).toBe(400);
		}
		expect((await env.IMAGES.head(key))?.etag).toBe(source.etag);
	});
	it('rejects malformed JSON, unknown actions, duplicate entries, invalid versions and batches over 50', async () => {
		const source = await seed();
		expect((await ownerFetch('https://example.com/api/files', { method: 'POST', body: 'not-json' })).status).toBe(400);
		for (const extra of [{ action: 'other' }, { files: [] }, { files: [null] }, { files: [{ key, expectedEtag: '' }] }, { files: [{ key: '__sgao_trash/data/x', expectedEtag: source.etag }] }, { files: [{ key, expectedEtag: source.etag, expectedVersion: 5 }] }]) {
			expect((await move(`${prefix}target`, [source], extra)).status).toBe(400);
		}
		expect((await move(`${prefix}target`, [source, source])).status).toBe(400);
		expect((await move(`${prefix}target`, Array(51).fill(source))).status).toBe(400);
		expect(await env.IMAGES.head(target)).toBeNull();
	});
	it('detects changed bytes or metadata version before copying', async () => {
		const source = await seed(); await env.IMAGES.put(key, 'changed');
		const changed = await (await move(`${prefix}target`, [source])).json<{ failed: Array<{ message: string }> }>();
		expect(changed.failed[0].message).toContain('变化'); expect(await env.IMAGES.head(target)).toBeNull();
		const current = await seed();
		await env.IMAGES.put(key, bytes, { customMetadata: { replaced: 'same bytes' } });
		const metadataChanged = await (await move(`${prefix}target`, [current])).json<{ failed: Array<{ message: string }> }>();
		expect(metadataChanged.failed[0].message).toContain('版本'); expect(await env.IMAGES.head(target)).toBeNull();
	});
	it('supports root destinations and safely moving back to a previous move marker', async () => {
		const source = await seed(`${prefix}source/move-tests-root.png`);
		const result = await (await move('', [source])).json<{ moved: Array<{ file: { key: string } }> }>();
		expect(result.moved[0].file.key).toBe('move-tests-root.png');
		const back = await move(`${prefix}source`, [(await env.IMAGES.head('move-tests-root.png'))!]);
		expect((await back.json<{ moved: unknown[] }>()).moved).toHaveLength(1);
		expect(new Uint8Array(await (await env.IMAGES.get(source.key))!.arrayBuffer())).toEqual(bytes);
	});
	it('does not move deleted images or reuse destinations reserved by the recycle bin', async () => {
		const source = await seed(); await seed(target); await moveToTrash(env.IMAGES, target);
		const conflict = await (await move(`${prefix}target`, [source])).json<{ failed: unknown[] }>(); expect(conflict.failed).toHaveLength(1);
		await moveToTrash(env.IMAGES, key);
		const deleted = await (await move(`${prefix}other`, [source])).json<{ failed: unknown[] }>(); expect(deleted.failed).toHaveLength(1);
	});
	it('a target appearing after the head check is never overwritten', async () => {
		const source = await seed();
		const bucket = wrapped({ head: async (path: string) => { if (path === target) { await env.IMAGES.put(target, 'racing target'); return null; } return env.IMAGES.head(path); } });
		await expect(moveImage(bucket, key, target, source.etag)).rejects.toBeInstanceOf(MoveError);
		expect(await (await env.IMAGES.get(target))?.text()).toBe('racing target'); expect((await env.IMAGES.head(key))?.etag).toBe(source.etag);
	});
	it('a source replacement during copy is retained and a copy-only failure reports the preserved destination', async () => {
		const source = await seed();
		const bucket = wrapped({ put: async (path, value, options) => { const result = await env.IMAGES.put(path, value, options); if (path === target) await env.IMAGES.put(key, 'new source'); return result; } });
		try { await moveImage(bucket, key, target, source.etag); throw new Error('expected failure'); }
		catch (error) { expect(error).toBeInstanceOf(MoveError); expect((error as MoveError).copied?.key).toBe(target); }
		expect(await (await env.IMAGES.get(key))?.text()).toBe('new source'); expect(await env.IMAGES.head(target)).not.toBeNull();
	});
	it('a failed source conditional write leaves both images intact instead of deleting the copy', async () => {
		const source = await seed();
		const bucket = wrapped({ put: async (path, value, options) => path === key ? null : env.IMAGES.put(path, value, options) });
		await expect(moveImage(bucket, key, target, source.etag)).rejects.toMatchObject({ copied: expect.objectContaining({ key: target }) });
		expect((await env.IMAGES.head(key))?.etag).toBe(source.etag); expect(await env.IMAGES.head(target)).not.toBeNull();
	});
	it('reconciles an exception after the source marker was committed as a completed move', async () => {
		const source = await seed();
		const bucket = wrapped({ put: async (path, value, options) => { const result = await env.IMAGES.put(path, value, options); if (path === key) throw new Error('response lost'); return result; } });
		expect((await moveImage(bucket, key, target, source.etag)).skipped).toBe(false);
		expect((await env.IMAGES.head(key))?.customMetadata?.sgaoTrashId).toMatch(/^move:/);
	});
	it('source replacement after the final head check is protected by the conditional marker write', async () => {
		const source = await seed();
		const bucket = wrapped({ put: async (path, value, options) => { if (path === key) await env.IMAGES.put(key, 'last instant replacement'); return env.IMAGES.put(path, value, options); } });
		await expect(moveImage(bucket, key, target, source.etag)).rejects.toMatchObject({ copied: expect.objectContaining({ key: target }) });
		expect(await (await env.IMAGES.get(key))?.text()).toBe('last instant replacement'); expect(await env.IMAGES.head(target)).not.toBeNull();
	});
	it('a destination copy write failure does not mark or remove the original', async () => {
		const source = await seed(); const bucket = wrapped({ put: async () => { throw new Error('copy write failed'); } });
		await expect(moveImage(bucket, key, target, source.etag)).rejects.toBeInstanceOf(MoveError);
		expect((await env.IMAGES.head(key))?.etag).toBe(source.etag); expect(await env.IMAGES.head(target)).toBeNull();
	});
});
