import { createRemoteJWKSet, errors, jwtVerify } from 'jose';

const OWNER_EMAIL = 'gsios602@gmail.com';
const verifiers = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

export function authResponse(message: string, status: number, code: string): Response {
	return Response.json({ success: false, code, message }, { status, headers: {
		'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'Vary': 'Cookie, Cf-Access-Jwt-Assertion',
	} });
}

export async function authorizeImageRequest(request: Request, env: Env): Promise<{ email: string } | Response> {
	const origin = request.headers.get('Origin');
	if ((origin && origin !== new URL(request.url).origin) || request.headers.get('Sec-Fetch-Site') === 'cross-site'
		|| (!['GET', 'HEAD'].includes(request.method) && !origin)) {
		return authResponse('不允许跨站管理请求，请从图片中心页面操作。', 403, 'ORIGIN_FORBIDDEN');
	}
	const token = request.headers.get('Cf-Access-Jwt-Assertion');
	if (!token) return authResponse('请先登录图片管理账号。', 401, 'AUTH_REQUIRED');
	const issuer = env.ACCESS_TEAM_DOMAIN;
	const audience = env.ACCESS_AUD;
	if (!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(issuer ?? '') || !/^[a-f0-9]{64}$/.test(audience ?? '')) {
		return authResponse('图片中心登录验证尚未配置，请联系管理员。', 503, 'AUTH_NOT_CONFIGURED');
	}
	try {
		let keys = verifiers.get(issuer);
		if (!keys) {
			keys = createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`), { timeoutDuration: 5000 });
			verifiers.set(issuer, keys);
		}
		const { payload } = await jwtVerify(token, keys, {
			issuer, audience, algorithms: ['RS256'], requiredClaims: ['exp', 'iat', 'sub', 'email'],
		});
		if (payload.type !== 'app' || typeof payload.email !== 'string' || typeof payload.sub !== 'string' || !payload.sub
			|| typeof payload.iat !== 'number' || payload.iat > Math.floor(Date.now() / 1000) + 30) {
			return authResponse('登录凭证无效，请重新登录。', 401, 'AUTH_REQUIRED');
		}
		const email = payload.email.trim().toLowerCase();
		if (email !== OWNER_EMAIL) return authResponse('此账号没有图片管理权限。', 403, 'ACCOUNT_FORBIDDEN');
		return { email };
	} catch (error) {
		const invalid = error instanceof errors.JWTExpired || error instanceof errors.JWTClaimValidationFailed
			|| error instanceof errors.JWSInvalid || error instanceof errors.JWTInvalid || error instanceof errors.JWSSignatureVerificationFailed;
		return authResponse(invalid ? '登录已过期或凭证无效，请重新登录。' : '暂时无法验证登录，请稍后重试。', invalid ? 401 : 503,
			invalid ? 'AUTH_REQUIRED' : 'AUTH_UNAVAILABLE');
	}
}
