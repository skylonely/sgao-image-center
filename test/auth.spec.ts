import { env, SELF } from 'cloudflare:test';
import { afterEach, describe, expect, it } from 'vitest';
import { authorizeImageRequest } from '../src/auth';
import { ownerFetch, token } from './auth-fixture';

const key = 'auth-tests/public-image.png';
afterEach(async () => { await env.IMAGES.delete(key); });

describe('owner account authorization', () => {
	it('returns the verified owner account with private no-store session headers', async () => {
		const response = await ownerFetch('https://example.com/api/session');
		expect(response.status).toBe(200); expect(response.headers.get('Cache-Control')).toContain('no-store');
		expect(await response.json()).toEqual({ success: true, account: { email: 'gsios602@gmail.com' } });
	});
	it('refuses unauthenticated reads and all write methods, even with a forged email or old bearer token', async () => {
		for (const [path, method] of [['/api/files', 'GET'], ['/api/files?view=directories', 'GET'], ['/api/upload', 'POST'], ['/api/files', 'PATCH'], ['/api/files?key=x', 'DELETE']]) {
			const response = await SELF.fetch(`https://example.com${path}`, { method, headers: {
				Origin: 'https://example.com', Authorization: 'Bearer undefined', 'Cf-Access-Authenticated-User-Email': 'gsios602@gmail.com',
			} });
			expect(response.status).toBe(401); expect(await response.json()).toMatchObject({ code: 'AUTH_REQUIRED' });
		}
	});
	it('rejects a validly signed token belonging to another account on every management endpoint', async () => {
		const other = await token({ email: 'other@gmail.com' });
		for (const [path, method] of [['/api/session', 'GET'], ['/api/files', 'GET'], ['/api/upload', 'POST'], ['/api/files', 'PATCH'], ['/api/files', 'DELETE']]) {
			const response = await SELF.fetch(`https://example.com${path}`, { method, headers: { Origin: 'https://example.com', 'Cf-Access-Jwt-Assertion': other } });
			expect(response.status).toBe(403); expect(await response.json()).toMatchObject({ code: 'ACCOUNT_FORBIDDEN' });
		}
	});
	it('rejects wrong issuer, wrong audience, expired, not-yet-valid, wrong signature and malformed tokens', async () => {
		const values = [await token({ iss: 'https://wrong.cloudflareaccess.com' }), await token({ aud: '2'.repeat(64) }),
			await token({ exp: Math.floor(Date.now() / 1000) - 10 }), await token({ nbf: Math.floor(Date.now() / 1000) + 3600 }),
			await token({ iat: Math.floor(Date.now() / 1000) + 3600 }), await token({}, true), 'fake.owner.signature'];
		for (const value of values) {
			const response = await SELF.fetch('https://example.com/api/session', { headers: { 'Cf-Access-Jwt-Assertion': value } });
			expect(response.status).toBe(401);
		}
	});
	it('rejects service identity and missing email instead of assuming ownership', async () => {
		for (const claims of [{ type: 'service' }, { email: null }]) {
			const response = await SELF.fetch('https://example.com/api/session', { headers: { 'Cf-Access-Jwt-Assertion': await token(claims) } });
			expect(response.status).toBe(401);
		}
	});
	it('refuses cross-site, sibling-site and missing-Origin writes despite a valid owner login', async () => {
		const value = await token();
		const origins: Record<string, string>[] = [{ Origin: 'https://evil.example' }, { Origin: 'https://todo.sgao.cc' }, { Origin: 'null' }, {}, { Origin: 'https://example.com', 'Sec-Fetch-Site': 'cross-site' }];
		for (const headers of origins) {
			const response = await SELF.fetch('https://example.com/api/upload', { method: 'POST', headers: { ...headers, 'Cf-Access-Jwt-Assertion': value } });
			expect(response.status).toBe(403); expect(await response.json()).toMatchObject({ code: 'ORIGIN_FORBIDDEN' });
		}
	});
	it('fails closed for missing configuration and invalid key-server domains', async () => {
		const request = new Request('https://example.com/api/session', { headers: { 'Cf-Access-Jwt-Assertion': await token() } });
		for (const overrides of [{ ACCESS_AUD: '' }, { ACCESS_TEAM_DOMAIN: '' }, { ACCESS_TEAM_DOMAIN: 'http://localhost:9999' }]) {
			const response = await authorizeImageRequest(request, { ...env, ...overrides });
			expect(response).toBeInstanceOf(Response); expect((response as Response).status).toBe(503);
		}
	});
	it('login returns only to the two fixed management pages and never arbitrary URLs', async () => {
		for (const destination of ['/admin/files/', '/admin/', 'https://evil.example/', '//evil.example/', '/admin/../../evil']) {
			const response = await ownerFetch(`https://example.com/api/login?returnTo=${encodeURIComponent(destination)}`, { redirect: 'manual' });
			expect(response.status).toBe(302); expect(response.headers.get('Location')).toBe(destination === '/admin/files/' ? destination : '/admin/');
		}
	});
	it('public image links still work without an account or upload key', async () => {
		await env.IMAGES.put(key, new Uint8Array([137, 80, 78, 71]), { httpMetadata: { contentType: 'image/png' } });
		const response = await SELF.fetch(`https://example.com/${key}`);
		expect(response.status).toBe(200); expect(response.headers.get('Content-Type')).toBe('image/png');
		expect(Array.from(new Uint8Array(await response.arrayBuffer()))).toEqual([137, 80, 78, 71]);
	});
});
