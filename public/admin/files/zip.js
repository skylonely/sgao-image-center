(() => {
	const encoder = new TextEncoder();
	const MAX_BYTES = 50 * 1024 * 1024;
	const crcTable = new Uint32Array(256);
	for (let value = 0; value < 256; value += 1) {
		let crc = value;
		for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
		crcTable[value] = crc >>> 0;
	}

	function crc32(bytes) {
		let crc = 0xffffffff;
		for (const byte of bytes) crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 0xff];
		return (crc ^ 0xffffffff) >>> 0;
	}

	function abortError() {
		try { return new DOMException('导出已取消', 'AbortError'); } catch { const error = new Error('导出已取消'); error.name = 'AbortError'; return error; }
	}

	function assertNotAborted(signal) { if (signal?.aborted) throw abortError(); }

	function archiveError(message, code) { const error = new Error(message); error.code = code; return error; }

	function safeKey(key) {
		if (typeof key !== 'string' || !key || key.length > 1024 || key.startsWith('/') || key.includes('\\') || /[\u0000-\u001f\u007f]/.test(key)
			|| key.split('/').some((part) => !part || part === '.' || part === '..')) throw archiveError('文件路径无效，无法生成备份。', 'INVALID_PATH');
		return key;
	}

	function uint16(value) { const bytes = new Uint8Array(2); new DataView(bytes.buffer).setUint16(0, value, true); return bytes; }
	function uint32(value) { const bytes = new Uint8Array(4); new DataView(bytes.buffer).setUint32(0, value >>> 0, true); return bytes; }
	function join(parts) { const length = parts.reduce((total, part) => total + part.length, 0); const output = new Uint8Array(length); let offset = 0; for (const part of parts) { output.set(part, offset); offset += part.length; } return output; }

	function dosTimeDate(value) {
		const date = value instanceof Date && !Number.isNaN(value.getTime()) ? value : new Date();
		const year = Math.min(2107, Math.max(1980, date.getFullYear()));
		return { time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2), date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate() };
	}

	function storedZip(entries, now) {
		const timestamp = dosTimeDate(now); const chunks = []; const central = []; let offset = 0;
		for (const entry of entries) {
			const name = encoder.encode(entry.name); const bytes = entry.bytes; const crc = crc32(bytes);
			const local = join([uint32(0x04034b50), uint16(20), uint16(0x0800), uint16(0), uint16(timestamp.time), uint16(timestamp.date), uint32(crc), uint32(bytes.length), uint32(bytes.length), uint16(name.length), uint16(0), name]);
			chunks.push(local, bytes);
			central.push(join([uint32(0x02014b50), uint16(20), uint16(20), uint16(0x0800), uint16(0), uint16(timestamp.time), uint16(timestamp.date), uint32(crc), uint32(bytes.length), uint32(bytes.length), uint16(name.length), uint16(0), uint16(0), uint16(0), uint16(0), uint32(0), uint32(offset), name]));
			offset += local.length + bytes.length;
		}
		const centralSize = central.reduce((total, item) => total + item.length, 0);
		const end = join([uint32(0x06054b50), uint16(0), uint16(0), uint16(entries.length), uint16(entries.length), uint32(centralSize), uint32(offset), uint16(0)]);
		return new Blob([...chunks, ...central, end], { type: 'application/zip' });
	}

	function publicFailure(file, error) { return { key: String(file.key || ''), url: String(file.url || ''), reason: error?.message || '读取失败' }; }

	async function createZip(files, options = {}) {
		if (!Array.isArray(files) || !files.length) throw archiveError('请选择至少一张图片。', 'EMPTY');
		const fetchFn = options.fetchFn || globalThis.fetch; const signal = options.signal; const maxBytes = Number.isFinite(options.maxBytes) ? options.maxBytes : MAX_BYTES;
		if (typeof fetchFn !== 'function') throw archiveError('当前浏览器不支持读取图片文件。', 'UNSUPPORTED');
		const included = []; const failed = []; const entries = []; let actualBytes = 0; const seen = new Set();
		for (let index = 0; index < files.length; index += 1) {
			assertNotAborted(signal); const file = files[index]; const key = safeKey(file?.key);
			if (seen.has(key)) throw archiveError('备份中包含重复的文件路径。', 'DUPLICATE');
			seen.add(key); options.onProgress?.({ phase: 'reading', index: index + 1, total: files.length, key });
			try {
				if (typeof file.url !== 'string' || !file.url) throw archiveError('图片地址无效。', 'INVALID_URL');
				const response = await fetchFn(file.url, { credentials: 'same-origin', signal }); assertNotAborted(signal);
				if (!response.ok) throw archiveError(`下载失败（HTTP ${response.status}）。`, 'HTTP');
				if (/^text\/html\b/i.test(response.headers?.get('content-type') || '')) throw archiveError('返回了网页而不是图片，请重新登录后重试。', 'HTML');
				const declared = Number(response.headers?.get('content-length'));
				if (Number.isFinite(declared) && declared >= 0 && actualBytes + declared > maxBytes) throw archiveError('原图总大小超过 50 MB，请缩小导出范围。', 'MAX_BYTES');
				const bytes = new Uint8Array(await response.arrayBuffer()); assertNotAborted(signal);
				if (actualBytes + bytes.length > maxBytes) throw archiveError('原图总大小超过 50 MB，请缩小导出范围。', 'MAX_BYTES');
				actualBytes += bytes.length; const archivePath = `images/${key}`;
				entries.push({ name: archivePath, bytes }); included.push({ key, url: file.url, archivePath, listedSize: Number(file.size) || 0, actualSize: bytes.length, uploaded: file.uploaded || null, contentType: file.contentType || null, etag: file.etag || null });
			} catch (error) {
				if (error?.name === 'AbortError' || signal?.aborted) throw error?.name === 'AbortError' ? error : abortError();
				if (error?.code === 'MAX_BYTES') throw error;
				failed.push(publicFailure(file, error));
			}
		}
		if (!included.length) throw archiveError(failed[0]?.reason || '没有可导出的图片。', 'NO_FILES');
		options.onProgress?.({ phase: 'packing', index: included.length, total: files.length });
		const manifest = { schemaVersion: 1, generatedAt: (options.now instanceof Date ? options.now : new Date()).toISOString(), source: globalThis.location?.origin || '', requestedCount: files.length, includedCount: included.length, failedCount: failed.length, originalBytes: actualBytes, included, failed };
		entries.push({ name: 'backup-manifest.json', bytes: encoder.encode(`${JSON.stringify(manifest, null, 2)}\n`) });
		return { blob: storedZip(entries, options.now), manifest };
	}

	function download(blob, filename) {
		if (!globalThis.URL?.createObjectURL || !globalThis.document?.body) throw archiveError('当前浏览器不支持保存 ZIP 文件。', 'UNSUPPORTED');
		const url = globalThis.URL.createObjectURL(blob); const link = globalThis.document.createElement('a');
		link.href = url; link.download = filename; link.hidden = true; globalThis.document.body.append(link); link.click(); link.remove();
		globalThis.setTimeout(() => globalThis.URL.revokeObjectURL(url), 1000);
	}

	globalThis.ImageZip = Object.freeze({ createZip, download, MAX_BYTES });
})();
