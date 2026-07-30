import { env, SELF } from 'cloudflare:test';
import { afterEach, describe, expect, it } from 'vitest';

const testKeys = ['common/admin-files-test.png', 'docs/second-test.png'];
const uploadTestPrefix = 'conflict-tests/';

async function uploadTestImage(
	filename: string,
	content: number[],
	options: { conflict?: 'reject' | 'rename' | 'overwrite'; expectedEtag?: string } = {},
): Promise<Response> {
	const formData = new FormData();

	formData.append('folder', uploadTestPrefix.slice(0, -1));
	formData.append('file', new File([new Uint8Array(content)], filename, { type: 'image/png' }));

	if (options.conflict) {
		formData.append('conflict', options.conflict);
	}

	if (options.expectedEtag) {
		formData.append('expectedEtag', options.expectedEtag);
	}

	return SELF.fetch('https://example.com/api/upload', {
		method: 'POST',
		headers: { Authorization: `Bearer ${env.UPLOAD_TOKEN}` },
		body: formData,
	});
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
		expect(response.headers.get('WWW-Authenticate')).toBe('Bearer');
		expect(await response.json()).toMatchObject({
			success: false,
			message: 'Unauthorized',
		});
	});

	it('lists R2 files with metadata and deletes a selected file', async () => {
		await env.IMAGES.put(testKeys[0], new Uint8Array([1, 2, 3]), {
			httpMetadata: { contentType: 'image/png' },
			customMetadata: { originalFilename: 'original.png' },
		});
		await env.IMAGES.put(testKeys[1], new Uint8Array([4, 5]));

		const authorization = { Authorization: `Bearer ${env.UPLOAD_TOKEN}` };
		const listResponse = await SELF.fetch('https://example.com/api/files?prefix=common/', {
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

		const deleteResponse = await SELF.fetch(`https://example.com/api/files?key=${encodeURIComponent(testKeys[0])}`, {
			method: 'DELETE',
			headers: authorization,
		});

		expect(deleteResponse.status).toBe(200);
		expect(await env.IMAGES.head(testKeys[0])).toBeNull();
	});

	it('returns 404 when deleting a missing file', async () => {
		const response = await SELF.fetch('https://example.com/api/files?key=common%2Fmissing.png', {
			method: 'DELETE',
			headers: { Authorization: `Bearer ${env.UPLOAD_TOKEN}` },
		});

		expect(response.status).toBe(404);
		expect(await response.json()).toMatchObject({
			success: false,
			message: 'File not found',
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

		expect([...new Uint8Array(await object!.arrayBuffer())]).toEqual([4]);
	});
});
