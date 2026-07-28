export async function handleImage(request: Request): Promise<Response> {
	const cache = caches.default;

	// 先查缓存
	const cached = await cache.match(request);

	if (cached) {
		console.log('CACHE HIT');
		return cached;
	}

	console.log('CACHE MISS');

	const url = new URL(request.url);

	const path = url.pathname.replace('/', '');

	if (!path) {
		return new Response('missing image path', {
			status: 400,
		});
	}

	const githubUrl = `https://raw.githubusercontent.com/skylonely/sgao-images/main/${path}`;

	console.log('fetch:', githubUrl);

	const response = await fetch(githubUrl);

	console.log('github status:', response.status);

	if (!response.ok) {
		return new Response('image not found', {
			status: response.status,
		});
	}

	const imageResponse = new Response(response.body, {
		headers: {
			// 自动识别图片类型
			'Content-Type': response.headers.get('Content-Type') || 'image/png',

			// 图片长期缓存
			'Cache-Control': 'public, max-age=31536000, immutable',
		},
	});

	await cache.put(request, imageResponse.clone());

	console.log('CACHE STORED');

	return imageResponse;
}
