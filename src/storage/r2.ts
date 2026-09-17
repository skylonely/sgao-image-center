import { isDeletedImage } from '../trash';

export async function getImageFromR2(path: string, env: Env): Promise<Response | null> {
	const object = await env.IMAGES.get(path);

	if (!object) {
		console.log('R2 MISS:', path);
		return null;
	}
	// Deletion can race the route's HEAD check. Do not return a tombstone or
	// fall back to a GitHub copy when the image is explicitly deleted.
	if (isDeletedImage(object)) {
		await object.body.cancel();
		return new Response('Image not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
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
