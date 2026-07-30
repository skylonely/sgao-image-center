const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_RENAME_ATTEMPTS = 100;
const IMAGE_ORIGIN = 'https://img.sgao.cc';

const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml', 'image/avif']);
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

function isAuthorized(request: Request, env: Env): boolean {
	const authorization = request.headers.get('Authorization');

	return authorization === `Bearer ${env.UPLOAD_TOKEN}`;
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

		if (!ALLOWED_TYPES.has(file.type)) {
			return jsonResponse(
				{
					success: false,
					message: `Unsupported file type: ${file.type}`,
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
					message: 'File exceeds the 10 MB limit',
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
