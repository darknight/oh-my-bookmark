import { getBookmarks, getDB } from '$lib/server/db.js';
import type { PageServerLoad } from './$types';

const VALID_SIZES = [10, 20, 50, 100];

export const load: PageServerLoad = async ({ platform, url, params }) => {
	const db = getDB(platform);
	const tagName = decodeURIComponent(params.name);
	const page = Number(url.searchParams.get('page')) || 1;
	const size = Number(url.searchParams.get('size')) || 10;
	const pageSize = VALID_SIZES.includes(size) ? size : 10;
	const result = await getBookmarks(db, { tagName, page, pageSize });

	return {
		bookmarks: result,
		tagName
	};
};
