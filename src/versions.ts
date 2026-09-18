import { clearImageCache, isDeletedImage, isImageKey, VERSION_PREFIX } from './trash';

const VERSION_RECORDS = `${VERSION_PREFIX}records/`;
const VERSION_DATA = `${VERSION_PREFIX}data/`;
const VERSION_LIMIT = 5;

type VersionManifest = {
	key: string;
	createdAt: string;
	size: number;
	contentType: string;
	replacedEtag: string;
};

export type ImageVersion = VersionManifest & { id: string };

export class VersionError extends Error {
	constructor(message: string, public status = 409) {
		super(message);
	}
}

export const isVersionId = (id: string) => /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(id);

async function keyDigest(key: string): Promise<string> {
	const value = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key));
	return [...new Uint8Array(value)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function recordPrefix(key: string): Promise<string> {
	return `${VERSION_RECORDS}${await keyDigest(key)}/`;
}

function dataKey(id: string): string {
	return `${VERSION_DATA}${id}`;
}

async function recordsForKey(bucket: R2Bucket, key: string): Promise<Array<ImageVersion & { recordKey: string }>> {
	const result = await bucket.list({ prefix: await recordPrefix(key), limit: 1000, include: ['customMetadata'] });
	return result.objects
		.map((object) => {
			const id = object.key.split('/').at(-1) ?? '';
			const metadata = object.customMetadata;
			if (!isVersionId(id) || metadata?.originalKey !== key || !metadata.createdAt) return null;
			return {
				id,
				key,
				createdAt: metadata.createdAt,
				size: Number(metadata.originalSize ?? 0),
				contentType: metadata.contentType ?? 'application/octet-stream',
				replacedEtag: metadata.replacedEtag ?? '',
				recordKey: object.key,
			};
		})
		.filter((entry): entry is ImageVersion & { recordKey: string } => Boolean(entry))
		.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

async function discardVersion(bucket: R2Bucket, version: Pick<ImageVersion, 'id'> & { recordKey: string }): Promise<void> {
	try {
		await bucket.delete([dataKey(version.id), version.recordKey]);
	} catch {
		// An inaccessible historical object is never exposed publicly. It can be removed by the next successful replacement.
	}
}

async function pruneVersions(bucket: R2Bucket, key: string): Promise<void> {
	try {
		const stale = (await recordsForKey(bucket, key)).slice(VERSION_LIMIT);
		if (stale.length) await bucket.delete(stale.flatMap((version) => [dataKey(version.id), version.recordKey]));
	} catch {
		// Retention cleanup must not turn a successful replacement into a failed one.
	}
}

async function saveCurrentVersion(bucket: R2Bucket, key: string, expectedEtag: string, expectedVersion: string) {
	const source = await bucket.get(key);
	if (!source || isDeletedImage(source)) throw new VersionError('图片不存在或已删除。', 404);
	try {
		if (source.etag !== expectedEtag || source.version !== expectedVersion) {
			throw new VersionError('图片已在其他位置发生变化，请刷新后重新操作。');
		}

		const id = crypto.randomUUID();
		const createdAt = new Date().toISOString();
		const version: ImageVersion = {
			id,
			key,
			createdAt,
			size: source.size,
			contentType: source.httpMetadata?.contentType ?? 'application/octet-stream',
			replacedEtag: expectedEtag,
		};
		const copied = await bucket.put(dataKey(id), source.body, {
			httpMetadata: source.httpMetadata,
			customMetadata: source.customMetadata,
			onlyIf: new Headers({ 'If-None-Match': '*' }),
		});
		if (!copied) throw new VersionError('历史版本副本保存失败，原图未替换。', 500);

		const recordKey = `${await recordPrefix(key)}${id}`;
		const recorded = await bucket.put(recordKey, JSON.stringify(version satisfies VersionManifest), {
			httpMetadata: { contentType: 'application/json', cacheControl: 'no-store' },
			customMetadata: {
				originalKey: key,
				createdAt,
				originalSize: String(source.size),
				contentType: version.contentType,
				replacedEtag: expectedEtag,
			},
			onlyIf: new Headers({ 'If-None-Match': '*' }),
		});
		if (!recorded) {
			await discardVersion(bucket, { id, recordKey });
			throw new VersionError('历史版本记录保存失败，原图未替换。', 500);
		}

		return { ...version, recordKey };
	} finally {
		if (!source.bodyUsed) await source.body.cancel();
	}
}

function replacementMetadata(file: File): R2PutOptions {
	return {
		httpMetadata: { contentType: file.type, cacheControl: 'public, max-age=86400, s-maxage=31536000' },
		customMetadata: { originalFilename: file.name, uploadedAt: new Date().toISOString() },
	};
}

export async function replaceImageWithVersion(
	bucket: R2Bucket,
	key: string,
	file: File,
	expectedEtag: string,
	expectedVersion: string,
) {
	if (!isImageKey(key) || !expectedEtag || !expectedVersion) throw new VersionError('替换请求无效。', 400);
	const current = await bucket.head(key);
	if (!current || isDeletedImage(current)) throw new VersionError('图片不存在或已删除。', 404);
	if (current.etag !== expectedEtag || current.version !== expectedVersion) throw new VersionError('图片已在其他位置发生变化，请刷新后重新操作。');

	const version = await saveCurrentVersion(bucket, key, expectedEtag, expectedVersion);
	const object = await bucket.put(key, file, { ...replacementMetadata(file), onlyIf: { etagMatches: expectedEtag } });
	if (!object) {
		await discardVersion(bucket, version);
		throw new VersionError('图片在替换期间已发生变化，请刷新后重新操作。');
	}

	await clearImageCache(key);
	await pruneVersions(bucket, key);
	return { object, historyId: version.id };
}

async function loadVersion(bucket: R2Bucket, key: string, id: string): Promise<{ record: R2ObjectBody; manifest: VersionManifest }> {
	if (!isImageKey(key) || !isVersionId(id)) throw new VersionError('历史版本请求无效。', 400);
	const record = await bucket.get(`${await recordPrefix(key)}${id}`);
	if (!record) throw new VersionError('历史版本不存在或已被清理。', 404);
	const manifest = await record.json<VersionManifest>();
	if (manifest.key !== key) throw new VersionError('历史版本记录无效。', 400);
	return { record, manifest };
}

export async function listImageVersions(bucket: R2Bucket, key: string): Promise<ImageVersion[]> {
	if (!isImageKey(key)) throw new VersionError('图片路径无效。', 400);
	return (await recordsForKey(bucket, key)).slice(0, VERSION_LIMIT).map(({ recordKey: _recordKey, ...version }) => version);
}

export async function previewImageVersion(bucket: R2Bucket, key: string, id: string): Promise<R2ObjectBody> {
	await loadVersion(bucket, key, id);
	const source = await bucket.get(dataKey(id));
	if (!source) throw new VersionError('历史版本文件不存在或已被清理。', 404);
	return source;
}

export async function restoreImageVersion(
	bucket: R2Bucket,
	key: string,
	id: string,
	expectedEtag: string,
	expectedVersion: string,
) {
	if (!expectedEtag || !expectedVersion) throw new VersionError('恢复请求无效。', 400);
	await loadVersion(bucket, key, id);
	const historical = await bucket.get(dataKey(id));
	if (!historical) throw new VersionError('历史版本文件不存在或已被清理。', 404);
	try {
		const current = await bucket.head(key);
		if (!current || isDeletedImage(current)) throw new VersionError('图片不存在或已删除。', 404);
		if (current.etag !== expectedEtag || current.version !== expectedVersion) {
			throw new VersionError('图片已在其他位置发生变化，请刷新后重新操作。');
		}

		const version = await saveCurrentVersion(bucket, key, expectedEtag, expectedVersion);
		const restored = await bucket.put(key, historical.body, {
			httpMetadata: historical.httpMetadata,
			customMetadata: historical.customMetadata,
			onlyIf: { etagMatches: expectedEtag },
		});
		if (!restored) {
			await discardVersion(bucket, version);
			throw new VersionError('图片在恢复期间已发生变化，请刷新后重新操作。');
		}

		await clearImageCache(key);
		await pruneVersions(bucket, key);
		return { object: restored, historyId: version.id };
	} finally {
		if (!historical.bodyUsed) await historical.body.cancel();
	}
}
