export interface Folder {
	id: number;
	name: string;
	parent_id: number | null;
	path: string;
	children?: Folder[];
	bookmark_count?: number;
}

export interface Bookmark {
	id: number;
	title: string;
	url: string;
	note: string;
	excerpt: string;
	folder_id: number | null;
	cover: string;
	favorite: number;
	created_at: string;
	updated_at: string;
	folder_path?: string;
	tags?: string[];
}

export interface Tag {
	id: number;
	name: string;
	bookmark_count?: number;
}

export interface BookmarkWithTags extends Bookmark {
	tags: string[];
}

export interface PaginatedResult<T> {
	items: T[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
}
