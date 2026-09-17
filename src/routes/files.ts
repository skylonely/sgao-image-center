import { authorizeImageRequest } from '../auth';
import { isDeletedImage, isImageKey, isTrashKey, moveToTrash, TrashError } from '../trash';

const DEFAULT_PAGE_SIZE = 100;
const MAX_PAGE_SIZE = 200;
const MAX_KEY_LENGTH = 1024;
const MAX_BATCH_DELETE = 50;
const IMAGE_ORIGIN = 'https://img.sgao.cc';

function jsonResponse(data: unknown, status = 200, extraHeaders?: HeadersInit): Response {
	const headers = new Headers(extraHeaders);

	headers.set('Cache-Control', 'no-store');
	headers.set('X-Content-Type-Options', 'nosniff');

	return Response.json(data, { status, headers });
}

function imageUrlForKey(key: string): string {
	const encodedKey = key
		.split('/')
		.map((segment) => encodeURIComponent(segment))
		.join('/');

	return `${IMAGE_ORIGIN}/${encodedKey}`;
}

function isValidKey(key: string): boolean {
	return isImageKey(key);
}

function filenameFromKey(key: string): string {
	return key.split('/').at(-1) ?? key;
}

function fileRecord(object: R2Object, key = object.key) {
	return {
		key,
		url: imageUrlForKey(key),
		size: object.size,
		uploaded: object.uploaded.toISOString(),
		contentType: object.httpMetadata?.contentType ?? 'application/octet-stream',
		originalFilename: object.customMetadata?.originalFilename ?? null,
		etag: object.etag,
	};
}

function normalizeNewFilename(value: unknown): string | null {
	if (typeof value !== 'string') {
		return null;
	}

	const filename = value.trim();

	if (
		!filename ||
		filename === '.' ||
		filename === '..' ||
		filename.includes('/') ||
		filename.includes('\\') ||
		/[\u0000-\u001f\u007f]/.test(filename) ||
		!/^[-\p{L}\p{N}_][-\p{L}\p{N}_. ]*$/u.test(filename)
	) {
		return null;
	}

	return filename;
}

function filenameExtension(filename: string): string {
	const extensionIndex = filename.lastIndexOf('.');

	return extensionIndex > 0 ? filename.slice(extensionIndex + 1).toLowerCase() : '';
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

function directoriesFromKeys(keys: string[]): string[] {
	const directories = new Set<string>();

	for (const key of keys) {
		const segments = key.split('/');

		segments.pop();

		for (let depth = 1; depth <= segments.length; depth += 1) {
			const directory = segments.slice(0, depth).join('/');

			if (directory) {
				directories.add(directory);
			}
		}
	}

	return [...directories].sort((left, right) => left.localeCompare(right, 'en'));
}

async function listDirectories(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url);
	const cursor = url.searchParams.get('cursor') || undefined;

	try {
		const result = await env.IMAGES.list({
			limit: 1000,
			cursor,
			include: ['customMetadata'],
		});

		return jsonResponse({
			success: true,
			directories: directoriesFromKeys(result.objects.filter((object) => !isTrashKey(object.key) && !isDeletedImage(object)).map((object) => object.key)),
			scannedObjects: result.objects.length,
			truncated: result.truncated,
			cursor: result.truncated ? result.cursor : null,
		});
	} catch (error) {
		console.error('Failed to list directories:', error);

		return jsonResponse({ success: false, message: 'Failed to load directories' }, 500);
	}
}

async function listFiles(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url);
	const prefix = url.searchParams.get('prefix')?.replace(/^\/+/, '') ?? '';
	let cursor = url.searchParams.get('cursor') || undefined;

	if (prefix.length > MAX_KEY_LENGTH) {
		return jsonResponse({ success: false, message: 'Prefix is too long' }, 400);
	}

	try {
		let result: R2Objects;
		let visible: R2Object[] = [];
		// Skip pages containing only internal records/tombstones. Bound scan work;
		// if many deleted entries remain, expose the continuation cursor to the UI.
		for (let scan = 0; scan < 10; scan += 1) {
			result = await env.IMAGES.list({ limit: parseLimit(url.searchParams.get('limit')), prefix, cursor,
				include: ['httpMetadata', 'customMetadata'] });
			visible = result.objects.filter((object) => !isTrashKey(object.key) && !isDeletedImage(object));
			if (visible.length || !result.truncated) break;
			cursor = result.cursor;
		}

		return jsonResponse({
			success: true,
			files: visible.map((object) => fileRecord(object)),
			truncated: result!.truncated,
			cursor: result!.truncated ? result!.cursor : null,
		});
	} catch (error) {
		console.error('Failed to list files:', error);

		return jsonResponse({ success: false, message: 'Failed to load files' }, 500);
	}
}

async function deleteFile(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url);
	const key = url.searchParams.get('key')?.replace(/^\/+/, '') ?? '';

	if (!isValidKey(key)) {
		return jsonResponse({ success: false, message: 'Invalid file key' }, 400);
	}

	try {
		const trash = await moveToTrash(env.IMAGES, key);

		return jsonResponse({
			success: true,
			key,
			trash,
		});
	} catch (error) {
		if (error instanceof TrashError) return jsonResponse({ success: false, message: error.message }, error.status);
		console.error('Failed to delete file:', error);

		return jsonResponse({ success: false, message: 'Failed to delete file' }, 500);
	}
}

