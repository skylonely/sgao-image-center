export async function handleImage(request: Request): Promise<Response> {
	const cache = caches.default;

	// 1. 先查 Cloudflare Cache
	const cached = await cache.match(request);

	if (cached) {
		console.log('CACHE HIT');
		return cached;
	}

	console.log('CACHE MISS');

	// 2. 解析图片路径
	const url = new URL(request.url);

	const path = url.pathname.replace('/', '');

	console.log('image path:', path);

	if (!path) {
		return new Response('missing image path', {
			status: 400,
		});
	}

	// 3. 拼接 GitHub 图片地址
	const githubUrl = `https://raw.githubusercontent.com/skylonely/sgao-images/main/${path}`;

	console.log('fetch:', githubUrl);

	// 4. 请求 GitHub
	const response = await fetch(githubUrl);

	console.log('github status:', response.status);

	if (!response.ok) {
		return new Response('image not found', {
			status: response.status,
		});
	}

	// 5. 创建图片响应
	const imageResponse = new Response(response.body, {
		headers: {
			// 目前你的图床主要是 png
			'Content-Type': 'image/png',

			// 浏览器缓存 7 天
			'Cache-Control': 'public, max-age=604800',
		},
	});

	// 6. 写入 Cloudflare Cache
	await cache.put(request, imageResponse.clone());

	console.log('CACHE STORED');

	return imageResponse;
}
