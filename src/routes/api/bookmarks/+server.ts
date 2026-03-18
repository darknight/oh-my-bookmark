import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB, getBookmarks, createBookmark } from '$lib/server/db.js';

export const GET: RequestHandler = async ({ url, platform }) => {
	try {
		const db = getDB(platform);

		const page = parseInt(url.searchParams.get('page') ?? '1', 10);
		const pageSize = parseInt(url.searchParams.get('pageSize') ?? '20', 10);
		const folderId = url.searchParams.get('folderId');
		const tag = url.searchParams.get('tag');
		const search = url.searchParams.get('search');
		const favorite = url.searchParams.get('favorite');

		const result = await getBookmarks(db, {
			page,
			pageSize,
			folderId: folderId ? parseInt(folderId, 10) : undefined,
			tagName: tag ?? undefined,
			search: search ?? undefined,
			favoriteOnly: favorite === 'true'
		});

		return json(result);
	} catch (error) {
		console.error('GET /api/bookmarks error:', error);
		return json({ error: 'Failed to fetch bookmarks' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		const db = getDB(platform);
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const body = (await request.json()) as any;

		if (!body.title || !body.url) {
			return json({ error: 'title and url are required' }, { status: 400 });
		}

		const id = await createBookmark(db, {
			title: body.title,
			url: body.url,
			note: body.note,
			excerpt: body.excerpt,
			folder_id: body.folder_id,
			cover: body.cover,
			favorite: body.favorite ? 1 : 0,
			tags: body.tags
		});

		return json({ id }, { status: 201 });
	} catch (error) {
		console.error('POST /api/bookmarks error:', error);
		return json({ error: 'Failed to create bookmark' }, { status: 500 });
	}
};
