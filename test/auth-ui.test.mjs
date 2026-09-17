import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

const code = readFileSync(new URL('../public/admin/auth.js', import.meta.url), 'utf8');
const signedIn = () => Response.json({ success: true, account: { email: 'gsios602@gmail.com' } });
function harness(fetcher) {
  const nodes = Object.fromEntries(['accountStatus', 'loginLink', 'logoutLink', 'checkAccountButton'].map((id) => [id, { hidden: true, textContent: '', disabled: false, addEventListener() {} }]));
  const panel = { hidden: true }, events = [], requests = [], removed = [];
  const window = { addEventListener() {}, dispatchEvent(event) { events.push(event); } };
  runInNewContext(code, { window, document: { querySelector: (selector) => nodes[selector.slice(1)], querySelectorAll: () => [panel] },
    sessionStorage: { removeItem: (key) => removed.push(key) }, CustomEvent: class { constructor(name, options) { this.type = name; this.detail = options.detail; } },
    fetch: (url, options) => { requests.push({ url, options }); return fetcher(url, options); } });
  return { account: window.imageAccount, nodes, panel, events, requests, removed };
}
test('owner session reveals controls, shows identity, and removes the legacy browser key without reading it', async () => {
  const h = harness(async () => signedIn()); await h.account.ready;
  assert.equal(h.account.authorized, true); assert.equal(h.panel.hidden, false);
  assert.equal(h.nodes.loginLink.hidden, true); assert.equal(h.nodes.logoutLink.hidden, false);
  assert.match(h.nodes.accountStatus.textContent, /gsios602@gmail.com/);
  assert.deepEqual(h.removed, ['sgaoUploadToken']); assert.equal(h.events.length, 1);
  assert.equal(h.requests[0].options.credentials, 'same-origin'); assert.equal(h.requests[0].options.cache, 'no-store');
});
test('signed-out, forbidden, unconfigured and other-account sessions never expose owner controls', async () => {
  for (const response of [Response.json({ success: false, message: '请登录' }, { status: 401 }),
    Response.json({ success: false, message: '无权限' }, { status: 403 }), Response.json({ success: false, message: '尚未配置' }, { status: 503 }),
    Response.json({ success: true, account: { email: 'other@gmail.com' } })]) {
    const h = harness(async () => response); await h.account.ready;
    assert.equal(h.account.authorized, false); assert.equal(h.panel.hidden, true); assert.equal(h.nodes.loginLink.hidden, false);
    await assert.rejects(h.account.request('/api/files')); assert.equal(h.requests.length, 1);
  }
});
test('Access redirects display a login link, never follow the redirect or parse login HTML', async () => {
  const h = harness(async () => ({ type: 'opaqueredirect', status: 0 })); await h.account.ready;
  assert.equal(h.account.authorized, false); assert.equal(h.nodes.loginLink.hidden, false);
  assert.equal(h.requests[0].options.redirect, 'manual'); assert.equal(h.requests.length, 1);
});
test('API requests use cookies, not bearer headers; expiry hides controls and notifies pages to clear data', async () => {
  const h = harness(async (url) => url === '/api/session' ? signedIn() : Response.json({ message: '过期' }, { status: 401 }));
  await h.account.ready; await h.account.request('/api/upload', { method: 'POST', body: 'image' });
  assert.equal(h.account.authorized, false); assert.equal(h.panel.hidden, true);
  assert.equal(h.events.at(-1).detail.authorized, false); assert.equal(h.requests.at(-1).options.credentials, 'same-origin');
  assert.equal(h.requests.at(-1).options.headers, undefined);
});
test('a late API result cannot repopulate private UI after a failed session check', async () => {
  let session = true, resolve;
  const pending = new Promise((done) => { resolve = done; });
  const h = harness(async (url) => url === '/api/session' ? session ? signedIn() : Response.json({}, { status: 401 }) : pending);
  await h.account.ready; const request = h.account.request('/api/files'); session = false; await h.account.check();
  resolve(Response.json({ success: true, files: ['private'] })); await assert.rejects(request);
  assert.equal(h.account.authorized, false); assert.equal(h.panel.hidden, true);
});
test('a session check started before API expiry cannot reinstate an invalidated login', async () => {
  let checks = 0, resolve;
  const pending = new Promise((done) => { resolve = done; });
  const h = harness(async (url) => url === '/api/session' ? ++checks === 1 ? signedIn() : pending : Response.json({}, { status: 401 }));
  await h.account.ready; const checking = h.account.check(); await h.account.request('/api/files');
  resolve(signedIn()); await checking; assert.equal(h.account.authorized, false); assert.equal(h.panel.hidden, true);
});
test('network failure can be retried without requiring any key entry', async () => {
  let online = false;
  const h = harness(async () => { if (!online) throw new Error('network'); return signedIn(); });
  await h.account.ready; assert.equal(h.account.authorized, false); online = true; await h.account.check();
  assert.equal(h.account.authorized, true); assert.equal(h.panel.hidden, false);
});
