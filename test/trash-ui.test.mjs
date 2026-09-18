import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { createContext, runInContext } from 'node:vm';

const code = readFileSync(new URL('../public/admin/files/files.js', import.meta.url), 'utf8');
const sample = { id: '11111111-1111-4111-8111-111111111111', key: 'travel/photo.png', filename: 'photo.png', size: 100, deletedAt: '2026-09-17', url: '/api/trash?view=preview&id=x' };
function harness(fetcher) {
	const nodes = new Map(), events = new Map(), requests = [];
	function node() { return { hidden: false, value: '', textContent: '', children: [], attrs: {}, disabled: false,
		classList: { add() {}, remove() {}, toggle() {} }, addEventListener() {}, focus() {},
		setAttribute(key, value) { this.attrs[key] = value; }, getAttribute(key) { return this.attrs[key]; }, removeAttribute(key) { delete this.attrs[key]; },
		append(...items) { this.children.push(...items); }, replaceChildren(...items) { this.children = items; }, remove() {} }; }
	const document = { body: node(), addEventListener() {}, createElement: node, createTextNode: (value) => value,
		querySelector(selector) { if (!nodes.has(selector)) nodes.set(selector, node()); return nodes.get(selector); } };
	const window = { imageAccount: { authorized: true, request(url, options) { requests.push({ url, options }); return fetcher(url, options); } },
		addEventListener(name, handler) { events.set(name, handler); }, clearTimeout() {}, setTimeout() {} };
	const context = createContext({ document, window, localStorage: { getItem() { return null; }, setItem() {} },
		URLSearchParams, AbortController, Intl, Date, console });
	runInContext(code, context);
	nodes.get('#sortOrder').value = 'directory';
	return { nodes, events, requests, window, run: (value) => runInContext(value, context) };
}
const ok = (files = []) => Response.json({ success: true, files, truncated: false, cursor: null });

test('switches between files and recycle bin, with recovery warning and no batch purge', async () => {
	const h = harness(async () => ok()); h.run('switchView(true)'); await new Promise(setImmediate);
	assert.match(h.requests[0].url, /^\/api\/trash/); assert.equal(h.nodes.get('#trashNotice').hidden, false);
	assert.equal(h.nodes.get('#selectVisibleButton').hidden, true); assert.equal(h.nodes.get('#selectionBar').hidden, true);
	h.run('switchView(false)'); await new Promise(setImmediate);
	assert.match(h.requests.at(-1).url, /^\/api\/files/); assert.equal(h.nodes.get('#trashNotice').hidden, true);
});
test('does not accept a stale files response after switching to recycle bin', async () => {
	let resolve;
	const pending = new Promise((done) => { resolve = done; });
	const h = harness(async (url) => url.startsWith('/api/trash') ? ok([]) : pending);
	const first = h.run('loadFiles({reset:true})'); h.run('switchView(true)'); await new Promise(setImmediate);
	resolve(ok([{ ...sample, key: 'private-stale.png' }])); await first;
	assert.equal(h.run('files.length'), 0); assert.equal(h.run('trashMode'), true);
});
test('purge is not sent until the separate permanent-deletion confirmation is accepted', async () => {
	const h = harness(async () => ok()); h.run(`openPurgeDialog(${JSON.stringify(sample)})`);
	assert.equal(h.requests.length, 0); assert.match(h.nodes.get('#deleteDescription').textContent, /无法恢复/);
	assert.equal(h.nodes.get('#confirmDeleteButton').textContent, '确认彻底删除');
	await h.run('deleteFile()');
	assert.equal(h.requests[0].options.method, 'DELETE');
	assert.deepEqual(JSON.parse(h.requests[0].options.body), { id: sample.id, confirmation: 'DELETE' });
});
test('partial batch deletion removes only successful keys and displays failures', async () => {
	const h = harness(async () => Response.json({ success: true, deletedKeys: ['a.png'], failed: [{ key: 'b.png', message: '未移入' }] }));
	h.run("files=[{key:'a.png',url:'a',uploaded:'2026-09-17',size:1},{key:'b.png',url:'b',uploaded:'2026-09-17',size:1}]; openDeleteDialog(['a.png','b.png']);");
	await h.run('deleteFile()');
	assert.equal(h.run('files.length'), 1); assert.equal(h.run('files[0].key'), 'b.png');
	assert.match(h.nodes.get('#managerStatus').textContent, /1 张未移入/);
});
test('failed restore keeps the entry and logout clears recycle-bin contents', async () => {
	const h = harness(async () => Response.json({ success: false, message: '原路径已有新图片' }, { status: 409 }));
	h.run(`trashMode=true; files=[${JSON.stringify(sample)}];`); await h.run('restoreFile(files[0])');
	assert.equal(h.run('files.length'), 1); assert.match(h.nodes.get('#managerStatus').textContent, /已有新图片/);
	h.window.imageAccount.authorized = false;
	h.events.get('image-auth-changed')({ detail: { authorized: false } });
	assert.equal(h.run('files.length'), 0); assert.equal(h.nodes.get('#manager').hidden, true);
});
