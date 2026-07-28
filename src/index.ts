import { handleImage } from './routes/image';

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);

		if (url.pathname.startsWith('/cloudflare/') || url.pathname.startsWith('/images/')) {
			return handleImage(request);
		}

		return new Response('Image Center Running');
	},
};
