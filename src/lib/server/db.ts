import type { Bookmark, BookmarkWithTags, Folder, PaginatedResult, Tag } from '$lib/types.js';

export function getDB(platform: App.Platform | undefined): D1Database {
	if (!platform?.env?.DB) {
		throw new Error('D1 database not available');
	}
	return platform.env.DB;
}

// === Folders ===

export async function getAllFolders(db: D1Database): Promise<Folder[]> {
	const { results } = await db
		.prepare('SELECT f.*, (SELECT COUNT(*) FROM bookmarks WHERE folder_id = f.id) as bookmark_count FROM folders f ORDER BY f.path')
		.all<Folder>();
	return results;
}

export function buildFolderTree(folders: Folder[]): Folder[] {
	const map = new Map<number, Folder>();
	const roots: Folder[] = [];

	for (const folder of folders) {
		map.set(folder.id, { ...folder, children: [] });
	}

	for (const folder of folders) {
		const node = map.get(folder.id)!;
		if (folder.parent_id && map.has(folder.parent_id)) {
			map.get(folder.parent_id)!.children!.push(node);
		} else {
			roots.push(node);
		}
	}

	return roots;
}

export async function createFolder(db: D1Database, name: string, parentId: number | null, path: string): Promise<number> {
	const result = await db
		.prepare('INSERT INTO folders (name, parent_id, path) VALUES (?, ?, ?)')
		.bind(name, parentId, path)
		.run();
	return result.meta.last_row_id as number;
}

// === Bookmarks ===

export async function getBookmarks(
	db: D1Database,
	options: {
		folderId?: number;
		tagName?: string;
		search?: string;
		favoriteOnly?: boolean;
		page?: number;
		pageSize?: number;
	} = {}
): Promise<PaginatedResult<BookmarkWithTags>> {
	const { folderId, tagName, search, favoriteOnly, page = 1, pageSize = 20 } = options;

	let whereClause = 'WHERE 1=1';
	const params: (string | number)[] = [];

	if (folderId !== undefined) {
		whereClause += ' AND b.folder_id = ?';
		params.push(folderId);
	}

	if (tagName) {
		whereClause += ' AND b.id IN (SELECT bt.bookmark_id FROM bookmark_tags bt JOIN tags t ON bt.tag_id = t.id WHERE t.name = ?)';
		params.push(tagName);
	}

	if (search) {
		whereClause += ' AND (b.title LIKE ? OR b.url LIKE ? OR b.note LIKE ? OR b.excerpt LIKE ?)';
		const pattern = `%${search}%`;
		params.push(pattern, pattern, pattern, pattern);
	}

	if (favoriteOnly) {
		whereClause += ' AND b.favorite = 1';
	}

	// Count total
	const countResult = await db
		.prepare(`SELECT COUNT(*) as count FROM bookmarks b ${whereClause}`)
		.bind(...params)
		.first<{ count: number }>();
	const total = countResult?.count ?? 0;

	// Fetch page
	const offset = (page - 1) * pageSize;
	const { results: bookmarks } = await db
		.prepare(
			`SELECT b.*, f.path as folder_path FROM bookmarks b LEFT JOIN folders f ON b.folder_id = f.id ${whereClause} ORDER BY b.created_at DESC LIMIT ? OFFSET ?`
		)
		.bind(...params, pageSize, offset)
		.all<Bookmark & { folder_path: string }>();

	// Fetch tags for all bookmarks
	const items: BookmarkWithTags[] = [];

	for (const bookmark of bookmarks) {
		const { results: tagResults } = await db
			.prepare(
				'SELECT t.name FROM tags t JOIN bookmark_tags bt ON t.id = bt.tag_id WHERE bt.bookmark_id = ?'
			)
			.bind(bookmark.id)
			.all<{ name: string }>();

		items.push({
			...bookmark,
			tags: tagResults.map((t) => t.name)
		});
	}

	return {
		items,
		total,
		page,
		pageSize,
		totalPages: Math.ceil(total / pageSize)
	};
}

