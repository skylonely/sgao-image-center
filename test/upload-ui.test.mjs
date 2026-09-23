import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { createContext, runInContext } from 'node:vm';

const code = readFileSync(new URL('../public/admin/app.js', import.meta.url), 'utf8');

function harness(request = async () => Response.json({ success: true, url: 'https://img.sgao.cc/image/test.png' })) {
	const nodes = new Map(), documentEvents = new Map(), windowEvents = new Map(), requests = [], revoked = [];
	let previewNumber = 0;
	function node() {
		return {
			hidden: false, value: '', textContent: '', children: [], handlers: new Map(), disabled: false,
			classList: { add() {}, remove() {} }, focus() {}, click() {},
			addEventListener(type, handler) { this.handlers.set(type, handler); },
			setAttribute() {}, append(...items) { this.children.push(...items); },
			replaceChildren(...items) { this.children = items; },
		};
	}
	const document = {
		activeElement: null, body: node(), createElement: node,
		addEventListener(type, handler) { documentEvents.set(type, handler); },
		querySelector(selector) { if (!nodes.has(selector)) nodes.set(selector, node()); return nodes.get(selector); },
		querySelectorAll() { return []; },
	};
	const window = {
		imageAccount: { authorized: true, request(url, options) { requests.push({ url, options }); return request(url, options); } },
		addEventListener(type, handler) { windowEvents.set(type, handler); },
	};
	const URL = { createObjectURL() { return `blob:preview-${++previewNumber}`; }, revokeObjectURL(url) { revoked.push(url); } };
	const context = createContext({ document, window, URL, File, FormData, Response, URLSearchParams, Intl, Date,
		localStorage: { getItem() { return null; }, setItem() {} }, console });
	document.querySelector('#conflictDialog').hidden = true;
	document.querySelector('#retryFailedButton').hidden = true;
	runInContext(code, context);
	return {
		nodes, document, window, windowEvents, requests, revoked, run: (expression) => runInContext(expression, context),
		paste(files, target = null) {
			let prevented = false;
			documentEvents.get('paste')({ target, clipboardData: { items: files.map((file) => ({ kind: 'file', type: file.type, getAsFile: () => file })) }, preventDefault() { prevented = true; } });
			return prevented;
		},
	};
}

test('consecutive screenshot pastes append uniquely named, previewable files and allow rename', () => {
	const h = harness();
	const screenshot = new File(['image'], 'screen.png', { type: 'image/png' });
	assert.equal(h.paste([screenshot]), true);
	assert.equal(h.paste([screenshot]), true);
	const names = h.run('selectedFiles.map(file => file.name)');
	assert.equal(names.length, 2);
	assert.match(names[0], /^clipboard-\d{8}-\d{6}\.png$/);
	assert.equal(names[1], names[0].replace('.png', '-2.png'));
	assert.equal(h.nodes.get('#fileList').children.length, 2);
	assert.equal(h.nodes.get('#fileList').children[0].children[0].src, 'blob:preview-1');
	const firstInput = h.nodes.get('#fileList').children[0].children[1].children[0].children[0].children[0];
	firstInput.value = 'my-screenshot'; firstInput.handlers.get('change')();
	assert.equal(h.run('selectedFiles[0].name'), 'my-screenshot.png');
	assert.equal(h.nodes.get('#fileList').children[0].children[0].src, 'blob:preview-1');
	const remove = h.nodes.get('#fileList').children[1].children[2].children[1];
	remove.handlers.get('click')();
	assert.equal(h.run('selectedFiles.length'), 1);
	assert.deepEqual(h.revoked, ['blob:preview-2']);
});

