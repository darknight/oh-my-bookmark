import { searchBookmarks, getDB } from '$lib/server/db.js';
import type { PageServerLoad } from './$types';

const VALID_SIZES = [10, 20, 50, 100];

export const load: PageServerLoad = async ({ platform, url }) => {
	const db = getDB(platform);
	const query = url.searchParams.get('q') || '';
	const page = Number(url.searchParams.get('page')) || 1;
	const size = Number(url.searchParams.get('size')) || 10;
	const pageSize = VALID_SIZES.includes(size) ? size : 10;

	const result = query ? await searchBookmarks(db, query, page, pageSize) : { items: [], total: 0, page: 1, pageSize, totalPages: 0 };

	return {
		bookmarks: result,
		query
	};
};
