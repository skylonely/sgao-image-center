import { env, SELF } from 'cloudflare:test';
import { afterEach, describe, expect, it } from 'vitest';
import { ownerFetch } from './auth-fixture';

const testKeys = ['common/admin-files-test.png', 'docs/second-test.png'];
const uploadTestPrefix = 'conflict-tests/';
const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

async function uploadTestImage(
	filename: string,
	content: number[],
	options: {
		conflict?: 'reject' | 'rename' | 'overwrite';
		expectedEtag?: string;
		contentType?: string;
		includePngSignature?: boolean;
		folder?: string;
	} = {},
): Promise<Response> {
	const formData = new FormData();
	const bytes = options.includePngSignature === false ? content : [...pngSignature, ...content];

	formData.append('folder', options.folder ?? uploadTestPrefix.slice(0, -1));
	formData.append('file', new File([new Uint8Array(bytes)], filename, { type: options.contentType ?? 'image/png' }));

	if (options.conflict) {
		formData.append('conflict', options.conflict);
	}

	if (options.expectedEtag) {
		formData.append('expectedEtag', options.expectedEtag);
	}

	return ownerFetch('https://example.com/api/upload', {
		method: 'POST',
		body: formData,
	});
}

async function restoreBackupImage(key: string, content: number[], options: { conflict?: string } = {}): Promise<Response> {
	const formData = new FormData();
	formData.append('restore', 'backup-v1'); formData.append('restoreKey', key); formData.append('conflict', options.conflict ?? 'reject');
	formData.append('file', new File([new Uint8Array([...pngSignature, ...content])], key.split('/').at(-1) ?? 'image.png', { type: 'image/png' }));
	return ownerFetch('https://example.com/api/upload', { method: 'POST', body: formData });
}

afterEach(async () => {
	await env.IMAGES.delete(testKeys);

	const uploaded = await env.IMAGES.list({ prefix: uploadTestPrefix });

	if (uploaded.objects.length) {
		await env.IMAGES.delete(uploaded.objects.map((object) => object.key));
	}
});

