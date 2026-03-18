import { getAllFolders, buildFolderTree, getAllTags, getDB } from '$lib/server/db.js';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ platform }) => {
	const db = getDB(platform);
	const [folders, tags, bookmarkCount] = await Promise.all([
		getAllFolders(db),
		getAllTags(db),
		db.prepare('SELECT COUNT(*) as count FROM bookmarks').first<{ count: number }>()
	]);
	const folderTree = buildFolderTree(folders);

	return {
		folderTree,
		folders,
		tags,
		stats: {
			totalBookmarks: bookmarkCount?.count ?? 0,
			totalFolders: folders.length,
			totalTags: tags.length
		}
	};
};
