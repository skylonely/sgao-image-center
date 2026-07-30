const DEFAULT_PAGE_SIZE = 100;
const MAX_PAGE_SIZE = 200;
const MAX_KEY_LENGTH = 1024;
const IMAGE_ORIGIN = 'https://img.sgao.cc';

function jsonResponse(data: unknown, status = 200, extraHeaders?: HeadersInit): Response {
	const headers = new Headers(extraHeaders);

	headers.set('Cache-Control', 'no-store');
	headers.set('X-Content-Type-Options', 'nosniff');

	return Response.json(data, { status, headers });
}

function isAuthorized(request: Request, env: Env): boolean {
	const authorization = request.headers.get('Authorization');

	return Boolean(env.UPLOAD_TOKEN) && authorization === `Bearer ${env.UPLOAD_TOKEN}`;
}

function imageUrlForKey(key: string): string {
	const encodedKey = key
		.split('/')
		.map((segment) => encodeURIComponent(segment))
		.join('/');

	return `${IMAGE_ORIGIN}/${encodedKey}`;
}

function parseLimit(value: string | null): number {
	if (!value) {
		return DEFAULT_PAGE_SIZE;
	}

	const parsed = Number.parseInt(value, 10);

	if (!Number.isFinite(parsed)) {
		return DEFAULT_PAGE_SIZE;
	}

	return Math.min(Math.max(parsed, 1), MAX_PAGE_SIZE);
}

async function listFiles(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url);
	const prefix = url.searchParams.get('prefix')?.replace(/^\/+/, '') ?? '';
	const cursor = url.searchParams.get('cursor') || undefined;

	if (prefix.length > MAX_KEY_LENGTH) {
		return jsonResponse({ success: false, message: 'Prefix is too long' }, 400);
	}

	try {
		const result = await env.IMAGES.list({
			limit: parseLimit(url.searchParams.get('limit')),
			prefix,
			cursor,
			include: ['httpMetadata', 'customMetadata'],
		});

		return jsonResponse({
			success: true,
			files: result.objects.map((object) => ({
				key: object.key,
				url: imageUrlForKey(object.key),
				size: object.size,
				uploaded: object.uploaded.toISOString(),
				contentType: object.httpMetadata?.contentType ?? 'application/octet-stream',
				originalFilename: object.customMetadata?.originalFilename ?? null,
			})),
			truncated: result.truncated,
			cursor: result.truncated ? result.cursor : null,
		});
	} catch (error) {
		console.error('Failed to list files:', error);

		return jsonResponse({ success: false, message: 'Failed to load files' }, 500);
	}
}

async function deleteFile(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url);
	const key = url.searchParams.get('key')?.replace(/^\/+/, '') ?? '';

	if (!key || key.length > MAX_KEY_LENGTH) {
		return jsonResponse({ success: false, message: 'Invalid file key' }, 400);
	}

	try {
		const existing = await env.IMAGES.head(key);

		if (!existing) {
			return jsonResponse({ success: false, message: 'File not found' }, 404);
		}

		await env.IMAGES.delete(key);

		// A deleted R2 object can still be served by Cache API until its cached copy
		// is removed. Clear the public image URL after the strongly consistent delete.
		await caches.default.delete(new Request(imageUrlForKey(key), { method: 'GET' }));

		return jsonResponse({
			success: true,
			key,
		});
	} catch (error) {
		console.error('Failed to delete file:', error);

		return jsonResponse({ success: false, message: 'Failed to delete file' }, 500);
	}
}

export async function handleFiles(request: Request, env: Env): Promise<Response> {
	if (!isAuthorized(request, env)) {
		return jsonResponse(
			{ success: false, message: 'Unauthorized' },
			401,
			{ 'WWW-Authenticate': 'Bearer' },
		);
	}

	switch (request.method) {
		case 'GET':
			return listFiles(request, env);

		case 'DELETE':
			return deleteFile(request, env);

		default:
			return jsonResponse(
				{ success: false, message: 'Method Not Allowed' },
				405,
				{ Allow: 'GET, DELETE' },
			);
	}
}
