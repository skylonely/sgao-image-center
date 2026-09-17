import { env, SELF } from 'cloudflare:test';
import { afterEach, describe, expect, it } from 'vitest';
import { ownerFetch, token } from './auth-fixture';
import { isDeletedImage, moveToTrash, TRASH_PREFIX, TRASH_RECORDS } from '../src/trash';
import { getImageFromR2 } from '../src/storage/r2';

const key = 'recycle-tests/photo.png';
const bytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 12]);
const metadata = { originalFilename: 'photo.png', uploadedAt: '2026-09-17T00:00:00Z' };
async function seed() { await env.IMAGES.put(key, bytes, { httpMetadata: { contentType: 'image/png' }, customMetadata: metadata }); }
async function remove() {
	return ownerFetch(`https://example.com/api/files?key=${encodeURIComponent(key)}`, { method: 'DELETE' });
}
async function trash() { return (await (await remove()).json<{ trash: { id: string } }>()).trash.id; }
async function restore(id: string) {
	return ownerFetch('https://example.com/api/trash', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
}
async function purge(id: string, confirmation?: string) {
	return ownerFetch('https://example.com/api/trash', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, confirmation }) });
}
afterEach(async () => {
	for (const prefix of ['recycle-tests/', TRASH_PREFIX]) {
		const result = await env.IMAGES.list({ prefix }); await env.IMAGES.delete(result.objects.map((object) => object.key));
	}
});

function interceptedBucket(put: R2Bucket['put']): R2Bucket {
	return new Proxy(env.IMAGES, { get(target, property) {
		if (property === 'put') return put;
		const value = Reflect.get(target, property); return typeof value === 'function' ? value.bind(target) : value;
	} });
}

