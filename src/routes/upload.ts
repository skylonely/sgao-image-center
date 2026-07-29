const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml', 'image/avif']);

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

		const key = `${folder}/${filename}`;

		await env.IMAGES.put(key, file.stream(), {
			httpMetadata: {
				contentType: file.type,
				cacheControl: 'public, max-age=86400, s-maxage=31536000',
			},
			customMetadata: {
				originalFilename: file.name,
				uploadedAt: new Date().toISOString(),
			},
		});

		const imageUrl = `https://img.sgao.cc/${key}`;

		return jsonResponse({
			success: true,
			key,
			url: imageUrl,
			filename,
			folder,
			contentType: file.type,
			size: file.size,
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
