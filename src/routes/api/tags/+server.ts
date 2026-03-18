import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB, getAllTags, getOrCreateTag } from '$lib/server/db.js';

export const GET: RequestHandler = async ({ platform }) => {
	try {
		const db = getDB(platform);
		const tags = await getAllTags(db);
		return json(tags);
	} catch (error) {
		console.error('GET /api/tags error:', error);
		return json({ error: 'Failed to fetch tags' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		const db = getDB(platform);
		const body = (await request.json()) as Record<string, string>;

		if (!body.name || !body.name.trim()) {
			return json({ error: 'name is required' }, { status: 400 });
		}

		const id = await getOrCreateTag(db, body.name.trim());
		return json({ id, name: body.name.trim() }, { status: 201 });
	} catch (error) {
		console.error('POST /api/tags error:', error);
		return json({ error: 'Failed to create tag' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ url, platform }) => {
	try {
		const db = getDB(platform);
		const name = url.searchParams.get('name');

		if (!name) {
			return json({ error: 'name query parameter is required' }, { status: 400 });
		}

		const tag = await db.prepare('SELECT id FROM tags WHERE name = ?').bind(name).first<{ id: number }>();

		if (!tag) {
			return json({ error: 'Tag not found' }, { status: 404 });
		}

		await db.prepare('DELETE FROM bookmark_tags WHERE tag_id = ?').bind(tag.id).run();
		await db.prepare('DELETE FROM tags WHERE id = ?').bind(tag.id).run();

		return json({ success: true });
	} catch (error) {
		console.error('DELETE /api/tags error:', error);
		return json({ error: 'Failed to delete tag' }, { status: 500 });
	}
};