describe('image recycle bin', () => {
	it('refuses normal rename operations on a deleted placeholder', async () => {
		await seed(); const id = await trash();
		const response = await ownerFetch('https://example.com/api/files', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, newFilename: 'renamed.png' }) });
		expect(response.status).toBe(404); expect(await env.IMAGES.head(`${TRASH_RECORDS}${id}`)).not.toBeNull();
	});
	it('does not serve a deletion marker even if the preceding route check raced deletion', async () => {
		await seed(); await trash();
		const response = await getImageFromR2(key, env);
		expect(response?.status).toBe(404); expect(response?.headers.get('Cache-Control')).toBe('no-store');
	});
	it('rejects a cached old image after a same-path replacement', async () => {
		await seed();
		const old = await env.IMAGES.head(key);
		const url = `https://example.com/${key}?cached-variant`;
		await caches.default.put(new Request(url), new Response(bytes, { headers: { ETag: old!.httpEtag } }));
		await trash(); await env.IMAGES.put(key, 'new-image', { httpMetadata: { contentType: 'image/png' } });
		const response = await SELF.fetch(url); expect(await response.text()).toBe('new-image');
	});
	it('skips internal-only pages while preserving active-file pagination', async () => {
		await seed();
		await Promise.all(Array.from({ length: 4 }, (_, index) => env.IMAGES.put(`${TRASH_PREFIX}data/test-${index}`, 'private')));
		const response = await ownerFetch('https://example.com/api/files?limit=1');
		const page = await response.json<{ files: { key: string }[] }>();
		expect(page.files).toHaveLength(1); expect(page.files[0].key).toBe(key);
	});
	it('moves bytes and metadata into the private recycle bin and excludes them from files/directories', async () => {
		await seed(); const id = await trash();
		expect(isDeletedImage(await env.IMAGES.head(key))).toBe(true);
		const list = await (await ownerFetch('https://example.com/api/trash')).json<{ files: { id: string; key: string; size: number }[] }>();
		expect(list.files).toContainEqual(expect.objectContaining({ id, key, size: bytes.length }));
		const files = await (await ownerFetch('https://example.com/api/files')).json<{ files: { key: string }[] }>();
		expect(files.files.some((file) => file.key === key || file.key.startsWith(TRASH_PREFIX))).toBe(false);
		const dirs = await (await ownerFetch('https://example.com/api/files?view=directories')).json<{ directories: string[] }>();
		expect(dirs.directories).not.toContain('__sgao_trash'); expect(dirs.directories).not.toContain('recycle-tests');
	});
	it('blocks public cached images, HEAD and private backup URLs after soft deletion', async () => {
		await seed();
		await caches.default.put(new Request(`https://example.com/${key}`), new Response(bytes));
		const id = await trash();
		for (const path of [key, `${TRASH_PREFIX}data/${id}`, `${TRASH_RECORDS}${id}`, `%5f%5fsgao_trash/data/${id}`]) {
			for (const method of ['GET', 'HEAD']) expect((await SELF.fetch(`https://example.com/${path}`, { method })).status).toBe(404);
		}
	});
	it('restores original bytes, metadata and URL without exposing backup URLs', async () => {
		await seed(); const id = await trash(); expect((await restore(id)).status).toBe(200);
		const image = await env.IMAGES.get(key); expect(image!.customMetadata).toEqual(metadata);
		expect(image!.httpMetadata?.contentType).toBe('image/png'); expect(new Uint8Array(await image!.arrayBuffer())).toEqual(bytes);
		const publicImage = await SELF.fetch(`https://example.com/${key}?restored`);
		expect(publicImage.status).toBe(200); await publicImage.arrayBuffer();
		expect(await env.IMAGES.head(`${TRASH_RECORDS}${id}`)).toBeNull();
	});
	it('allows uploading the same filename again and never overwrites it on restore or permanent deletion', async () => {
		await seed(); const id = await trash();
		const newBytes = new Uint8Array([...bytes, 99]); const form = new FormData();
		form.set('folder', 'recycle-tests'); form.set('file', new File([newBytes], 'photo.png', { type: 'image/png' }));
		expect((await ownerFetch('https://example.com/api/upload', { method: 'POST', body: form })).status).toBe(200);
		expect((await restore(id)).status).toBe(409);
		expect(await env.IMAGES.head(`${TRASH_RECORDS}${id}`)).not.toBeNull();
		expect((await purge(id, 'DELETE')).status).toBe(200);
		expect(new Uint8Array(await (await env.IMAGES.get(key))!.arrayBuffer())).toEqual(newBytes);
	});
	it('requires an explicit confirmation and removes only private backup data', async () => {
		await seed(); const id = await trash();
		expect((await purge(id)).status).toBe(400); expect(await env.IMAGES.head(`${TRASH_PREFIX}data/${id}`)).not.toBeNull();
		expect((await purge(id, 'DELETE')).status).toBe(200);
		expect(await env.IMAGES.head(`${TRASH_PREFIX}data/${id}`)).toBeNull();
		expect(await env.IMAGES.head(`${TRASH_RECORDS}${id}`)).toBeNull();
		expect((await SELF.fetch(`https://example.com/${key}`)).status).toBe(404);
		expect((await restore(id)).status).toBe(404);
	});
	it('previews private images only with a verified owner session', async () => {
		await seed(); const id = await trash(); const url = `https://example.com/api/trash?view=preview&id=${id}`;
		expect((await SELF.fetch(url)).status).toBe(401);
		const preview = await ownerFetch(url); expect(preview.status).toBe(200);
		expect(preview.headers.get('Cache-Control')).toContain('private'); expect(preview.headers.get('Content-Security-Policy')).toContain('sandbox');
		expect(new Uint8Array(await preview.arrayBuffer())).toEqual(bytes);
	});
	it('refuses signed-out/other accounts and cross-site restore/purge requests', async () => {
		const other = await token({ email: 'other@gmail.com' }); const owner = await token();
		for (const method of ['GET', 'POST', 'DELETE']) {
			expect((await SELF.fetch('https://example.com/api/trash', { method, headers: { Origin: 'https://example.com' } })).status).toBe(401);
			expect((await SELF.fetch('https://example.com/api/trash', { method, headers: { Origin: 'https://example.com', 'Cf-Access-Jwt-Assertion': other } })).status).toBe(403);
			if (method !== 'GET') expect((await SELF.fetch('https://example.com/api/trash', { method, headers: { Origin: 'https://evil.example', 'Cf-Access-Jwt-Assertion': owner } })).status).toBe(403);
		}
	});
	it('validates IDs, internal keys, traversal and malformed JSON before modifying R2', async () => {
		for (const id of ['../photo.png', '', 'not-a-uuid']) expect((await restore(id)).status).toBe(400);
		for (const target of [`${TRASH_PREFIX}data/x`, '../photo.png', 'folder/../photo.png']) {
			expect((await ownerFetch(`https://example.com/api/files?key=${encodeURIComponent(target)}`, { method: 'DELETE' })).status).toBe(400);
		}
		expect((await ownerFetch('https://example.com/api/trash', { method: 'POST', body: '{' })).status).toBe(400);
	});
	it('does not duplicate entries when deletion is repeated', async () => {
		await seed(); await trash(); expect((await remove()).status).toBe(404);
		expect((await env.IMAGES.list({ prefix: TRASH_RECORDS })).objects).toHaveLength(1);
	});
	it('reports partial batch failures rather than falsely claiming all files were removed', async () => {
		await seed(); const missing = 'recycle-tests/missing.png';
		const response = await ownerFetch('https://example.com/api/files', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keys: [key, missing] }) });
		expect(await response.json()).toMatchObject({ success: true, deletedKeys: [key], deletedCount: 1, failed: [{ key: missing }] });
	});
	it('leaves the original intact if backup writing fails', async () => {
		await seed(); const bucket = interceptedBucket((async () => { throw new Error('simulated storage failure'); }) as R2Bucket['put']);
		await expect(moveToTrash(bucket, key)).rejects.toThrow('simulated');
		expect(isDeletedImage(await env.IMAGES.head(key))).toBe(false);
		expect(new Uint8Array(await (await env.IMAGES.get(key))!.arrayBuffer())).toEqual(bytes);
	});
	it('keeps a concurrent upload intact when the conditional tombstone cannot be written', async () => {
		await seed();
		const put = (async (target: string, value: ReadableStream, options: R2PutOptions) => {
			if (target === key) await env.IMAGES.put(key, 'concurrent-new-image');
			return env.IMAGES.put(target, value, options);
		}) as R2Bucket['put'];
		await expect(moveToTrash(interceptedBucket(put), key)).rejects.toThrow('变化');
		expect(await (await env.IMAGES.get(key))!.text()).toBe('concurrent-new-image');
		expect((await env.IMAGES.list({ prefix: TRASH_RECORDS })).objects).toHaveLength(0);
	});
});