async function deleteFiles(request: Request, env: Env): Promise<Response> {
	let body: unknown;

	try {
		body = await request.json();
	} catch {
		return jsonResponse({ success: false, message: 'Invalid JSON body' }, 400);
	}

	const requestedKeys =
		typeof body === 'object' && body !== null && 'keys' in body && Array.isArray(body.keys)
			? body.keys
			: [];
	const keys = [...new Set(requestedKeys.filter((key): key is string => typeof key === 'string'))];

	if (!keys.length) {
		return jsonResponse({ success: false, message: 'Select at least one file' }, 400);
	}

	if (keys.length > MAX_BATCH_DELETE) {
		return jsonResponse(
			{
				success: false,
				message: `A maximum of ${MAX_BATCH_DELETE} files can be deleted at once`,
			},
			400,
		);
	}

	if (keys.some((key) => !isValidKey(key))) {
		return jsonResponse({ success: false, message: 'One or more file keys are invalid' }, 400);
	}

	try {
		const deletedKeys: string[] = [];
		const failed: { key: string; message: string }[] = [];
		// Report partial results explicitly. Never claim failed copies were deleted.
		for (const key of keys) {
			try { await moveToTrash(env.IMAGES, key); deletedKeys.push(key); }
			catch (error) { failed.push({ key, message: error instanceof TrashError ? error.message : '移入失败，请刷新检查。' }); }
		}

		return jsonResponse({
			success: true,
			deletedKeys,
			deletedCount: deletedKeys.length,
			failed,
		});
	} catch (error) {
		console.error('Failed to delete files:', error);

		return jsonResponse({ success: false, message: 'Failed to delete files' }, 500);
	}
}

async function renameFile(request: Request, env: Env): Promise<Response> {
	let body: unknown;

	try {
		body = await request.json();
	} catch {
		return jsonResponse({ success: false, message: 'Invalid JSON body' }, 400);
	}

	const values = typeof body === 'object' && body !== null ? body : {};
	const key = 'key' in values && typeof values.key === 'string' ? values.key.replace(/^\/+/, '') : '';
	const newFilename = normalizeNewFilename('newFilename' in values ? values.newFilename : null);
	const expectedEtag = 'expectedEtag' in values && typeof values.expectedEtag === 'string' ? values.expectedEtag : '';

	if (!isValidKey(key) || !newFilename) {
		return jsonResponse({ success: false, message: 'Invalid rename request' }, 400);
	}

	const oldFilename = filenameFromKey(key);

	if (filenameExtension(oldFilename) !== filenameExtension(newFilename)) {
		return jsonResponse({ success: false, message: 'File extension cannot be changed' }, 400);
	}

	const separatorIndex = key.lastIndexOf('/');
	const folder = separatorIndex >= 0 ? key.slice(0, separatorIndex) : '';
	const newKey = folder ? `${folder}/${newFilename}` : newFilename;

	if (!isValidKey(newKey)) {
		return jsonResponse({ success: false, message: 'The new file key is too long' }, 400);
	}

	if (newKey === key) {
		return jsonResponse({ success: false, message: 'The new filename is unchanged' }, 400);
	}

	try {
		const source = await env.IMAGES.get(key);

		if (!source || isDeletedImage(source)) {
			if (source) await source.body.cancel();
			return jsonResponse({ success: false, message: 'File not found' }, 404);
		}

		if (expectedEtag && source.etag !== expectedEtag) {
			return jsonResponse(
				{
					success: false,
					code: 'FILE_CHANGED',
					message: 'File changed before it could be renamed',
				},
				409,
			);
		}

		const target = await env.IMAGES.head(newKey);

		if (target) {
			return jsonResponse(
				{
					success: false,
					code: 'FILE_EXISTS',
					message: 'A file with the new name already exists',
					key: newKey,
				},
				409,
			);
		}

		const written = await env.IMAGES.put(newKey, source.body, {
			onlyIf: new Headers({ 'If-None-Match': '*' }),
			httpMetadata: source.httpMetadata,
			customMetadata: {
				...source.customMetadata,
				originalFilename: newFilename,
				previousKey: key,
				renamedAt: new Date().toISOString(),
			},
		});

		if (!written) {
			return jsonResponse(
				{
					success: false,
					code: 'FILE_EXISTS',
					message: 'A file with the new name already exists',
					key: newKey,
				},
				409,
			);
		}

		const latestSource = await env.IMAGES.head(key);

		if (!latestSource || latestSource.etag !== source.etag) {
			const latestTarget = await env.IMAGES.head(newKey);

			if (latestTarget?.etag === written.etag) {
				await env.IMAGES.delete(newKey);
			}

			return jsonResponse(
				{
					success: false,
					code: 'FILE_CHANGED',
					message: 'File changed before it could be renamed',
				},
				409,
			);
		}

		await env.IMAGES.delete(key);
		await Promise.all([
			caches.default.delete(new Request(imageUrlForKey(key), { method: 'GET' })),
			caches.default.delete(new Request(imageUrlForKey(newKey), { method: 'GET' })),
		]);

		return jsonResponse({
			success: true,
			previousKey: key,
			file: fileRecord(written, newKey),
		});
	} catch (error) {
		console.error('Failed to rename file:', error);

		return jsonResponse({ success: false, message: 'Failed to rename file' }, 500);
	}
}

export async function handleFiles(request: Request, env: Env): Promise<Response> {
	const identity = await authorizeImageRequest(request, env);
	if (identity instanceof Response) return identity;

		switch (request.method) {
			case 'GET': {
				const url = new URL(request.url);

				return url.searchParams.get('view') === 'directories' ? listDirectories(request, env) : listFiles(request, env);
			}

			case 'DELETE': {
				const url = new URL(request.url);

				return url.searchParams.has('key') ? deleteFile(request, env) : deleteFiles(request, env);
			}

			case 'PATCH':
				return renameFile(request, env);

			default:
				return jsonResponse(
					{ success: false, message: 'Method Not Allowed' },
					405,
					{ Allow: 'GET, PATCH, DELETE' },
				);
		}
}