export async function getBookmarkById(db: D1Database, id: number): Promise<BookmarkWithTags | null> {
	const bookmark = await db
		.prepare('SELECT b.*, f.path as folder_path FROM bookmarks b LEFT JOIN folders f ON b.folder_id = f.id WHERE b.id = ?')
		.bind(id)
		.first<Bookmark & { folder_path: string }>();

	if (!bookmark) return null;

	const { results: tagResults } = await db
		.prepare('SELECT t.name FROM tags t JOIN bookmark_tags bt ON t.id = bt.tag_id WHERE bt.bookmark_id = ?')
		.bind(id)
		.all<{ name: string }>();

	return { ...bookmark, tags: tagResults.map((t) => t.name) };
}

export async function createBookmark(
	db: D1Database,
	data: { title: string; url: string; note?: string; excerpt?: string; folder_id?: number | null; cover?: string; favorite?: number; tags?: string[] }
): Promise<number> {
	const now = new Date().toISOString();
	const result = await db
		.prepare(
			'INSERT INTO bookmarks (title, url, note, excerpt, folder_id, cover, favorite, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
		)
		.bind(
			data.title,
			data.url,
			data.note ?? '',
			data.excerpt ?? '',
			data.folder_id ?? null,
			data.cover ?? '',
			data.favorite ?? 0,
			now,
			now
		)
		.run();

	const bookmarkId = result.meta.last_row_id as number;

	if (data.tags && data.tags.length > 0) {
		await syncBookmarkTags(db, bookmarkId, data.tags);
	}

	return bookmarkId;
}

export async function updateBookmark(
	db: D1Database,
	id: number,
	data: { title?: string; url?: string; note?: string; excerpt?: string; folder_id?: number | null; cover?: string; favorite?: number; tags?: string[] }
): Promise<void> {
	const now = new Date().toISOString();
	const fields: string[] = ['updated_at = ?'];
	const params: (string | number | null)[] = [now];

	if (data.title !== undefined) { fields.push('title = ?'); params.push(data.title); }
	if (data.url !== undefined) { fields.push('url = ?'); params.push(data.url); }
	if (data.note !== undefined) { fields.push('note = ?'); params.push(data.note); }
	if (data.excerpt !== undefined) { fields.push('excerpt = ?'); params.push(data.excerpt); }
	if (data.folder_id !== undefined) { fields.push('folder_id = ?'); params.push(data.folder_id); }
	if (data.cover !== undefined) { fields.push('cover = ?'); params.push(data.cover); }
	if (data.favorite !== undefined) { fields.push('favorite = ?'); params.push(data.favorite); }

	await db.prepare(`UPDATE bookmarks SET ${fields.join(', ')} WHERE id = ?`).bind(...params, id).run();

	if (data.tags !== undefined) {
		await syncBookmarkTags(db, id, data.tags);
	}
}

export async function deleteBookmark(db: D1Database, id: number): Promise<void> {
	await db.prepare('DELETE FROM bookmark_tags WHERE bookmark_id = ?').bind(id).run();
	await db.prepare('DELETE FROM bookmarks WHERE id = ?').bind(id).run();
}

// === Tags ===

export async function getAllTags(db: D1Database): Promise<Tag[]> {
	const { results } = await db
		.prepare('SELECT t.*, (SELECT COUNT(*) FROM bookmark_tags WHERE tag_id = t.id) as bookmark_count FROM tags t ORDER BY t.name')
		.all<Tag>();
	return results;
}

export async function getOrCreateTag(db: D1Database, name: string): Promise<number> {
	const existing = await db.prepare('SELECT id FROM tags WHERE name = ?').bind(name).first<{ id: number }>();
	if (existing) return existing.id;

	const result = await db.prepare('INSERT INTO tags (name) VALUES (?)').bind(name).run();
	return result.meta.last_row_id as number;
}

async function syncBookmarkTags(db: D1Database, bookmarkId: number, tagNames: string[]): Promise<void> {
	await db.prepare('DELETE FROM bookmark_tags WHERE bookmark_id = ?').bind(bookmarkId).run();

	for (const name of tagNames) {
		if (!name.trim()) continue;
		const tagId = await getOrCreateTag(db, name.trim());
		await db.prepare('INSERT OR IGNORE INTO bookmark_tags (bookmark_id, tag_id) VALUES (?, ?)').bind(bookmarkId, tagId).run();
	}
}

// === Search ===

export async function searchBookmarks(
	db: D1Database,
	query: string,
	page: number = 1,
	pageSize: number = 20
): Promise<PaginatedResult<BookmarkWithTags>> {
	return getBookmarks(db, { search: query, page, pageSize });
}
