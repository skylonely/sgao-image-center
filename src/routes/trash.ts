import { authorizeImageRequest } from '../auth';
import { isTrashId, purgeTrash, restoreTrash, trashPreview, TrashError, TRASH_RECORDS } from '../trash';

function json(data: unknown, status = 200) {
	return Response.json(data, { status, headers: { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
}

export async function handleTrash(request: Request, env: Env): Promise<Response> {
	const identity = await authorizeImageRequest(request, env);
	if (identity instanceof Response) return identity;
	const url = new URL(request.url);
	try {
		if (request.method === 'GET') {
			if (url.searchParams.get('view') === 'preview') {
				const id = url.searchParams.get('id') ?? '';
				if (!isTrashId(id)) return json({ success: false, message: '无效的回收站编号。' }, 400);
				const source = await trashPreview(env.IMAGES, id);
				if (!source) return json({ success: false, message: '图片不存在。' }, 404);
				return new Response(source.body, { headers: {
					'Content-Type': source.httpMetadata?.contentType ?? 'application/octet-stream',
					'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff',
					'Content-Security-Policy': "sandbox; default-src 'none'", 'Vary': 'Cookie, Cf-Access-Jwt-Assertion',
				} });
			}
			const result = await env.IMAGES.list({ prefix: TRASH_RECORDS, cursor: url.searchParams.get('cursor') || undefined,
				limit: 100, include: ['customMetadata'] });
			return json({ success: true, files: result.objects.map((object) => {
				const id = object.key.slice(TRASH_RECORDS.length);
				return { id, key: object.customMetadata?.originalKey, deletedAt: object.customMetadata?.deletedAt,
					size: Number(object.customMetadata?.originalSize ?? 0), contentType: object.customMetadata?.contentType,
					url: `/api/trash?view=preview&id=${id}` };
			}), cursor: result.truncated ? result.cursor : null, truncated: result.truncated });
		}
		if (!['POST', 'DELETE'].includes(request.method)) return json({ success: false, message: 'Method Not Allowed' }, 405);
		let body: { id?: unknown; confirmation?: unknown };
		try { body = await request.json(); } catch { return json({ success: false, message: '无效的 JSON。' }, 400); }
		if (!body || typeof body.id !== 'string' || !isTrashId(body.id)) return json({ success: false, message: '无效的回收站编号。' }, 400);
		if (request.method === 'POST') return json({ success: true, ...await restoreTrash(env.IMAGES, body.id) });
		if (body.confirmation !== 'DELETE') return json({ success: false, message: '请再次确认彻底删除，此操作无法恢复。' }, 400);
		await purgeTrash(env.IMAGES, body.id);
		return json({ success: true, id: body.id });
	} catch (error) {
		if (error instanceof TrashError) return json({ success: false, message: error.message }, error.status);
		console.error('Image recycle bin operation failed:', error);
		return json({ success: false, message: '操作失败，请刷新检查。已保存的副本不会自动清除。' }, 500);
	}
}
