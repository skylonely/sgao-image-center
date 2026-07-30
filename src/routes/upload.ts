const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_RENAME_ATTEMPTS = 100;
const IMAGE_ORIGIN = 'https://img.sgao.cc';

const ALLOWED_FILE_TYPES = new Map<string, ReadonlySet<string>>([
	['image/jpeg', new Set(['jpg', 'jpeg'])],
	['image/png', new Set(['png'])],
	['image/webp', new Set(['webp'])],
	['image/gif', new Set(['gif'])],
	['image/svg+xml', new Set(['svg'])],
]);
const CONFLICT_POLICIES = new Set(['reject', 'rename', 'overwrite']);

type ConflictPolicy = 'reject' | 'rename' | 'overwrite';

function jsonResponse(data: unknown, status = 200): Response {
	return Response.json(data, {
		status,
		headers: {
			'Cache-Control': 'no-store',
			'X-Content-Type-Options': 'nosniff',
		},
	});
}

function normalizeFolder(value: string): string | null {
	const folder = value.trim().replace(/^\/+|\/+$/g, '');

	if (!folder) {
		return 'common';
	}

	const segments = folder.split('/');

	const valid = segments.every((segment) => /^[a-z0-9][a-z0-9_-]*$/i.test(segment));

	return valid ? segments.join('/') : null;
}

function normalizeFilename(filename: string): string | null {
	const cleanName = filename
		.trim()
		.replace(/\s+/g, '-')
		.replace(/[^a-zA-Z0-9._-]/g, '');

	if (!cleanName || cleanName === '.' || cleanName === '..') {
		return null;
	}

	return cleanName;
}

function filenameExtension(filename: string): string {
	const extensionIndex = filename.lastIndexOf('.');

	return extensionIndex > 0 ? filename.slice(extensionIndex + 1).toLowerCase() : '';
}

function isAuthorized(request: Request, env: Env): boolean {
	const authorization = request.headers.get('Authorization');

	return authorization === `Bearer ${env.UPLOAD_TOKEN}`;
}

function startsWithBytes(bytes: Uint8Array, signature: readonly number[], offset = 0): boolean {
	return signature.every((value, index) => bytes[offset + index] === value);
}

