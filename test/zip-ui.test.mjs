import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../public/admin/files/zip.js', import.meta.url), 'utf8');

function setup(fetchFn) {
	const window = {};
	const context = vm.createContext({ window, TextEncoder, TextDecoder, Uint8Array, Uint32Array, DataView, Blob, File, Response, Headers, DOMException, Date, setTimeout, location: { origin: 'https://img.sgao.cc' }, fetch: fetchFn });
	vm.runInContext(source, context);
	return context.ImageZip || window.ImageZip;
}

function readUint32(bytes, offset) { return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(offset, true); }

async function localEntries(blob) {
	const bytes = new Uint8Array(await blob.arrayBuffer()); const decoder = new TextDecoder(); const entries = []; let offset = 0;
	while (readUint32(bytes, offset) === 0x04034b50) {
		const size = readUint32(bytes, offset + 18); const nameLength = new DataView(bytes.buffer, bytes.byteOffset + offset).getUint16(26, true); const extraLength = new DataView(bytes.buffer, bytes.byteOffset + offset).getUint16(28, true);
		const start = offset + 30 + nameLength + extraLength; entries.push({ name: decoder.decode(bytes.slice(offset + 30, offset + 30 + nameLength)), data: bytes.slice(start, start + size) }); offset = start + size;
	}
	return entries;
}

test('图片备份 ZIP 保留原路径、原始字节和清单', async () => {
	const responses = new Map([
		['https://img.sgao.cc/travel/驾驶证.png', new Response(new Uint8Array([1, 2, 3]), { headers: { 'content-type': 'image/png', 'content-length': '3' } })],
		['https://img.sgao.cc/logo.svg', new Response('<svg/>', { headers: { 'content-type': 'image/svg+xml' } })],
	]);
	const zip = setup((url) => responses.get(url));
	const result = await zip.createZip([{ key: 'travel/驾驶证.png', url: 'https://img.sgao.cc/travel/驾驶证.png', size: 3, uploaded: '2026-09-18T00:00:00Z' }, { key: 'logo.svg', url: 'https://img.sgao.cc/logo.svg' }], { now: new Date('2026-09-18T00:00:00Z') });
	const entries = await localEntries(result.blob); const map = new Map(entries.map((entry) => [entry.name, entry.data]));
	assert.deepEqual([...map.keys()], ['images/travel/驾驶证.png', 'images/logo.svg', 'backup-manifest.json']);
	assert.deepEqual([...map.get('images/travel/驾驶证.png')], [1, 2, 3]);
	const manifest = JSON.parse(new TextDecoder().decode(map.get('backup-manifest.json')));
	assert.equal(manifest.source, 'https://img.sgao.cc'); assert.equal(manifest.includedCount, 2); assert.equal(manifest.included[0].archivePath, 'images/travel/驾驶证.png');
});

test('失败项写入清单，但不生成伪图片', async () => {
	const zip = setup((url) => url.endsWith('ok.png') ? new Response(new Uint8Array([9]), { headers: { 'content-type': 'image/png' } }) : new Response('<html>login</html>', { headers: { 'content-type': 'text/html' } }));
	const result = await zip.createZip([{ key: 'ok.png', url: 'https://img.sgao.cc/ok.png' }, { key: 'bad.png', url: 'https://img.sgao.cc/bad.png' }]);
	const entries = await localEntries(result.blob); assert.deepEqual(entries.map((entry) => entry.name), ['images/ok.png', 'backup-manifest.json']);
	const manifest = JSON.parse(new TextDecoder().decode(entries.at(-1).data)); assert.equal(manifest.failedCount, 1); assert.match(manifest.failed[0].reason, /网页/);
});

test('超过实际原图大小限制或危险路径时不产生 ZIP', async () => {
	const zip = setup(() => new Response(new Uint8Array([1, 2, 3]), { headers: { 'content-type': 'image/png' } }));
	await assert.rejects(zip.createZip([{ key: 'large.png', url: 'https://img.sgao.cc/large.png' }], { maxBytes: 2 }), /超过/);
	await assert.rejects(zip.createZip([{ key: '../outside.png', url: 'https://img.sgao.cc/outside.png' }]), /路径无效/);
});

test('只接受本服务生成的备份并在本机恢复原路径与字节', async () => {
	const zip = setup(() => new Response(new Uint8Array([0x89, 0x50, 0x4e, 0x47]), { headers: { 'content-type': 'image/png' } }));
	const exported = await zip.createZip([{ key: 'travel/photo.png', url: 'https://img.sgao.cc/travel/photo.png', contentType: 'image/png' }]);
	const backup = await zip.readBackup(exported.blob);
	assert.equal(backup.files.length, 1); assert.equal(backup.files[0].key, 'travel/photo.png');
	assert.deepEqual([...new Uint8Array(await backup.files[0].file.arrayBuffer())], [0x89, 0x50, 0x4e, 0x47]);
	await assert.rejects(zip.readBackup(new Blob([new Uint8Array([1, 2, 3])])), /清单|ZIP/);
});
