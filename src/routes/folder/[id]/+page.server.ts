import { getBookmarks, getDB } from '$lib/server/db.js';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

const VALID_SIZES = [10, 20, 50, 100];

export const load: PageServerLoad = async ({ platform, url, params }) => {
	const db = getDB(platform);
	const folderId = Number(params.id);

	if (isNaN(folderId)) {
		error(400, 'Invalid folder ID');
	}

	const page = Number(url.searchParams.get('page')) || 1;
	const size = Number(url.searchParams.get('size')) || 10;
	const pageSize = VALID_SIZES.includes(size) ? size : 10;
	const result = await getBookmarks(db, { folderId, page, pageSize });

	const folder = await db
		.prepare('SELECT * FROM folders WHERE id = ?')
		.bind(folderId)
		.first<{ id: number; name: string; path: string }>();

	if (!folder) {
		error(404, 'Folder not found');
	}

	return {
		bookmarks: result,
		folder
	};
};
