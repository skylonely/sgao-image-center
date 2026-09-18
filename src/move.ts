import { clearImageCache, isDeletedImage, TrashError } from './trash';

export class MoveError extends TrashError {
	constructor(message: string, status = 409, public copied?: R2Object) { super(message, status); }
}

// R2 has no conditional DELETE or multi-key transaction. Leave a tiny hidden
// marker at the old path, as with trash, so cached/GitHub fallback images stay hidden.
// Never delete a copied target on failure: it may already have been replaced.
export async function moveImage(bucket: R2Bucket, key: string, targetKey: string, expectedEtag: string, expectedVersion?: string) {
	const source = await bucket.get(key, { onlyIf: new Headers({ 'If-Match': `"${expectedEtag}"` }) });
	if (!source || isDeletedImage(source)) {
		if (source && 'body' in source && source.body) await source.body.cancel();
		throw new MoveError('图片不存在或已移除，请刷新。', 404);
	}
	if (!('body' in source) || !source.body) throw new MoveError('图片已变化，请刷新后重试。');
	let copied: R2Object | undefined;
	const id = `move:${crypto.randomUUID()}`;
	try {
		if (expectedVersion && source.version !== expectedVersion) throw new MoveError('图片版本已变化，请刷新后重试。');
		if (key === targetKey) return { skipped: true as const, file: source };
		const target = await bucket.head(targetKey);
		// A previous move marker contains no image bytes and may be safely reused
		// conditionally. Trash markers stay reserved for their restore operation.
		if (target && !target.customMetadata?.sgaoTrashId?.startsWith('move:')) throw new MoveError('目标路径已存在，不会覆盖。');
		const written = await bucket.put(targetKey, source.body, {
			onlyIf: new Headers(target ? { 'If-Match': target.httpEtag } : { 'If-None-Match': '*' }),
			httpMetadata: source.httpMetadata,
			customMetadata: { ...source.customMetadata, previousKey: key, movedAt: new Date().toISOString() },
		});
		if (!written) throw new MoveError('目标路径已存在，不会覆盖。');
		copied = written;
		const latest = await bucket.head(key);
		if (!latest || latest.version !== source.version || latest.etag !== source.etag || isDeletedImage(latest)) {
			throw new MoveError('原图在移动期间已变化，目标副本已保留；请刷新检查。', 409, copied);
		}
		const marker = await bucket.put(key, JSON.stringify({ movedTo: targetKey }), {
			onlyIf: new Headers({ 'If-Match': source.httpEtag }),
			httpMetadata: { contentType: 'application/x-sgao-deleted', cacheControl: 'no-store' },
			customMetadata: { sgaoTrashId: id, movedTo: targetKey },
		});
		if (!marker) throw new MoveError('原图在移动期间已变化，目标副本已保留；请刷新检查。', 409, copied);
		await Promise.all([clearImageCache(key), clearImageCache(targetKey)]);
		return { skipped: false as const, file: copied };
	} catch (error) {
		// A failed response after a committed marker must not be reported as a copy-only failure.
		if (copied) {
			try {
				if ((await bucket.head(key))?.customMetadata?.sgaoTrashId === id) {
					await Promise.all([clearImageCache(key), clearImageCache(targetKey)]);
					return { skipped: false as const, file: copied };
				}
			} catch { /* Leave the copy intact and report an uncertain result. */ }
		}
		if (error instanceof MoveError) throw error;
		throw new MoveError(copied ? '移动未能确认，目标副本已保留；请刷新检查两个路径。' : '移动失败，原图未移除，请刷新检查目标路径。', 500, copied);
	} finally {
		if (!source.bodyUsed) {
			try { await source.body.cancel(); } catch { /* Cleanup must not mask a committed move. */ }
		}
	}
}
