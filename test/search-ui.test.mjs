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

function setFilter(h, selector, value) {
	h.nodes.get(selector).value = value;
	h.nodes.get(selector).handlers.get('change')();
}
const visibleKeys = (h) => JSON.parse(h.run('JSON.stringify(renderedFiles.map(file => file.key))'));

test('directory filter includes descendants but not similar prefixes, and combines with format and search', async () => {
	const h = harness(async () => page([file('travel/passport.PNG'), file('travel/day1/passport.png'), file('travel-2/passport.png'), file('travel/passport.jpg')]));
	await h.run('loadFiles({reset:true})'); setFilter(h, '#directoryFilter', 'dir:travel');
	assert.deepEqual(visibleKeys(h), ['travel/passport.PNG', 'travel/day1/passport.png', 'travel/passport.jpg']);
	setFilter(h, '#formatFilter', 'png'); h.input('DAY1');
	assert.deepEqual(visibleKeys(h), ['travel/day1/passport.png']); assert.equal(h.requests.length, 1);
	assert.match(h.nodes.get('#fileCount').textContent, /1 \/ 4 个文件/);
});

test('root filter excludes all folders, including a folder literally named root', async () => {
	const h = harness(async () => page([file('logo.png'), file('root/logo.png'), file('travel/a.png')]));
	await h.run('loadFiles({reset:true})'); setFilter(h, '#directoryFilter', 'root');
	assert.deepEqual(visibleKeys(h), ['logo.png']);
	setFilter(h, '#directoryFilter', 'dir:root'); assert.deepEqual(visibleKeys(h), ['root/logo.png']);
});

test('format matches case-insensitive stored extensions, merges jpg/jpeg, and ignores misleading MIME or folder suffixes', async () => {
	const h = harness(async () => page([file('a.JPG'), file('b.jpeg'), { ...file('c.png'), contentType: 'image/jpeg' }, file('folder.jpeg/plain'), file('jpeg')]));
	await h.run('loadFiles({reset:true})'); setFilter(h, '#formatFilter', 'jpeg');
	assert.deepEqual(visibleKeys(h), ['a.JPG', 'b.jpeg']);
	setFilter(h, '#formatFilter', 'png'); assert.deepEqual(visibleKeys(h), ['c.png']);
});

test('all supported formats filter correctly, while all formats keeps unrecognized files', async () => {
	const formats = ['png', 'webp', 'gif', 'svg'];
	const h = harness(async () => page([...formats.map(format => file(`sample.${format.toUpperCase()}`)), file('other.avif')]));
	await h.run('loadFiles({reset:true})');
	for (const format of formats) { setFilter(h, '#formatFilter', format); assert.deepEqual(visibleKeys(h), [`sample.${format.toUpperCase()}`]); }
	setFilter(h, '#formatFilter', ''); assert.equal(h.run('renderedFiles.length'), 5);
});

test('format-only filtering reads later and empty pages without requiring a search word', async () => {
	const h = harness(async (url) => url.includes('cursor=last') ? page([file('travel/target.webp')]) : url.includes('cursor=next') ? page([], 'last') : page([file('a.png')], 'next'));
	await h.run('loadFiles({reset:true})'); setFilter(h, '#formatFilter', 'webp'); h.flush(); await tick();
	assert.equal(h.requests.length, 3); assert.deepEqual(visibleKeys(h), ['travel/target.webp']);
	assert.match(h.nodes.get('#searchProgressText').textContent, /筛选完成.*1 个匹配/);
});

test('clearing filters preserves the search word and clears hidden selection and preview', async () => {
	const h = harness(async () => page([file('travel/photo.png'), file('docs/photo.svg'), file('other.png')]));
	await h.run('loadFiles({reset:true})'); h.input('photo'); setFilter(h, '#directoryFilter', 'dir:travel'); setFilter(h, '#formatFilter', 'png');
	h.run("selectedKeys.add('travel/photo.png'); openImagePreview('travel/photo.png', null)");
	h.nodes.get('#clearFiltersButton').handlers.get('click')();
	assert.equal(h.nodes.get('#searchInput').value, 'photo'); assert.equal(h.nodes.get('#directoryFilter').value, '');
	assert.equal(h.nodes.get('#formatFilter').value, ''); assert.equal(h.run('selectedKeys.size'), 0);
	assert.equal(h.nodes.get('#imagePreview').hidden, true);
	assert.deepEqual(visibleKeys(h), ['travel/photo.png', 'docs/photo.svg']); assert.equal(h.nodes.get('#clearFiltersButton').disabled, true);
});

