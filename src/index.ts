import { handleImage } from './routes/image';

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);

		// 首页仅用于检查 Worker 是否正常运行
		if (url.pathname === '/') {
			return new Response('Image Center Running', {
				headers: {
					'Content-Type': 'text/plain; charset=utf-8',
					'Cache-Control': 'no-store',
				},
			});
		}

		// 其他所有路径都作为图片 Object Key 处理
		return handleImage(request, env, ctx);
	},
} satisfies ExportedHandler<Env>;
