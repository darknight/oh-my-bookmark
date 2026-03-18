<script lang="ts">
	import type { Folder } from '$lib/types.js';

	let {
		bookmark = null,
		folders = [],
		onSave,
		onCancel
	}: {
		bookmark?: {
			id?: number;
			title: string;
			url: string;
			note: string;
			excerpt: string;
			folder_id: number | null;
			cover: string;
			favorite: number;
			tags: string[];
		} | null;
		folders: Folder[];
		onSave: (data: Record<string, unknown>) => void;
		onCancel: () => void;
	} = $props();

	let title = $state(bookmark?.title ?? '');
	let url = $state(bookmark?.url ?? '');
	let note = $state(bookmark?.note ?? '');
	let excerpt = $state(bookmark?.excerpt ?? '');
	let folderId = $state<number | null>(bookmark?.folder_id ?? null);
	let cover = $state(bookmark?.cover ?? '');
	let isFavorite = $state((bookmark?.favorite ?? 0) === 1);
	let tagsInput = $state(bookmark?.tags?.join(', ') ?? '');
	let saving = $state(false);

	function flattenFolders(folders: Folder[], depth = 0): { folder: Folder; depth: number }[] {
		const result: { folder: Folder; depth: number }[] = [];
		for (const folder of folders) {
			result.push({ folder, depth });
			if (folder.children) {
				result.push(...flattenFolders(folder.children, depth + 1));
			}
		}
		return result;
	}

	const flatFolders = $derived(flattenFolders(folders));

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!title.trim() || !url.trim()) return;

		saving = true;
		const tags = tagsInput
			.split(',')
			.map((t) => t.trim())
			.filter(Boolean);

		await onSave({
			title: title.trim(),
			url: url.trim(),
			note,
			excerpt,
			folder_id: folderId,
			cover,
			favorite: isFavorite ? 1 : 0,
			tags
		});
		saving = false;
	}
</script>

<form onsubmit={handleSubmit} class="space-y-4">
	<div>
		<label for="title" class="block text-sm font-medium text-foreground mb-1">标题 *</label>
		<input
			id="title"
			type="text"
			bind:value={title}
			required
			class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
			placeholder="书签标题"
		/>
	</div>

	<div>
		<label for="url" class="block text-sm font-medium text-foreground mb-1">URL *</label>
		<input
			id="url"
			type="url"
			bind:value={url}
			required
			class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
			placeholder="https://..."
		/>
	</div>

	<div>
		<label for="folder" class="block text-sm font-medium text-foreground mb-1">文件夹</label>
		<select
			id="folder"
			bind:value={folderId}
			class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
		>
			<option value={null}>-- 无文件夹 --</option>
			{#each flatFolders as { folder, depth }}
				<option value={folder.id}>{'  '.repeat(depth)}{folder.name}</option>
			{/each}
		</select>
	</div>

	<div>
		<label for="tags" class="block text-sm font-medium text-foreground mb-1">标签</label>
		<input
			id="tags"
			type="text"
			bind:value={tagsInput}
			class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
			placeholder="用逗号分隔，如: javascript, web, tools"
		/>
	</div>

	<div>
		<label for="note" class="block text-sm font-medium text-foreground mb-1">备注</label>
		<textarea
			id="note"
			bind:value={note}
			rows={3}
			class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
			placeholder="备注信息"
		></textarea>
	</div>

	<div>
		<label for="excerpt" class="block text-sm font-medium text-foreground mb-1">摘要</label>
		<textarea
			id="excerpt"
			bind:value={excerpt}
			rows={2}
			class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
			placeholder="页面摘要"
		></textarea>
	</div>

	<div class="flex items-center gap-2">
		<input id="favorite" type="checkbox" bind:checked={isFavorite} class="rounded border-input" />
		<label for="favorite" class="text-sm text-foreground">收藏</label>
	</div>

	<div class="flex justify-end gap-2 pt-2">
		<button
			type="button"
			onclick={onCancel}
			class="px-4 py-2 text-sm rounded-md border border-input bg-background hover:bg-accent"
		>
			取消
		</button>
		<button
			type="submit"
			disabled={saving || !title.trim() || !url.trim()}
			class="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
		>
			{saving ? '保存中...' : bookmark?.id ? '更新' : '创建'}
		</button>
	</div>
</form>
