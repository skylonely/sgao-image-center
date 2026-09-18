import { getImage } from '../storage';
import { isDeletedImage, isTrashKey, isVersionKey } from '../trash';

export async function handleImage(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
	const url = new URL(request.url);
	const path = decodeURIComponent(url.pathname).replace(/^\/+/, '');
	if (isTrashKey(path) || isVersionKey(path)) return new Response('Image not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });

	if (!path) {
		return new Response('Missing image path', {
			status: 400,
			headers: {
				'Cache-Control': 'no-store',
			},
		});
	}

	if (request.method !== 'GET' && request.method !== 'HEAD') {
		return new Response('Method Not Allowed', {
			status: 405,
			headers: {
				Allow: 'GET, HEAD',
				'Cache-Control': 'no-store',
			},
		});
	}

	const cache = caches.default;
	const cacheKey = new Request(request.url, {
		method: 'GET',
		headers: request.headers,
	});

	// Check R2 before cache/static fallback, including old cached copies in other PoPs.
	let currentObject: R2Object | null;
	try {
		currentObject = await env.IMAGES.head(path);
		if (isDeletedImage(currentObject)) return new Response('Image not found', {
			status: 404, headers: { 'Cache-Control': 'no-store' },
		});
	} catch { return new Response('Image service unavailable', { status: 502, headers: { 'Cache-Control': 'no-store' } }); }
	const cachedResponse = await cache.match(cacheKey);

	if (cachedResponse && (!currentObject || cachedResponse.headers.get('ETag') === currentObject.httpEtag)) {
		console.log('CACHE HIT:', path);

		return request.method === 'HEAD'
			? new Response(null, {
					status: cachedResponse.status,
					headers: cachedResponse.headers,
				})
			: cachedResponse;
	}

	console.log('CACHE MISS:', path);

	try {
		const imageResponse = await getImage(path, env);

		if (!imageResponse) {
			return new Response('Image not found', {
				status: 404,
				headers: {
					'Content-Type': 'text/plain; charset=utf-8',
					'Cache-Control': 'no-store',
				},
			});
		}
		if (imageResponse.status !== 200) return imageResponse;

		const headers = new Headers(imageResponse.headers);

		headers.set('Cache-Control', 'public, max-age=86400, s-maxage=31536000');
		headers.set('X-Content-Type-Options', 'nosniff');

		const finalResponse = new Response(imageResponse.body, {
			status: imageResponse.status,
			headers,
		});

		// 不阻塞图片返回，在后台写入 Cloudflare Cache
		ctx.waitUntil(cache.put(cacheKey, finalResponse.clone()));

		console.log('IMAGE SOURCE:', headers.get('X-Image-Source') ?? 'unknown');

		return request.method === 'HEAD'
			? new Response(null, {
					status: finalResponse.status,
					headers: finalResponse.headers,
				})
			: finalResponse;
	} catch (error) {
		console.error('Image request failed:', error);

		return new Response('Image service unavailable', {
			status: 502,
			headers: {
				'Content-Type': 'text/plain; charset=utf-8',
				'Cache-Control': 'no-store',
			},
		});
	}
}
