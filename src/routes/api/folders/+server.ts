import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB, getAllFolders, createFolder } from '$lib/server/db.js';

export const GET: RequestHandler = async ({ platform }) => {
	try {
		const db = getDB(platform);
		const folders = await getAllFolders(db);
		return json(folders);
	} catch (error) {
		console.error('GET /api/folders error:', error);
		return json({ error: 'Failed to fetch folders' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		const db = getDB(platform);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const body = (await request.json()) as any;

		if (!body.name || !body.path) {
			return json({ error: 'name and path are required' }, { status: 400 });
		}

		const id = await createFolder(db, body.name, body.parent_id ?? null, body.path);
		return json({ id }, { status: 201 });
	} catch (error) {
		console.error('POST /api/folders error:', error);
		return json({ error: 'Failed to create folder' }, { status: 500 });
	}
};