test('directory options accumulate ancestors safely and can be completed explicitly without a filter', async () => {
	const h = harness(async (url) => url.includes('cursor=next') ? page([file('later/sub/a.png'), file('特殊<目录>/b.png')]) : page([file('travel/day1/c.png')], 'next'));
	await h.run('loadFiles({reset:true})'); assert.match(h.nodes.get('#directoryFilterHint').textContent, /随读取补齐/);
	assert.equal(h.nodes.get('#loadDirectoriesButton').hidden, false);
	await h.nodes.get('#loadDirectoriesButton').handlers.get('click')();
	const options = h.nodes.get('#directoryFilter').children;
	assert.deepEqual(options.map(option => option.value).sort(), ['', 'root', 'dir:later', 'dir:later/sub', 'dir:travel', 'dir:travel/day1', 'dir:特殊<目录>'].sort());
	const special = options.find(option => option.value === 'dir:特殊<目录>');
	assert.equal(special.textContent, '特殊<目录>（含子目录）'); assert.equal(special.innerHTML, undefined);
	assert.equal(h.nodes.get('#loadDirectoriesButton').hidden, true); assert.match(h.nodes.get('#directoryFilterHint').textContent, /已完整读取/);
});

test('refresh retains selected directory before its page is available, and directory options are independent of search results', async () => {
	const h = harness(async () => page([file('docs/a.png')], 'next'));
	h.nodes.get('#directoryFilter').value = 'dir:travel'; h.nodes.get('#formatFilter').value = 'png'; h.input('none');
	const loading = h.run('loadFiles({reset:true})');
	assert.equal(h.nodes.get('#directoryFilter').value, 'dir:travel');
	await loading;
	assert.equal(h.nodes.get('#directoryFilter').value, 'dir:travel');
	assert.ok(h.nodes.get('#directoryFilter').children.some(option => option.value === 'dir:docs'));
	assert.ok(h.nodes.get('#directoryFilter').children.some(option => option.value === 'dir:travel'));
});

test('switching views and logging out clears filters and private directory options', async () => {
	const h = harness(async url => url.startsWith('/api/trash') ? page([file('deleted/a.gif', 'trash-1')]) : page([file('private/a.png')]));
	await h.run('loadFiles({reset:true})'); setFilter(h, '#directoryFilter', 'dir:private'); setFilter(h, '#formatFilter', 'png');
	h.run('switchView(true)'); await tick();
	assert.equal(h.nodes.get('#directoryFilter').value, ''); assert.equal(h.nodes.get('#formatFilter').value, '');
	assert.equal(h.nodes.get('#directoryFilter').children.some(option => option.value === 'dir:private'), false);
	setFilter(h, '#formatFilter', 'gif'); assert.deepEqual(visibleKeys(h), ['deleted/a.gif']);
	h.window.imageAccount.authorized = false; h.events.get('image-auth-changed')({ detail: { authorized: false } });
	assert.equal(h.nodes.get('#directoryFilter').value, ''); assert.equal(h.nodes.get('#formatFilter').value, '');
	assert.deepEqual(h.nodes.get('#directoryFilter').children.map(option => option.value), ['', 'root']);
});

test('filter changes discard late pages and keep partial results explicitly incomplete after failure', async () => {
	let resolve, calls = 0;
	const pending = new Promise(done => { resolve = done; });
	const h = harness(async () => ++calls === 1 ? page([file('a.png')], 'next') : calls === 2 ? pending : Response.json({ success: false, message: '读取失败' }, { status: 500 }));
	await h.run('loadFiles({reset:true})'); setFilter(h, '#formatFilter', 'png'); h.flush(); await tick();
	setFilter(h, '#formatFilter', 'svg'); assert.equal(h.requests[1].options.signal.aborted, true);
	resolve(page([file('stale.png')])); await tick(); h.flush(); await tick();
	assert.equal(h.run('files.length'), 1); assert.match(h.nodes.get('#searchProgressText').textContent, /筛选已暂停.*结果可能不完整/);
	assert.match(h.nodes.get('#managerStatus').textContent, /读取失败/);
});

test('directory completion can pause and resume without a keyword or filter', async () => {
	let resolve, calls = 0;
	const pending = new Promise(done => { resolve = done; });
	const h = harness(async () => ++calls === 1 ? page([file('first/a.png')], 'next') : calls === 2 ? pending : page([file('later/b.png')]));
	await h.run('loadFiles({reset:true})'); const reading = h.nodes.get('#loadDirectoriesButton').handlers.get('click')(); await tick();
	h.click(); assert.match(h.nodes.get('#searchProgressText').textContent, /读取已暂停/);
	resolve(page([file('stale/c.png')])); await reading; await h.click();
	assert.equal(h.run('listComplete'), true); assert.equal(h.run('files.length'), 2);
	assert.ok(h.nodes.get('#directoryFilter').children.some(option => option.value === 'dir:later'));
});
