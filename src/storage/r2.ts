export async function getImageFromR2(path: string, env: Env): Promise<Response | null> {
	const object = await env.IMAGES.get(path);

	if (!object) {
		console.log('R2 MISS:', path);
		return null;
	}

	console.log('R2 HIT:', path);

	const headers = new Headers();

	object.writeHttpMetadata(headers);

	headers.set('ETag', object.httpEtag);
	headers.set('Cache-Control', 'public, max-age=604800');
	headers.set('X-Content-Type-Options', 'nosniff');
	headers.set('X-Image-Source', 'r2');

	if (!headers.has('Content-Type')) {
		headers.set('Content-Type', 'application/octet-stream');
	}

	return new Response(object.body, {
		status: 200,
		headers,
	});
}