test('paste in text fields is ignored; upload uses the selected folder and keeps a successful record', async () => {
	const h = harness();
	const screenshot = new File(['image'], 'screen.png', { type: 'image/png' });
	assert.equal(h.paste([screenshot], { closest: () => ({}) }), false);
	assert.equal(h.run('selectedFiles.length'), 0);
	assert.equal(h.paste([screenshot]), true);
	h.nodes.get('#folder').value = 'travel/screenshots';
	await h.nodes.get('#uploadButton').handlers.get('click')();
	assert.equal(h.requests.length, 1);
	assert.equal(h.requests[0].url, '/api/upload');
	assert.equal(h.requests[0].options.body.get('folder'), 'travel/screenshots');
	assert.match(h.requests[0].options.body.get('file').name, /^clipboard-\d{8}-\d{6}\.png$/);
	assert.equal(h.run('selectedFiles.length'), 1);
	assert.equal(h.run('uploadStates.get(selectedFiles[0]).phase'), 'success');
	assert.equal(h.nodes.get('#fileList').children[0].children[1].children[1].children[0].textContent, '已上传');
	assert.equal(h.nodes.get('#fileList').children[0].children[1].children[0].children[0].children[0].disabled, true);
	assert.equal(h.nodes.get('#uploadButton').disabled, true);
	assert.equal(h.revoked.length, 0);
	const clear = h.nodes.get('#fileList').children[0].children[2].children[1];
	assert.equal(clear.textContent, '清除记录'); clear.handlers.get('click')();
	assert.equal(h.run('selectedFiles.length'), 0);
	assert.deepEqual(h.revoked, ['blob:preview-1']);
});

test('only failed images retry; successful and newly pending images are not resent', async () => {
	let calls = 0;
	const h = harness(async () => ++calls === 1
		? Response.json({ success: false, message: '暂时不可用' }, { status: 503 })
		: Response.json({ success: true, url: `https://img.sgao.cc/image/${calls}.png` }));
	h.paste([new File(['first'], 'first.png', { type: 'image/png' }), new File(['second'], 'second.png', { type: 'image/png' })]);
	await h.nodes.get('#uploadButton').handlers.get('click')();
	assert.equal(h.requests.length, 2);
	assert.equal(h.run('uploadStates.get(selectedFiles[0]).phase'), 'error');
	assert.equal(h.run('uploadStates.get(selectedFiles[1]).phase'), 'success');
	assert.equal(h.nodes.get('#retryFailedButton').hidden, false);
	assert.equal(h.nodes.get('#retryFailedButton').textContent, '只重试失败项（1）');
	h.paste([new File(['third'], 'third.png', { type: 'image/png' })]);
	await h.nodes.get('#retryFailedButton').handlers.get('click')();
	assert.equal(h.requests.length, 3);
	assert.equal(h.run('uploadStates.get(selectedFiles[0]).phase'), 'success');
	assert.equal(h.run('uploadStates.get(selectedFiles[2]).phase'), 'pending');
	assert.equal(h.nodes.get('#retryFailedButton').hidden, true);
	await h.nodes.get('#uploadButton').handlers.get('click')();
	assert.equal(h.requests.length, 4);
	assert.equal(h.run('selectedFiles.every(file => uploadStates.get(file).phase === "success")'), true);
	assert.equal(h.revoked.length, 0);
});

test('a running upload displays its state and disables both upload actions', async () => {
	let finish;
	const h = harness(() => new Promise((resolve) => { finish = resolve; }));
	h.paste([new File(['image'], 'screen.png', { type: 'image/png' })]);
	const uploading = h.nodes.get('#uploadButton').handlers.get('click')();
	assert.equal(h.run('uploadStates.get(selectedFiles[0]).phase'), 'uploading');
	assert.equal(h.nodes.get('#uploadButton').disabled, true);
	assert.equal(h.nodes.get('#retryFailedButton').disabled, true);
	finish(Response.json({ success: true, url: 'https://img.sgao.cc/image/test.png' }));
	await uploading;
	assert.equal(h.run('uploadStates.get(selectedFiles[0]).phase'), 'success');
});

test('renaming a failed image makes it pending; logout clears the private queue', async () => {
	const h = harness(async () => Response.json({ success: false, message: '暂时不可用' }, { status: 503 }));
	h.paste([new File(['image'], 'screen.png', { type: 'image/png' })]);
	await h.nodes.get('#uploadButton').handlers.get('click')();
	const input = h.nodes.get('#fileList').children[0].children[1].children[0].children[0].children[0];
	input.value = 'renamed'; input.handlers.get('change')();
	assert.equal(h.run('uploadStates.get(selectedFiles[0]).phase'), 'pending');
	assert.equal(h.nodes.get('#retryFailedButton').hidden, true);
	h.window.imageAccount.authorized = false;
	h.windowEvents.get('image-auth-changed')({ detail: { authorized: false } });
	assert.equal(h.run('selectedFiles.length'), 0);
	assert.equal(h.run('uploadStates.size'), 0);
	assert.equal(h.revoked.length, 1);
});
