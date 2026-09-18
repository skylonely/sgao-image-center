import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { createContext, runInContext } from 'node:vm';

const code = readFileSync(new URL('../public/admin/files/files.js', import.meta.url), 'utf8');
const file = (key, id) => ({ key, id, url: `/image/${key}`, size: 100, uploaded: '2026-09-18', deletedAt: '2026-09-18' });
const page = (files, cursor = null) => Response.json({ success: true, files, truncated: Boolean(cursor), cursor });
const tick = () => new Promise(setImmediate);

function harness(fetcher) {
	const nodes = new Map(), events = new Map(), requests = [], timers = new Map();
	let timerId = 0;
	function node() { return { hidden: false, value: '', textContent: '', children: [], attrs: {}, handlers: new Map(), disabled: false,
		classList: { add() {}, remove() {}, toggle() {} }, focus() {}, select() {},
		addEventListener(name, callback) { this.handlers.set(name, callback); },
		setAttribute(key, value) { this.attrs[key] = value; }, getAttribute(key) { return this.attrs[key]; }, removeAttribute(key) { delete this.attrs[key]; },
		append(...items) { this.children.push(...items); }, replaceChildren(...items) { this.children = items; }, remove() {} }; }
	const document = { body: node(), addEventListener() {}, createElement: node, createTextNode: (value) => value,
		querySelector(selector) { if (!nodes.has(selector)) nodes.set(selector, node()); return nodes.get(selector); } };
	const window = { imageAccount: { authorized: true, request(url, options) { requests.push({ url, options }); return fetcher(url, options); } },
		addEventListener(name, handler) { events.set(name, handler); },
		clearTimeout(id) { timers.delete(id); }, setTimeout(callback, delay) { timers.set(++timerId, { callback, delay }); return timerId; } };
	const context = createContext({ document, window, localStorage: { getItem() { return null; }, setItem() {} },
		URLSearchParams, AbortController, Intl, Date, console });
	runInContext(code, context);
	return { nodes, events, requests, window, timers, run: (value) => runInContext(value, context),
		input(value) { nodes.get('#searchInput').value = value; nodes.get('#searchInput').handlers.get('input')(); },
		click() { return nodes.get('#searchControlButton').handlers.get('click')(); },
		flush() { const pending = [...timers.values()]; timers.clear(); for (const timer of pending) timer.callback(); } };
}

test('ordinary browsing reads one page; search finds a later page across an empty page', async () => {
	const h = harness(async (url) => {
		const cursor = new URL(url, 'https://img.sgao.cc').searchParams.get('cursor');
		return !cursor ? page([file('a.png')], 'second') : cursor === 'second' ? page([], 'third') : page([file('travel/驾驶证.png')]);
	});
	await h.run('loadFiles({reset:true})'); assert.equal(h.requests.length, 1);
	h.input('驾驶证'); assert.match(h.nodes.get('#searchProgressText').textContent, /正在搜索全部/);
	assert.equal(h.requests.length, 1); assert.equal([...h.timers.values()][0].delay, 300);
	h.flush(); await tick();
	assert.equal(h.requests.length, 3); assert.equal(h.run('renderedFiles[0].key'), 'travel/驾驶证.png');
	assert.match(h.nodes.get('#searchProgressText').textContent, /搜索完成.*2 个文件.*1 个匹配/);
	assert.equal(h.nodes.get('#searchControlButton').hidden, true);
	assert.equal(h.nodes.get('#loadMoreButton').hidden, true);
});

test('rapid keyword changes debounce one scan; complete data uses local case-insensitive directory matching', async () => {
	const h = harness(async () => page([file('Travel/A.png'), file('docs/B.png')]));
	h.input('t'); h.input('tr'); h.input('TRAVEL'); assert.equal(h.timers.size, 1);
	h.flush(); await tick(); assert.equal(h.requests.length, 1); assert.equal(h.run('renderedFiles.length'), 1);
	h.input('DOCS'); h.flush(); await tick(); assert.equal(h.requests.length, 1);
	assert.equal(h.run('renderedFiles[0].key'), 'docs/B.png');
});