describe('image center worker', () => {
	it('reports that the service is running', async () => {
		const response = await SELF.fetch('https://example.com/');

		expect(response.status).toBe(200);
		expect(await response.text()).toBe('Image Center Running');
	});

	it('protects the file management API', async () => {
		const response = await SELF.fetch('https://example.com/api/files');

		expect(response.status).toBe(401);
		expect(response.headers.get('Cache-Control')).toContain('no-store');
		expect(await response.json()).toMatchObject({
			success: false,
			code: 'AUTH_REQUIRED',
		});
	});

	it('lists R2 files with metadata and deletes a selected file', async () => {
		await env.IMAGES.put(testKeys[0], new Uint8Array([1, 2, 3]), {
			httpMetadata: { contentType: 'image/png' },
			customMetadata: { originalFilename: 'original.png' },
		});
		await env.IMAGES.put(testKeys[1], new Uint8Array([4, 5]));

		const authorization = {};
		const listResponse = await ownerFetch('https://example.com/api/files?prefix=common/', {
			headers: authorization,
		});
		const listResult = await listResponse.json<{
			success: boolean;
			files: Array<{
				key: string;
				url: string;
				size: number;
				contentType: string;
				originalFilename: string | null;
			}>;
		}>();

		expect(listResponse.status).toBe(200);
		expect(listResult.success).toBe(true);
		expect(listResult.files).toContainEqual(
			expect.objectContaining({
				key: testKeys[0],
				url: `https://img.sgao.cc/${testKeys[0]}`,
				size: 3,
				contentType: 'image/png',
				originalFilename: 'original.png',
			}),
		);
		expect(listResult.files.some((file) => file.key === testKeys[1])).toBe(false);

		const deleteResponse = await ownerFetch(`https://example.com/api/files?key=${encodeURIComponent(testKeys[0])}`, {
			method: 'DELETE',
			headers: authorization,
		});

		expect(deleteResponse.status).toBe(200);
		expect((await env.IMAGES.head(testKeys[0]))?.customMetadata?.sgaoTrashId).toBeTruthy();
	});

	it('returns 404 when deleting a missing file', async () => {
		const response = await ownerFetch('https://example.com/api/files?key=common%2Fmissing.png', {
			method: 'DELETE',
		});

		expect(response.status).toBe(404);
		expect(await response.json()).toMatchObject({
			success: false,
			message: '图片不存在或已在回收站。',
		});
	});

	it('rejects a duplicate upload by default without changing the existing object', async () => {
		const key = `${uploadTestPrefix}logo.png`;

		await env.IMAGES.put(key, new Uint8Array([9, 9, 9]), {
			httpMetadata: { contentType: 'image/png' },
		});

		const response = await uploadTestImage('logo.png', [1, 2, 3]);
		const result = await response.json<{
			code: string;
			key: string;
			etag: string;
			suggestedFilename: string;
		}>();

		expect(response.status).toBe(409);
		expect(result).toMatchObject({
			code: 'FILE_EXISTS',
			key,
		});
		expect(result.etag).toBeTruthy();
		expect(result.suggestedFilename).toMatch(/^logo-\d{8}-\d{6}\.png$/);

		const unchanged = await env.IMAGES.get(key);

		expect([...new Uint8Array(await unchanged!.arrayBuffer())]).toEqual([9, 9, 9]);
	});

	it('restores a backup to its exact original path without overwrite or rename choices', async () => {
		const key = `${uploadTestPrefix}nested/restored.png`;
		const first = await restoreBackupImage(key, [1, 2, 3]);
		expect(first.status).toBe(200); expect(await first.json()).toMatchObject({ success: true, key, restored: true, renamed: false, overwritten: false });
		const duplicate = await restoreBackupImage(key, [9]);
		expect(duplicate.status).toBe(409); expect(await duplicate.json()).toMatchObject({ code: 'FILE_EXISTS', key });
		const object = await env.IMAGES.get(key); expect([...new Uint8Array(await object!.arrayBuffer())]).toEqual([...pngSignature, 1, 2, 3]);
		const invalid = await restoreBackupImage('../outside.png', [1]);
		expect(invalid.status).toBe(400);
		const overwrite = await restoreBackupImage(`${uploadTestPrefix}other.png`, [1], { conflict: 'overwrite' });
		expect(overwrite.status).toBe(400);
	});

	it('can keep both duplicate files by generating a unique timestamped name', async () => {
		const key = `${uploadTestPrefix}logo.png`;

		await env.IMAGES.put(key, new Uint8Array([9]));

		const response = await uploadTestImage('logo.png', [1, 2, 3], { conflict: 'rename' });
		const result = await response.json<{
			success: boolean;
			key: string;
			filename: string;
			renamed: boolean;
			overwritten: boolean;
		}>();

		expect(response.status).toBe(200);
		expect(result.success).toBe(true);
		expect(result.renamed).toBe(true);
		expect(result.overwritten).toBe(false);
		expect(result.filename).toMatch(/^logo-\d{8}-\d{6}\.png$/);
		expect(result.key).not.toBe(key);
		expect(await env.IMAGES.head(key)).not.toBeNull();
		expect(await env.IMAGES.head(result.key)).not.toBeNull();
	});

	it('only overwrites the exact version that the user confirmed', async () => {
		const key = `${uploadTestPrefix}logo.png`;

		await env.IMAGES.put(key, new Uint8Array([1]));

		const conflictResponse = await uploadTestImage('logo.png', [2]);
		const conflict = await conflictResponse.json<{ etag: string }>();

		await env.IMAGES.put(key, new Uint8Array([3]));

		const staleOverwrite = await uploadTestImage('logo.png', [4], {
			conflict: 'overwrite',
			expectedEtag: conflict.etag,
		});

		expect(staleOverwrite.status).toBe(409);
		expect(await staleOverwrite.json()).toMatchObject({ code: 'FILE_CHANGED' });

		const latestConflict = await uploadTestImage('logo.png', [4]);
		const latest = await latestConflict.json<{ etag: string }>();
		const overwriteResponse = await uploadTestImage('logo.png', [4], {
			conflict: 'overwrite',
			expectedEtag: latest.etag,
		});
		const overwrite = await overwriteResponse.json<{
			success: boolean;
			renamed: boolean;
			overwritten: boolean;
		}>();

		expect(overwriteResponse.status).toBe(200);
		expect(overwrite).toMatchObject({
			success: true,
			renamed: false,
			overwritten: true,
		});

		const object = await env.IMAGES.get(key);

		expect([...new Uint8Array(await object!.arrayBuffer())]).toEqual([...pngSignature, 4]);
	});

	it('rejects unsupported, mismatched and disguised file types', async () => {
		const htmlResponse = await uploadTestImage('page.html', [0x3c, 0x68, 0x74, 0x6d, 0x6c], {
			contentType: 'text/html',
			includePngSignature: false,
		});
		const extensionMismatch = await uploadTestImage('photo.jpg', [1, 2, 3]);
		const disguisedHtml = await uploadTestImage('page.png', [0x3c, 0x68, 0x74, 0x6d, 0x6c], {
			includePngSignature: false,
		});

		expect(htmlResponse.status).toBe(415);
		expect(await htmlResponse.json()).toMatchObject({ code: 'UNSUPPORTED_FILE_TYPE' });
		expect(extensionMismatch.status).toBe(415);
		expect(await extensionMismatch.json()).toMatchObject({ code: 'FILE_EXTENSION_MISMATCH' });
		expect(disguisedHtml.status).toBe(415);
		expect(await disguisedHtml.json()).toMatchObject({ code: 'INVALID_FILE_CONTENT' });
	});

	it('rejects files over 10 MB before writing to R2', async () => {
		const oversized = new Uint8Array(10 * 1024 * 1024 + 1);
		const formData = new FormData();

		oversized.set(pngSignature);
		formData.append('folder', uploadTestPrefix.slice(0, -1));
		formData.append('file', new File([oversized], 'large.png', { type: 'image/png' }));

		const response = await ownerFetch('https://example.com/api/upload', {
			method: 'POST',
			body: formData,
		});

		expect(response.status).toBe(413);
		expect(await response.json()).toMatchObject({ code: 'FILE_TOO_LARGE' });
		expect(await env.IMAGES.head(`${uploadTestPrefix}large.png`)).toBeNull();
	});

	it('accepts safe SVG files and rejects active SVG content', async () => {
		const safeSvg = '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>';
		const unsafeSvg = '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><script>alert(1)</script></svg>';
		const safeResponse = await uploadTestImage('safe.svg', [...new TextEncoder().encode(safeSvg)], {
			contentType: 'image/svg+xml',
			includePngSignature: false,
		});
		const unsafeResponse = await uploadTestImage('unsafe.svg', [...new TextEncoder().encode(unsafeSvg)], {
			contentType: 'image/svg+xml',
			includePngSignature: false,
		});

		expect(safeResponse.status).toBe(200);
		expect(unsafeResponse.status).toBe(415);
		expect(await unsafeResponse.json()).toMatchObject({ code: 'INVALID_FILE_CONTENT' });
	});

	it('uploads into a valid custom nested directory', async () => {
		const response = await uploadTestImage('nested.png', [1, 2, 3], {
			folder: 'conflict-tests/guides/intro',
		});
		const result = await response.json<{ success: boolean; key: string; folder: string }>();

		expect(response.status).toBe(200);
		expect(result).toMatchObject({
			success: true,
			key: 'conflict-tests/guides/intro/nested.png',
			folder: 'conflict-tests/guides/intro',
		});
		expect(await env.IMAGES.head(result.key)).not.toBeNull();

		const directoriesResponse = await ownerFetch('https://example.com/api/files?view=directories');
		const directories = await directoriesResponse.json<{ success: boolean; directories: string[] }>();

		expect(directoriesResponse.status).toBe(200);
		expect(directories.success).toBe(true);
		expect(directories.directories).toEqual(
			expect.arrayContaining([
				'conflict-tests',
				'conflict-tests/guides',
				'conflict-tests/guides/intro',
			]),
		);
	});

	it('renames a file without changing its contents or overwriting another key', async () => {
		const sourceKey = `${uploadTestPrefix}before.png`;
		const targetKey = `${uploadTestPrefix}after.png`;

		await env.IMAGES.put(sourceKey, new Uint8Array([...pngSignature, 7]), {
			httpMetadata: { contentType: 'image/png', cacheControl: 'public, max-age=60' },
			customMetadata: { originalFilename: 'before.png' },
		});

		const source = await env.IMAGES.head(sourceKey);
		const response = await ownerFetch('https://example.com/api/files', {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				key: sourceKey,
				newFilename: 'after.png',
				expectedEtag: source!.etag,
			}),
		});
		const result = await response.json<{ success: boolean; previousKey: string; file: { key: string; etag: string } }>();

		expect(response.status).toBe(200);
		expect(result).toMatchObject({
			success: true,
			previousKey: sourceKey,
			file: { key: targetKey },
		});
		expect(await env.IMAGES.head(sourceKey)).toBeNull();

		const renamed = await env.IMAGES.get(targetKey);

		expect([...new Uint8Array(await renamed!.arrayBuffer())]).toEqual([...pngSignature, 7]);
		expect(renamed!.httpMetadata?.contentType).toBe('image/png');

		await env.IMAGES.put(sourceKey, new Uint8Array([1]));

		const conflictResponse = await ownerFetch('https://example.com/api/files', {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				key: sourceKey,
				newFilename: 'after.png',
			}),
		});

		expect(conflictResponse.status).toBe(409);
		expect(await conflictResponse.json()).toMatchObject({ code: 'FILE_EXISTS' });
	});

	it('stores tags and favorite state with the image while preserving bytes and rejects stale edits', async () => {
		const key = `${uploadTestPrefix}tagged.png`;
		const bytes = new Uint8Array([...pngSignature, 42]);
		await env.IMAGES.put(key, bytes, {
			httpMetadata: { contentType: 'image/png', cacheControl: 'public, max-age=60' },
			customMetadata: { originalFilename: 'tagged.png', uploadedAt: '2026-09-23T00:00:00Z' },
		});
		const current = await env.IMAGES.head(key);
		const response = await ownerFetch('https://example.com/api/files', {
			method: 'PATCH', headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action: 'metadata', key, expectedEtag: current!.etag, expectedVersion: current!.version, tags: ['旅行', '证件', '旅行'], favorite: true }),
		});
		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({ success: true, file: { key, tags: ['旅行', '证件'], favorite: true, uploaded: '2026-09-23T00:00:00Z' } });
		const updated = await env.IMAGES.get(key);
		expect(updated!.customMetadata).toMatchObject({ originalFilename: 'tagged.png', sgaoTags: '["旅行","证件"]', sgaoFavorite: '1' });
		expect(new Uint8Array(await updated!.arrayBuffer())).toEqual(bytes);
		const stale = await ownerFetch('https://example.com/api/files', {
			method: 'PATCH', headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action: 'metadata', key, expectedEtag: current!.etag, expectedVersion: current!.version, tags: [], favorite: false }),
		});
		expect(stale.status).toBe(409);
	});

	it('rejects unsafe or oversized tag payloads before changing R2 metadata', async () => {
		const key = `${uploadTestPrefix}invalid-tags.png`;
		await env.IMAGES.put(key, new Uint8Array([...pngSignature, 4]), { httpMetadata: { contentType: 'image/png' } });
		const current = await env.IMAGES.head(key);
		const response = await ownerFetch('https://example.com/api/files', {
			method: 'PATCH', headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action: 'metadata', key, expectedEtag: current!.etag, expectedVersion: current!.version, tags: Array.from({ length: 13 }, (_, index) => `tag-${index}`), favorite: false }),
		});
		expect(response.status).toBe(400);
		expect((await env.IMAGES.head(key))?.customMetadata?.sgaoTags).toBeUndefined();
	});

	it('deletes multiple selected files in one request', async () => {
		const keys = [`${uploadTestPrefix}batch-1.png`, `${uploadTestPrefix}batch-2.png`, `${uploadTestPrefix}batch-3.png`];

		await Promise.all(keys.map((key, index) => env.IMAGES.put(key, new Uint8Array([index]))));

		const response = await ownerFetch('https://example.com/api/files', {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ keys }),
		});

		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({
			success: true,
			deletedKeys: keys,
			deletedCount: 3,
		});

		for (const key of keys) {
			expect((await env.IMAGES.head(key))?.customMetadata?.sgaoTrashId).toBeTruthy();
		}
	});
});
