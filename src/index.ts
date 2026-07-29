import { handleImage } from './routes/image';
import { handleUpload } from './routes/upload';

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);

		if (url.pathname === '/') {
			return new Response('Image Center Running', {
				headers: {
					'Content-Type': 'text/plain; charset=utf-8',
					'Cache-Control': 'no-store',
				},
			});
		}

		// 管理后台及其静态资源
		if (url.pathname === '/admin' || url.pathname.startsWith('/admin/')) {
			return env.ASSETS.fetch(request);
		}

		// 上传 API
		if (url.pathname === '/api/upload') {
			return handleUpload(request, env);
		}

		// 其他路径作为图片路径处理
		return handleImage(request, env, ctx);
	},
} satisfies ExportedHandler<Env>;