async function hasValidFileSignature(file: File): Promise<boolean> {
	if (file.type === 'image/svg+xml') {
		const text = await file.text();
		const start = text.replace(/^\uFEFF/, '').trimStart();
		const isSvgDocument = /^(?:<\?xml[\s\S]*?\?>\s*)?(?:<!--[\s\S]*?-->\s*)*<svg(?:\s|>)/i.test(start);
		const hasUnsafeMarkup =
			/<\s*(?:script|foreignObject|iframe|object|embed)\b/i.test(text) ||
			/<\s*!DOCTYPE\b/i.test(text) ||
			/<\?xml-stylesheet\b/i.test(text) ||
			/\bon[a-z]+\s*=/i.test(text) ||
			/(?:href|xlink:href)\s*=\s*["']\s*javascript:/i.test(text) ||
			/url\s*\(\s*["']?\s*javascript:/i.test(text);

		return isSvgDocument && !hasUnsafeMarkup;
	}

	const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());

	switch (file.type) {
		case 'image/jpeg':
			return startsWithBytes(bytes, [0xff, 0xd8, 0xff]);

		case 'image/png':
			return startsWithBytes(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

		case 'image/gif':
			return startsWithBytes(bytes, [0x47, 0x49, 0x46, 0x38, 0x37, 0x61]) || startsWithBytes(bytes, [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);

		case 'image/webp':
			return startsWithBytes(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWithBytes(bytes, [0x57, 0x45, 0x42, 0x50], 8);

		default:
			return false;
	}
}

function timestampSuffix(date = new Date()): string {
	return date
		.toISOString()
		.replace(/\.\d{3}Z$/, '')
		.replaceAll('-', '')
		.replaceAll(':', '')
		.replace('T', '-');
}

function filenameWithSuffix(filename: string, suffix: string): string {
	const extensionIndex = filename.lastIndexOf('.');
	const hasExtension = extensionIndex > 0;
	const basename = hasExtension ? filename.slice(0, extensionIndex) : filename;
	const extension = hasExtension ? filename.slice(extensionIndex) : '';

	return `${basename}-${suffix}${extension}`;
}

function imageUrlForKey(key: string): string {
	const encodedKey = key
		.split('/')
		.map((segment) => encodeURIComponent(segment))
		.join('/');

	return `${IMAGE_ORIGIN}/${encodedKey}`;
}

function fileExistsResponse(key: string, existing: R2Object, filename: string): Response {
	return jsonResponse(
		{
			success: false,
			code: 'FILE_EXISTS',
			message: '文件已存在，请选择保留两者、覆盖旧图或取消。',
			key,
			etag: existing.etag,
			existing: {
				size: existing.size,
				uploaded: existing.uploaded.toISOString(),
				contentType: existing.httpMetadata?.contentType ?? 'application/octet-stream',
			},
			suggestedFilename: filenameWithSuffix(filename, timestampSuffix()),
		},
		409,
	);
}

function fileChangedResponse(key: string, existing: R2Object, filename: string): Response {
	return jsonResponse(
		{
			success: false,
			code: 'FILE_CHANGED',
			message: '文件在确认期间已发生变化，请重新选择。',
			key,
			etag: existing.etag,
			existing: {
				size: existing.size,
				uploaded: existing.uploaded.toISOString(),
				contentType: existing.httpMetadata?.contentType ?? 'application/octet-stream',
			},
			suggestedFilename: filenameWithSuffix(filename, timestampSuffix()),
		},
		409,
	);
}

function objectMetadata(file: File): R2PutOptions {
	return {
		httpMetadata: {
			contentType: file.type,
			cacheControl: 'public, max-age=86400, s-maxage=31536000',
		},
		customMetadata: {
			originalFilename: file.name,
			uploadedAt: new Date().toISOString(),
		},
	};
}

async function putWithoutOverwrite(bucket: R2Bucket, key: string, file: File): Promise<R2Object | null> {
	const conditions = new Headers({ 'If-None-Match': '*' });

	return bucket.put(key, file, {
		...objectMetadata(file),
		onlyIf: conditions,
	});
}

async function putWithGeneratedName(
	bucket: R2Bucket,
	folder: string,
	filename: string,
	file: File,
): Promise<{ key: string; filename: string } | null> {
	const timestamp = timestampSuffix();

	for (let attempt = 0; attempt < MAX_RENAME_ATTEMPTS; attempt += 1) {
		const suffix = attempt === 0 ? timestamp : `${timestamp}-${attempt}`;
		const generatedFilename = filenameWithSuffix(filename, suffix);
		const key = `${folder}/${generatedFilename}`;
		const object = await putWithoutOverwrite(bucket, key, file);

		if (object) {
			return { key, filename: generatedFilename };
		}
	}

	return null;
}

export async function handleUpload(request: Request, env: Env): Promise<Response> {
	if (request.method !== 'POST') {
		return jsonResponse(
			{
				success: false,
				message: 'Method Not Allowed',
			},
			405,
		);
	}

	if (!isAuthorized(request, env)) {
		return jsonResponse(
			{
				success: false,
				message: 'Unauthorized',
			},
			401,
		);
	}

	const contentType = request.headers.get('Content-Type') ?? '';

	if (!contentType.includes('multipart/form-data')) {
		return jsonResponse(
			{
				success: false,
				message: 'Content-Type must be multipart/form-data',
			},
			415,
		);
	}

	try {
		const formData = await request.formData();

		const file = formData.get('file');
		const folderValue = formData.get('folder')?.toString() ?? 'common';
		const conflictValue = formData.get('conflict')?.toString() ?? 'reject';
		const expectedEtag = formData.get('expectedEtag')?.toString() ?? '';

		if (!(file instanceof File)) {
			return jsonResponse(
				{
					success: false,
					message: 'Missing file',
				},
				400,
			);
		}

		const allowedExtensions = ALLOWED_FILE_TYPES.get(file.type);

		if (!allowedExtensions) {
			return jsonResponse(
				{
					success: false,
					code: 'UNSUPPORTED_FILE_TYPE',
					message: '仅支持 JPEG、PNG、WebP、GIF 和 SVG 图片。',
				},
				415,
			);
		}

		if (file.size <= 0) {
			return jsonResponse(
				{
					success: false,
					message: 'File is empty',
				},
				400,
			);
		}

		if (file.size > MAX_FILE_SIZE) {
			return jsonResponse(
				{
					success: false,
					code: 'FILE_TOO_LARGE',
					message: '单张图片不能超过 10 MB。',
				},
				413,
			);
		}

		const folder = normalizeFolder(folderValue);
		const filename = normalizeFilename(file.name);
		const conflict = CONFLICT_POLICIES.has(conflictValue) ? (conflictValue as ConflictPolicy) : null;

		if (!folder) {
			return jsonResponse(
				{
					success: false,
					message: 'Invalid folder path',
				},
				400,
			);
		}

		if (!filename) {
			return jsonResponse(
				{
					success: false,
					message: 'Invalid filename',
				},
				400,
			);
		}

		const extension = filenameExtension(filename);

		if (!allowedExtensions.has(extension)) {
			return jsonResponse(
				{
					success: false,
					code: 'FILE_EXTENSION_MISMATCH',
					message: `文件扩展名与 ${file.type} 不匹配。`,
				},
				415,
			);
		}

		if (!(await hasValidFileSignature(file))) {
			return jsonResponse(
				{
					success: false,
					code: 'INVALID_FILE_CONTENT',
					message: file.type === 'image/svg+xml' ? 'SVG 内容无效或包含不安全标记。' : '文件内容与声明的图片类型不匹配。',
				},
				415,
			);
		}

		if (!conflict) {
			return jsonResponse(
				{
					success: false,
					message: 'Invalid conflict policy',
				},
				400,
			);
		}

		let key = `${folder}/${filename}`;
		let savedFilename = filename;
		let renamed = false;
		let overwritten = false;
		const existing = await env.IMAGES.head(key);

		if (conflict === 'reject' && existing) {
			return fileExistsResponse(key, existing, filename);
		}

		if (conflict === 'rename') {
			const generated = await putWithGeneratedName(env.IMAGES, folder, filename, file);

			if (!generated) {
				return jsonResponse(
					{
						success: false,
						message: 'Unable to generate a unique filename',
					},
					409,
				);
			}

			key = generated.key;
			savedFilename = generated.filename;
			renamed = true;
		} else if (conflict === 'overwrite') {
			if (!existing) {
				const object = await putWithoutOverwrite(env.IMAGES, key, file);

				if (!object) {
					const latest = await env.IMAGES.head(key);

					if (latest) {
						return fileExistsResponse(key, latest, filename);
					}

					throw new Error('Conditional upload failed');
				}
			} else {
				if (!expectedEtag || expectedEtag !== existing.etag) {
					return fileChangedResponse(key, existing, filename);
				}

				const object = await env.IMAGES.put(key, file, {
					...objectMetadata(file),
					onlyIf: { etagMatches: expectedEtag },
				});

				if (!object) {
					const latest = await env.IMAGES.head(key);

					if (latest) {
						return fileChangedResponse(key, latest, filename);
					}

					throw new Error('Conditional overwrite failed');
				}

				overwritten = true;
			}
		} else {
			const object = await putWithoutOverwrite(env.IMAGES, key, file);

			if (!object) {
				const latest = await env.IMAGES.head(key);

				if (latest) {
					return fileExistsResponse(key, latest, filename);
				}

				throw new Error('Conditional upload failed');
			}
		}

		await caches.default.delete(new Request(imageUrlForKey(key), { method: 'GET' }));

		const imageUrl = imageUrlForKey(key);

		return jsonResponse({
			success: true,
			key,
			url: imageUrl,
			filename: savedFilename,
			folder,
			contentType: file.type,
			size: file.size,
			renamed,
			overwritten,
		});
	} catch (error) {
		console.error('Upload failed:', error);

		return jsonResponse(
			{
				success: false,
				message: 'Upload failed',
			},
			500,
		);
	}
}
