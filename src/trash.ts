// Internal data must never be served by public image routes or accepted as file keys.
export const TRASH_PREFIX = '__sgao_trash/';
export const TRASH_RECORDS = `${TRASH_PREFIX}records/`;
export const isTrashKey = (key: string) => key === '__sgao_trash' || key.startsWith(TRASH_PREFIX);
export const isDeletedImage = (object: R2Object | null) => Boolean(object?.customMetadata?.sgaoTrashId);
export const isImageKey = (key: string) => Boolean(key) && !key.startsWith('/') && !isTrashKey(key)
	&& !key.includes('\\') && !/[\u0000-\u001f\u007f]/.test(key)
	&& !key.split('/').some((segment) => !segment || segment === '.' || segment === '..')
	&& new TextEncoder().encode(key).byteLength <= 1024;
export const isTrashId = (id: string) => /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(id);
const dataKey = (id: string) => `${TRASH_PREFIX}data/${id}`;

export class TrashError extends Error {
	constructor(message: string, public status = 409) { super(message); }
}

export async function clearImageCache(key: string) {
	const url = 'https://img.sgao.cc/' + key.split('/').map(encodeURIComponent).join('/');
	try { await caches.default.delete(new Request(url)); } catch { /* Public reads check tombstones before caches. */ }
}

export async function moveToTrash(bucket: R2Bucket, key: string) {
	const source = await bucket.get(key);
	if (!source) throw new TrashError('图片不存在或已在回收站。', 404);
	if (isDeletedImage(source)) { await source.body.cancel(); throw new TrashError('图片不存在或已在回收站。', 404); }
	try {
		const id = crypto.randomUUID();
		const deletedAt = new Date().toISOString();
		// Copy the bytes and metadata first. Never unconditionally delete the original key:
		// R2 has no conditional DELETE. A unique tombstone gives conditional PUT/restore
		// a safe compare-and-swap boundary, including concurrent uploads of the same name.
		const copied = await bucket.put(dataKey(id), source.body, {
			httpMetadata: source.httpMetadata, customMetadata: source.customMetadata,
			onlyIf: new Headers({ 'If-None-Match': '*' }),
		});
		if (!copied) throw new TrashError('副本保存失败，原图未移除。', 500);
		const recorded = await bucket.put(`${TRASH_RECORDS}${id}`, JSON.stringify({ key, uploaded: source.uploaded.toISOString() }), {
			customMetadata: { originalKey: key, deletedAt, originalSize: String(source.size), contentType: source.httpMetadata?.contentType ?? 'application/octet-stream' },
			httpMetadata: { contentType: 'application/json' }, onlyIf: new Headers({ 'If-None-Match': '*' }),
		});
		if (!recorded) throw new TrashError('回收站记录保存失败，原图未移除。', 500);
		const marker = await bucket.put(key, JSON.stringify({ trashId: id }), {
			onlyIf: new Headers({ 'If-Match': source.httpEtag }),
			httpMetadata: { contentType: 'application/x-sgao-deleted', cacheControl: 'no-store' },
			customMetadata: { sgaoTrashId: id },
		});
		if (!marker) {
			await bucket.delete([dataKey(id), `${TRASH_RECORDS}${id}`]);
			throw new TrashError('图片在删除期间已变化，请刷新后重试。');
		}
		await clearImageCache(key);
		return { id, key, deletedAt };
	} finally {
		if (!source.bodyUsed) await source.body.cancel();
	}
}

export async function restoreTrash(bucket: R2Bucket, id: string) {
	const record = await bucket.get(`${TRASH_RECORDS}${id}`);
	if (!record) throw new TrashError('回收站图片不存在。', 404);
	const manifest = await record.json<{ key: string }>();
	if (!isImageKey(manifest.key)) throw new TrashError('回收站记录无效。', 400);
	const current = await bucket.head(manifest.key);
	if (current && current.customMetadata?.sgaoTrashId !== id) throw new TrashError('原路径已有新图片，无法恢复；不会覆盖现有文件。');
	const source = await bucket.get(dataKey(id));
	if (!source) throw new TrashError('可恢复的图片副本不存在。', 404);
	const restored = await bucket.put(manifest.key, source.body, {
		httpMetadata: source.httpMetadata, customMetadata: source.customMetadata,
		onlyIf: new Headers(current ? { 'If-Match': current.httpEtag } : { 'If-None-Match': '*' }),
	});
	if (!restored) throw new TrashError('原路径在恢复期间已变化，请刷新后重试。');
	await clearImageCache(manifest.key);
	let cleanupPending = false;
	try { await bucket.delete([dataKey(id), `${TRASH_RECORDS}${id}`]); } catch { cleanupPending = true; }
	return { key: manifest.key, cleanupPending };
}

export async function purgeTrash(bucket: R2Bucket, id: string) {
	if (!await bucket.head(`${TRASH_RECORDS}${id}`)) throw new TrashError('回收站图片不存在。', 404);
	// Leave the tiny original-path tombstone: removing it could race a new upload.
	// Uploads can conditionally reuse it. It holds no original image bytes.
	await bucket.delete([dataKey(id), `${TRASH_RECORDS}${id}`]);
}

export async function trashPreview(bucket: R2Bucket, id: string) {
	if (!await bucket.head(`${TRASH_RECORDS}${id}`)) throw new TrashError('回收站图片不存在。', 404);
	return bucket.get(dataKey(id));
}
