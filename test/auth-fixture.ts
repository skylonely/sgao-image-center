import { env, fetchMock, SELF } from 'cloudflare:test';
import { exportJWK, generateKeyPair, SignJWT } from 'jose';
import { beforeAll, afterAll } from 'vitest';

export const issuer = 'https://image-auth-tests.cloudflareaccess.com';
export const audience = '1'.repeat(64);
const pair = await generateKeyPair('RS256');

beforeAll(async () => {
	const key = await exportJWK(pair.publicKey);
	fetchMock.activate(); fetchMock.disableNetConnect();
	fetchMock.get(issuer).intercept({ path: '/cdn-cgi/access/certs' }).reply(200, JSON.stringify({ keys: [{ ...key, kid: 'test-owner', alg: 'RS256', use: 'sig' }] }),
		{ headers: { 'Content-Type': 'application/json' } }).persist();
});
afterAll(() => { fetchMock.deactivate(); });

export async function token(claims: Record<string, unknown> = {}, differentSignature = false) {
	return new SignJWT({ email: 'gsios602@gmail.com', type: 'app', ...claims })
		.setProtectedHeader({ alg: 'RS256', kid: 'test-owner' }).setIssuer(typeof claims.iss === 'string' ? claims.iss : issuer)
		.setAudience(typeof claims.aud === 'string' ? claims.aud : audience).setSubject('owner-test')
		.setIssuedAt(typeof claims.iat === 'number' ? claims.iat : undefined).setExpirationTime(typeof claims.exp === 'number' ? claims.exp : '1h')
		.sign(differentSignature ? (await generateKeyPair('RS256')).privateKey : pair.privateKey);
}

export async function ownerFetch(input: string, options: RequestInit = {}) {
	const headers = new Headers(options.headers);
	headers.set('Cf-Access-Jwt-Assertion', await token());
	if (options.method && !['GET', 'HEAD'].includes(options.method)) headers.set('Origin', new URL(input).origin);
	return SELF.fetch(input, { ...options, headers });
}
