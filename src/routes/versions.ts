import { authorizeImageRequest } from '../auth';
import { isImageKey } from '../trash';
import { isVersionId, listImageVersions, previewImageVersion, restoreImageVersion, VersionError } from '../versions';

function jsonResponse(data: unknown, status = 200): Response {
	return Response.json(data, { status, headers: { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', Vary: 'Cookie, Cf-Access-Jwt-Assertion' } });
}

function imageHeaders(source: R2ObjectBody): Headers {
	const headers = new Headers();
	source.writeHttpMetadata(headers);
	headers.set('Cache-Control', 'private, no-store');
	headers.set('X-Content-Type-Options', 'nosniff');
	headers.set('Content-Security-Policy', "sandbox; default-src 'none'");
	headers.set('Vary', 'Cookie, Cf-Access-Jwt-Assertion');
	return headers;
}

function versionError(error: unknown): Response | null {
	if (error instanceof VersionError) return jsonResponse({ success: false, message: error.message }, error.status);
	return null;
}

export async function handleVersions(request: Request, env: Env): Promise<Response> {
	const identity = await authorizeImageRequest(request, env);
	if (identity instanceof Response) return identity;
	const url = new URL(request.url);

	if (request.method === 'GET') {
		const key = url.searchParams.get('key') ?? '';
		if (!isImageKey(key)) return jsonResponse({ success: false, message: '图片路径无效。' }, 400);
		try {
			if (url.searchParams.get('view') === 'preview') {
				const id = url.searchParams.get('id') ?? '';
				if (!isVersionId(id)) return jsonResponse({ success: false, message: '历史版本无效。' }, 400);
				const source = await previewImageVersion(env.IMAGES, key, id);
				return new Response(source.body, { headers: imageHeaders(source) });
			}
			return jsonResponse({ success: true, key, versions: await listImageVersions(env.IMAGES, key) });
		} catch (error) {
			const known = versionError(error);
			if (known) return known;
			console.error('Version lookup failed:', error);
			return jsonResponse({ success: false, message: '读取历史版本失败。' }, 500);
		}
	}

	if (request.method === 'POST') {
		let body: unknown;
		try {
			body = await request.json<unknown>();
		} catch {
			return jsonResponse({ success: false, message: '请求无效。' }, 400);
		}
		try {
			if (!body || typeof body !== 'object') return jsonResponse({ success: false, message: '请求无效。' }, 400);
			const payload = body as Record<string, unknown>;
			if (payload.action !== 'restore' || typeof payload.key !== 'string' || typeof payload.id !== 'string'
				|| typeof payload.expectedEtag !== 'string' || typeof payload.expectedVersion !== 'string') {
				return jsonResponse({ success: false, message: '恢复请求无效。' }, 400);
			}
			const result = await restoreImageVersion(env.IMAGES, payload.key, payload.id, payload.expectedEtag, payload.expectedVersion);
			return jsonResponse({ success: true, key: payload.key, historyId: result.historyId, etag: result.object.etag, version: result.object.version });
		} catch (error) {
			const known = versionError(error);
			if (known) return known;
			console.error('Version restore failed:', error);
			return jsonResponse({ success: false, message: '恢复历史版本失败。' }, 500);
		}
	}

	return jsonResponse({ success: false, message: 'Method Not Allowed' }, 405);
}
