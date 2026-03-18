import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB, createFolder, createBookmark } from '$lib/server/db.js';

interface CsvRecord {
	id: string;
	title: string;
	note: string;
	excerpt: string;
	url: string;
	folder: string;
	tags: string;
	created: string;
	cover: string;
	highlights: string;
	favorite: string;
}

/**
 * Given a folder path like "Abaxx / Cloud / Infra", ensure the full hierarchy exists.
 * Returns the folder ID of the deepest (leaf) folder.
 *
 * folderCache maps full path strings to folder IDs to avoid duplicate inserts.
 */
async function ensureFolderHierarchy(
	db: D1Database,
	folderPath: string,
	folderCache: Map<string, number>
): Promise<number> {
	if (folderCache.has(folderPath)) {
		return folderCache.get(folderPath)!;
	}

	const parts = folderPath.split(' / ');
	let parentId: number | null = null;

	for (let i = 0; i < parts.length; i++) {
		const name = parts[i].trim();
		const path = parts.slice(0, i + 1).join(' / ');

		if (folderCache.has(path)) {
			parentId = folderCache.get(path)!;
			continue;
		}

		// Check if folder already exists in DB
		const existing = await db
			.prepare('SELECT id FROM folders WHERE path = ?')
			.bind(path)
			.first<{ id: number }>();

		if (existing) {
			folderCache.set(path, existing.id);
			parentId = existing.id;
		} else {
			const id = await createFolder(db, name, parentId, path);
			folderCache.set(path, id);
			parentId = id;
		}
	}

	return parentId!;
}

/**
 * Clean a folder name: trim whitespace, replace corrupted characters,
 * and normalize the path.
 */
function cleanFolderPath(folder: string): string {
	let cleaned = folder.trim();

	// Replace common corrupted characters
	// Remove zero-width characters and other Unicode noise
	cleaned = cleaned.replace(/[\u200B-\u200D\uFEFF\u00A0]/g, ' ');

	// Collapse multiple spaces into one
	cleaned = cleaned.replace(/\s+/g, ' ');

	// Trim each segment
	cleaned = cleaned
		.split(' / ')
		.map((s) => s.trim())
		.filter((s) => s.length > 0)
		.join(' / ');

	return cleaned || 'Unsorted';
}

export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		const db = getDB(platform);
		const records: CsvRecord[] = await request.json();

		if (!Array.isArray(records) || records.length === 0) {
			return json({ error: 'Expected a non-empty array of records' }, { status: 400 });
		}

		const folderCache = new Map<string, number>();
		const stats = {
			totalRecords: records.length,
			bookmarksCreated: 0,
			foldersCreated: 0,
			tagsCreated: 0,
			errors: [] as string[]
		};

		// Track tags we've seen to count new ones
		const knownTags = new Set<string>();
		const existingTags = await db.prepare('SELECT name FROM tags').all<{ name: string }>();
		for (const t of existingTags.results) {
			knownTags.add(t.name);
		}

		// Count existing folders
		const existingFolderCount = await db
			.prepare('SELECT COUNT(*) as count FROM folders')
			.first<{ count: number }>();
		const folderCountBefore = existingFolderCount?.count ?? 0;

		for (let i = 0; i < records.length; i++) {
			const record = records[i];

			try {
				// Determine folder
				let folderPath = record.folder?.trim() || 'Unsorted';
				folderPath = cleanFolderPath(folderPath);
				const folderId = await ensureFolderHierarchy(db, folderPath, folderCache);

				// Parse tags
				const tags: string[] = record.tags
					? record.tags
							.split(',')
							.map((t) => t.trim())
							.filter((t) => t.length > 0)
					: [];

				// Track new tags for stats
				for (const tag of tags) {
					if (!knownTags.has(tag)) {
						knownTags.add(tag);
						stats.tagsCreated++;
					}
				}

				// Determine favorite
				const favorite = record.favorite === 'true' ? 1 : 0;

				// Use original created timestamp if available
				const title = record.title?.trim() || record.url || 'Untitled';
				const url = record.url?.trim();

				if (!url) {
					stats.errors.push(`Row ${i + 1}: missing URL, skipped`);
					continue;
				}

				const bookmarkId = await createBookmark(db, {
					title,
					url,
					note: record.note ?? '',
					excerpt: record.excerpt ?? '',
					folder_id: folderId,
					cover: record.cover ?? '',
					favorite,
					tags: tags.length > 0 ? tags : undefined
				});

				// Overwrite created_at with the original timestamp if available
				if (record.created) {
					await db
						.prepare('UPDATE bookmarks SET created_at = ? WHERE id = ?')
						.bind(record.created, bookmarkId)
						.run();
				}

				stats.bookmarksCreated++;
			} catch (err) {
				const msg = err instanceof Error ? err.message : String(err);
				stats.errors.push(`Row ${i + 1} (${record.title ?? 'unknown'}): ${msg}`);
			}
		}

		// Count folders created
		const folderCountAfter = await db
			.prepare('SELECT COUNT(*) as count FROM folders')
			.first<{ count: number }>();
		stats.foldersCreated = (folderCountAfter?.count ?? 0) - folderCountBefore;

		return json(stats, { status: 200 });
	} catch (error) {
		console.error('POST /api/import error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to import' },
			{ status: 500 }
		);
	}
};
