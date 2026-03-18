import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB, getBookmarkById, updateBookmark, deleteBookmark } from '$lib/server/db.js';

export const GET: RequestHandler = async ({ params, platform }) => {
	try {
		const db = getDB(platform);
		const id = parseInt(params.id, 10);

		if (isNaN(id)) {
			return json({ error: 'Invalid bookmark ID' }, { status: 400 });
		}

		const bookmark = await getBookmarkById(db, id);

		if (!bookmark) {
			return json({ error: 'Bookmark not found' }, { status: 404 });
		}

		return json(bookmark);
	} catch (error) {
		console.error(`GET /api/bookmarks/${params.id} error:`, error);
		return json({ error: 'Failed to fetch bookmark' }, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ params, request, platform }) => {
	try {
		const db = getDB(platform);
		const id = parseInt(params.id, 10);

		if (isNaN(id)) {
			return json({ error: 'Invalid bookmark ID' }, { status: 400 });
		}

		const existing = await getBookmarkById(db, id);
		if (!existing) {
			return json({ error: 'Bookmark not found' }, { status: 404 });
		}

				// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const body = (await request.json()) as any;

		await updateBookmark(db, id, {
			title: body.title,
			url: body.url,
			note: body.note,
			excerpt: body.excerpt,
			folder_id: body.folder_id,
			cover: body.cover,
			favorite: body.favorite !== undefined ? (body.favorite ? 1 : 0) : undefined,
			tags: body.tags
		});

		const updated = await getBookmarkById(db, id);
		return json(updated);
	} catch (error) {
		console.error(`PUT /api/bookmarks/${params.id} error:`, error);
		return json({ error: 'Failed to update bookmark' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params, platform }) => {
	try {
		const db = getDB(platform);
		const id = parseInt(params.id, 10);

		if (isNaN(id)) {
			return json({ error: 'Invalid bookmark ID' }, { status: 400 });
		}

		const existing = await getBookmarkById(db, id);
		if (!existing) {
			return json({ error: 'Bookmark not found' }, { status: 404 });
		}

		await deleteBookmark(db, id);
		return json({ success: true });
	} catch (error) {
		console.error(`DELETE /api/bookmarks/${params.id} error:`, error);
		return json({ error: 'Failed to delete bookmark' }, { status: 500 });
	}
};
