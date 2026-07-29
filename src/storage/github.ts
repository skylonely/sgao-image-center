const GITHUB_OWNER = 'skylonely';
const GITHUB_REPOSITORY = 'sgao-images';
const GITHUB_BRANCH = 'main';

export async function getImageFromGitHub(path: string): Promise<Response | null> {
	const normalizedPath = path
		.split('/')
		.filter(Boolean)
		.map((segment) => encodeURIComponent(segment))
		.join('/');

	if (!normalizedPath) {
		return null;
	}

	const rawUrl = `https://raw.githubusercontent.com/` + `${GITHUB_OWNER}/${GITHUB_REPOSITORY}/` + `${GITHUB_BRANCH}/${normalizedPath}`;

	console.log('GitHub request:', rawUrl);

	try {
		const upstreamResponse = await fetch(rawUrl, {
			headers: {
				'User-Agent': 'sgao-image-center',
			},
		});

		if (upstreamResponse.status === 404) {
			console.log('GITHUB MISS:', path);
			return null;
		}

		if (!upstreamResponse.ok) {
			console.error('GitHub request failed:', upstreamResponse.status, upstreamResponse.statusText);

			throw new Error(`GitHub request failed: ${upstreamResponse.status}`);
		}

		console.log('GITHUB HIT:', path);

		const headers = new Headers();

		const contentType = upstreamResponse.headers.get('Content-Type');

		if (contentType) {
			headers.set('Content-Type', contentType);
		} else {
			headers.set('Content-Type', 'application/octet-stream');
		}

		headers.set('Cache-Control', 'public, max-age=604800');
		headers.set('X-Content-Type-Options', 'nosniff');
		headers.set('X-Image-Source', 'github');

		return new Response(upstreamResponse.body, {
			status: 200,
			headers,
		});
	} catch (error) {
		console.error('GitHub storage error:', error);
		throw error;
	}
}
