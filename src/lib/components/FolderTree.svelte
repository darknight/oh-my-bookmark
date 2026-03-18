<script lang="ts">
	import type { Folder } from '$lib/types.js';
	import { page } from '$app/state';
	import FolderTree from './FolderTree.svelte';

	interface Props {
		folders: Folder[];
		depth?: number;
	}

	let { folders, depth = 0 }: Props = $props();

	let expanded: Record<number, boolean> = $state({});

	function toggle(id: number) {
		expanded[id] = !expanded[id];
	}

	function isActive(folderId: number): boolean {
		return page.url.pathname === `/folder/${folderId}`;
	}
</script>

<ul class="space-y-0.5" style:padding-left="{depth > 0 ? 12 : 0}px">
	{#each folders as folder (folder.id)}
		{@const hasChildren = folder.children && folder.children.length > 0}
		{@const isOpen = expanded[folder.id] ?? false}
		{@const active = isActive(folder.id)}
		<li>
			<div
				class="flex items-center gap-1 rounded-md px-2 py-1 text-sm transition-colors {active
					? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
					: 'text-sidebar-foreground hover:bg-sidebar-accent/50'}"
			>
				<button
					type="button"
					class="flex h-5 w-5 shrink-0 items-center justify-center rounded hover:bg-sidebar-accent"
					onclick={() => toggle(folder.id)}
					aria-label={isOpen ? 'Collapse' : 'Expand'}
				>
					{#if hasChildren}
						<svg
							class="h-3.5 w-3.5 transition-transform {isOpen ? 'rotate-90' : ''}"
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="m9 18 6-6-6-6" />
						</svg>
					{/if}
				</button>
				<svg
					class="h-4 w-4 shrink-0 text-muted-foreground"
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path
						d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"
					/>
				</svg>
				<a href="/folder/{folder.id}" class="flex-1 truncate">{folder.name}</a>
				{#if folder.bookmark_count}
					<span class="ml-auto shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
						{folder.bookmark_count}
					</span>
				{/if}
			</div>
			{#if hasChildren && isOpen}
				<FolderTree folders={folder.children!} depth={depth + 1} />
			{/if}
		</li>
	{/each}
</ul>