test('pause aborts the current page and ignores its late response; resume retries the same cursor', async () => {
	let resolve, calls = 0;
	const pending = new Promise((done) => { resolve = done; });
	const h = harness(async () => ++calls === 1 ? page([file('a.png')], 'next') : calls === 2 ? pending : page([file('target.png')]));
	await h.run('loadFiles({reset:true})'); h.input('target'); h.flush(); await tick();
	h.click(); assert.equal(h.requests[1].options.signal.aborted, true);
	assert.equal(h.nodes.get('#managerStatus').textContent, '');
	assert.match(h.nodes.get('#searchProgressText').textContent, /搜索已暂停.*结果可能不完整/);
	resolve(page([file('late.png')])); await tick(); assert.equal(h.run('files.length'), 1);
	await h.click(); assert.equal(h.run('renderedFiles[0].key'), 'target.png');
	assert.equal(h.requests[1].url, h.requests[2].url);
});

test('clear cancels debounce/in-flight requests and restores manual pagination without stale results', async () => {
	let resolve;
	const pending = new Promise((done) => { resolve = done; });
	const h = harness(async () => h.requests.length === 1 ? page([file('a.png')], 'next') : pending);
	await h.run('loadFiles({reset:true})'); h.input('target'); h.input(''); h.flush(); assert.equal(h.requests.length, 1);
	h.input('target'); h.flush(); await tick(); h.input('');
	assert.equal(h.requests[1].options.signal.aborted, true); assert.equal(h.nodes.get('#searchProgress').hidden, true);
	assert.equal(h.nodes.get('#loadMoreButton').hidden, false);
	resolve(page([file('stale.png')])); await tick(); assert.equal(h.run('files.length'), 1);
});

test('failure keeps partial results and marks incomplete; continue retries rather than skipping a page', async () => {
	let calls = 0;
	const h = harness(async () => ++calls === 1 ? page([file('a.png')], 'next') : calls === 2 ? Response.json({ success: false, message: '网络错误' }, { status: 500 }) : page([file('target.png')]));
	await h.run('loadFiles({reset:true})'); h.input('target'); h.flush(); await tick();
	assert.equal(h.run('files.length'), 1); assert.match(h.nodes.get('#managerStatus').textContent, /网络错误/);
	assert.match(h.nodes.get('#searchProgressText').textContent, /结果可能不完整/);
	assert.match(h.nodes.get('#folderList').children[0].innerHTML, /暂未找到/);
	await h.click(); assert.equal(h.requests[1].url, h.requests[2].url);
	assert.equal(h.run('listComplete'), true); assert.equal(h.nodes.get('#managerStatus').textContent, '');
});

test('complete no-match result is distinguished from an unfinished search', async () => {
	const h = harness(async () => page([file('a.png')]));
	h.input('absent'); h.flush(); await tick();
	assert.match(h.nodes.get('#folderList').children[0].innerHTML, /没有匹配的文件/);
	assert.doesNotMatch(h.nodes.get('#folderList').children[0].innerHTML, /暂未找到/);
	assert.match(h.nodes.get('#searchProgressText').textContent, /搜索完成.*0 个匹配/);
});

test('switching to trash cancels an old search and searches only the trash view', async () => {
	let resolve;
	const pending = new Promise((done) => { resolve = done; });
	const h = harness(async (url) => url.startsWith('/api/trash') ? page([file('travel/deleted.png', 'trash-1')]) : pending);
	h.input('old'); h.flush(); await tick(); h.run('switchView(true)'); await tick();
	assert.equal(h.requests[0].options.signal.aborted, true); assert.equal(h.nodes.get('#searchInput').value, '');
	resolve(page([file('old.png')])); await tick(); assert.equal(h.run('files[0].id'), 'trash-1');
	h.input('deleted'); h.flush(); await tick(); assert.equal(h.run('renderedFiles.length'), 1);
	assert.equal(h.requests.length, 2);
});

