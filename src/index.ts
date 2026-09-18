import { handleFiles } from './routes/files';
import { handleImage } from './routes/image';
import { handleUpload } from './routes/upload';
import { authResponse, authorizeImageRequest } from './auth';
import { handleTrash } from './routes/trash';
import { handleVersions } from './routes/versions';

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		if (url.pathname === '/api/trash') return handleTrash(request, env);
		if (url.pathname === '/api/versions') return handleVersions(request, env);
		if (url.pathname === '/api/session' || url.pathname === '/api/login') {
			if (request.method !== 'GET') return authResponse('Method Not Allowed', 405, 'METHOD_NOT_ALLOWED');
			const identity = await authorizeImageRequest(request, env);
			if (identity instanceof Response) return identity;
			if (url.pathname === '/api/login') {
				const returnTo = url.searchParams.get('returnTo');
				const destination = returnTo === '/admin/files/' ? returnTo : '/admin/';
				return new Response(null, { status: 302, headers: { Location: destination, 'Cache-Control': 'private, no-store' } });
			}
			return Response.json({ success: true, account: identity }, { headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie, Cf-Access-Jwt-Assertion' } });
		}

		if (url.pathname === '/') {
			return new Response('Image Center Running', {
				headers: {
					'Content-Type': 'text/plain; charset=utf-8',
					'Cache-Control': 'no-store',
				},
			});
		}

		// 上传 API
		if (url.pathname === '/api/upload') {
			return handleUpload(request, env);
		}

		// 文件管理 API
		if (url.pathname === '/api/files') {
			return handleFiles(request, env);
		}

		// 管理后台及其静态资源
		if (url.pathname === '/admin' || url.pathname.startsWith('/admin/')) {
			const response = await env.ASSETS.fetch(request);
			const headers = new Headers(response.headers);
			headers.set('Cache-Control', 'private, no-store');
			return new Response(response.body, { status: response.status, headers });
		}

		// 其他路径作为图片路径处理
		return handleImage(request, env, ctx);
	},
} satisfies ExportedHandler<Env>;
