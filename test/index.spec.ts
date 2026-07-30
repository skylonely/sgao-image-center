import { env, SELF } from 'cloudflare:test';
import { afterEach, describe, expect, it } from 'vitest';

const testKeys = ['common/admin-files-test.png', 'docs/second-test.png'];

afterEach(async () => {
	await env.IMAGES.delete(testKeys);
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
});