test('logout cancels pending requests and debounce and clears search metadata', async () => {
	let resolve;
	const pending = new Promise((done) => { resolve = done; });
	const h = harness(async () => pending);
	h.input('private'); h.flush(); await tick();
	h.window.imageAccount.authorized = false; h.events.get('image-auth-changed')({ detail: { authorized: false } });
	assert.equal(h.requests[0].options.signal.aborted, true); assert.equal(h.nodes.get('#searchProgressText').textContent, '');
	resolve(page([file('private.png')])); await tick();
	assert.equal(h.run('files.length'), 0); assert.equal(h.nodes.get('#manager').hidden, true);
});

test('deduplicates repeated files, but keeps distinct trash versions with the same path', async () => {
	let calls = 0;
	const h = harness(async () => ++calls === 1 ? page([file('a.png')], 'next') : page([file('a.png'), file('b.png')]));
	h.input('.png'); h.flush(); await tick(); assert.equal(h.run('files.length'), 2);
	const trash = harness(async () => page([file('a.png', 'id-1'), file('a.png', 'id-2')]));
	trash.run('trashMode=true'); trash.input('a.png'); trash.flush(); await tick(); assert.equal(trash.run('files.length'), 2);
});

test('broken/repeated continuation cursor stops safely instead of looping or claiming completion', async () => {
	let calls = 0;
	const h = harness(async () => ++calls === 1 ? page([file('a.png')], 'same') : page([file('b.png')], 'same'));
	h.input('.png'); h.flush(); await tick();
	assert.equal(h.requests.length, 2); assert.equal(h.run('listComplete'), false);
	assert.match(h.nodes.get('#managerStatus').textContent, /分页信息异常/);
	assert.match(h.nodes.get('#searchProgressText').textContent, /结果可能不完整/);
});

test('search crosses a full 100-file page and finds a match on file 101', async () => {
	const first = Array.from({ length: 100 }, (_, index) => file(`photos/${index}.png`));
	const h = harness(async (url) => url.includes('cursor=next') ? page([file('travel/passport.png')]) : page(first, 'next'));
	await h.run('loadFiles({reset:true})'); assert.equal(h.run('files.length'), 100);
	h.input('passport'); h.flush(); await tick();
	assert.equal(h.run('renderedFiles.length'), 1);
	assert.match(h.nodes.get('#searchProgressText').textContent, /搜索完成.*101 个文件/);
});

test('changing keyword during a pending page discards that response and restarts without skipping data', async () => {
	let resolve, calls = 0;
	const pending = new Promise((done) => { resolve = done; });
	const h = harness(async () => ++calls === 1 ? page([file('first.png')], 'next') : calls === 2 ? pending : page([file('new.png')]));
	await h.run('loadFiles({reset:true})'); h.input('old'); h.flush(); await tick(); h.input('new');
	resolve(page([file('old.png')])); await tick(); h.flush(); await tick();
	assert.equal(h.run('files.some(file => file.key === "old.png")'), false);
	assert.equal(h.run('renderedFiles[0].key'), 'new.png'); assert.equal(h.requests[1].url, h.requests[2].url);
});

test('refresh after completion discovers new files and preserves the keyword', async () => {
	let calls = 0;
	const h = harness(async () => ++calls === 1 ? page([file('first.png')]) : page([file('first.png'), file('new.png')]));
	h.input('new'); h.flush(); await tick(); assert.equal(h.run('renderedFiles.length'), 0);
	await h.run('loadFiles({reset:true})'); assert.equal(h.run('renderedFiles[0].key'), 'new.png');
	assert.equal(h.nodes.get('#searchInput').value, 'new');
});

test('mutation cancels a pending search page so a late listing cannot reintroduce a deleted file', async () => {
	let resolve, calls = 0;
	const pending = new Promise((done) => { resolve = done; });
	const h = harness(async (url, options) => options?.method === 'DELETE' ? Response.json({ success: true })
		: ++calls === 1 ? page([file('delete.png')], 'next') : calls === 2 ? pending : page([file('other.png')]));
	await h.run('loadFiles({reset:true})'); h.input('.png'); h.flush(); await tick();
	h.run('openDeleteDialog(["delete.png"])'); await h.run('deleteFile()'); await tick();
	resolve(page([file('delete.png')])); await tick();
	assert.equal(h.run('files.some(file => file.key === "delete.png")'), false);
	assert.equal(h.run('listComplete'), true);
});
