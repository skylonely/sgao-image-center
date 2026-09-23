import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { createContext, runInContext } from 'node:vm';

const code = readFileSync(new URL('../public/admin/files/files.js', import.meta.url), 'utf8');
const sample = { id: '11111111-1111-4111-8111-111111111111', key: 'travel/photo.png', filename: 'photo.png', size: 100, deletedAt: '2026-09-17', url: '/api/trash?view=preview&id=x' };
function harness(fetcher) {
	const nodes = new Map(), events = new Map(), requests = [];
	function node() { return { hidden: false, value: '', textContent: '', children: [], attrs: {}, listeners: {}, disabled: false,
		classList: { add() {}, remove() {}, toggle() {} }, addEventListener(type, handler) { this.listeners[type] = handler; }, focus() {},
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

test('switches between files and recycle bin and allows recycle-bin selection', async () => {
	const h = harness(async () => ok()); h.run('switchView(true)'); await new Promise(setImmediate);
	assert.match(h.requests[0].url, /^\/api\/trash/); assert.equal(h.nodes.get('#trashNotice').hidden, false);
	assert.equal(h.nodes.get('#selectVisibleButton').hidden, false); assert.equal(h.nodes.get('#selectionBar').hidden, true);
	h.run('switchView(false)'); await new Promise(setImmediate);
	assert.match(h.requests.at(-1).url, /^\/api\/files/); assert.equal(h.nodes.get('#trashNotice').hidden, true);
});
test('recycle-bin selection uses record ids, not shared original paths', () => {
	const second = { ...sample, id: '22222222-2222-4222-8222-222222222222' };
	const h = harness(async () => ok());
	h.run(`trashMode=true; sortOrder.value='time-desc'; files=${JSON.stringify([sample, second])}; renderFiles();`);
	const rows = h.nodes.get('#folderList').children[0].children;
	rows[0].children[0].children[0].checked = true;
	rows[0].children[0].children[0].listeners.change();
	assert.equal(h.run('selectedKeys.size'), 1);
	assert.equal(h.run(`selectedKeys.has('${sample.id}')`), true);
	assert.equal(h.run(`selectedKeys.has('${second.id}')`), false);
	assert.equal(h.nodes.get('#batchRestoreTrashButton').hidden, false);
	assert.equal(h.nodes.get('#batchPurgeTrashButton').hidden, false);
	assert.equal(h.nodes.get('#batchDeleteButton').hidden, true);
	h.run('toggleVisibleSelection()');
	assert.equal(h.run('selectedKeys.size'), 2);
	assert.equal(h.run(`selectedKeys.has('${second.id}')`), true);
});
test('selecting current recycle-bin results stops at 50 records', () => {
	const h = harness(async () => ok());
	h.run(`trashMode=true; files=Array.from({length:51}, (_, index) => ({...${JSON.stringify(sample)}, id:'record-'+index, key:'photo-'+index+'.png'})); renderFiles(); toggleVisibleSelection();`);
	assert.equal(h.run('selectedKeys.size'), 50);
	assert.match(h.nodes.get('#selectedCount').textContent, /50/);
	h.run('openTrashBatchDialog("purge")');
	assert.equal(h.run('pendingTrashBatchFiles.length'), 50);
});
test('batch restore keeps failed records selected and never overwrites a conflicting original', async () => {
	const second = { ...sample, id: '22222222-2222-4222-8222-222222222222', key: 'travel/other.png' };
	const h = harness(async (url, options) => options.method === 'POST' && JSON.parse(options.body).id === second.id
		? Response.json({ success: false, message: '原路径已有新图片' }, { status: 409 })
		: Response.json({ success: true }));
	h.run(`trashMode=true; files=${JSON.stringify([sample, second])}; selectedKeys=new Set(files.map(file=>file.id)); renderFiles(); openTrashBatchDialog('restore');`);
	assert.equal(h.requests.length, 0);
	await h.run('submitTrashBatch({preventDefault(){}})');
	assert.equal(h.requests.length, 2);
	assert.deepEqual(JSON.parse(h.requests[0].options.body), { id: sample.id });
	assert.equal(h.run('files.length'), 1); assert.equal(h.run('files[0].id'), second.id);
	assert.equal(h.run('selectedKeys.size'), 1);
	assert.match(h.nodes.get('#trashBatchSummary').textContent, /已恢复 1 张，未完成 1 张/);
	assert.match(h.nodes.get('#trashBatchResults').children[1].textContent, /原路径已有新图片/);
});
test('batch permanent deletion requires explicit acknowledgment and uses each record id', async () => {
	const h = harness(async () => Response.json({ success: true }));
	h.run(`trashMode=true; files=[${JSON.stringify(sample)}]; selectedKeys.add(files[0].id); openTrashBatchDialog('purge');`);
	assert.equal(h.nodes.get('#confirmTrashBatchButton').disabled, true);
	await h.run('submitTrashBatch({preventDefault(){}})');
	assert.equal(h.requests.length, 0);
	h.nodes.get('#trashBatchAcknowledged').checked = true;
	await h.run('submitTrashBatch({preventDefault(){}})');
	assert.equal(h.requests.length, 1);
	assert.equal(h.requests[0].options.method, 'DELETE');
	assert.deepEqual(JSON.parse(h.requests[0].options.body), { id: sample.id, confirmation: 'DELETE' });
	assert.equal(h.run('files.length'), 0);
	assert.equal(h.run('selectedKeys.size'), 0);
	assert.equal(h.nodes.get('#confirmTrashBatchButton').hidden, true);
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
