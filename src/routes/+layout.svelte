<script lang="ts">
	import '../app.css';
	import FolderTree from '$lib/components/FolderTree.svelte';
	import SearchBar from '$lib/components/SearchBar.svelte';
	import TagBadge from '$lib/components/TagBadge.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		data: {
			folderTree: import('$lib/types.js').Folder[];
			tags: import('$lib/types.js').Tag[];
			stats: { totalBookmarks: number; totalFolders: number; totalTags: number };
		};
		children: Snippet;
	}

	let { data, children }: Props = $props();
	let sidebarOpen = $state(false);
</script>

<div class="flex h-screen overflow-hidden">
	<!-- Mobile sidebar toggle -->
	<button
		type="button"
		class="fixed left-4 top-4 z-50 rounded-md border border-input bg-background p-2 shadow-sm lg:hidden"
		onclick={() => (sidebarOpen = !sidebarOpen)}
		aria-label="Toggle sidebar"
	>
		<svg
			class="h-5 w-5"
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			{#if sidebarOpen}
				<path d="M18 6 6 18" />
				<path d="m6 6 12 12" />
			{:else}
				<line x1="4" x2="20" y1="12" y2="12" />
				<line x1="4" x2="20" y1="6" y2="6" />
				<line x1="4" x2="20" y1="18" y2="18" />
			{/if}
		</svg>
	</button>

	<!-- Sidebar overlay on mobile -->
	{#if sidebarOpen}
		<button
			type="button"
			class="fixed inset-0 z-30 bg-black/50 lg:hidden"
			onclick={() => (sidebarOpen = false)}
			aria-label="Close sidebar"
		></button>
	{/if}

	<!-- Left Sidebar: Folders -->
	<aside
		class="fixed z-40 flex h-full w-[260px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-200 lg:static lg:translate-x-0 {sidebarOpen
			? 'translate-x-0'
			: '-translate-x-full'}"
	>
		<!-- Header -->
		<div class="flex items-center gap-2 border-b border-sidebar-border px-4 py-3">
			<svg
				class="h-5 w-5 text-primary"
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
			</svg>
			<a href="/" class="text-sm font-semibold text-sidebar-foreground">Oh My Bookmark</a>
		</div>

		<!-- Search -->
		<div class="px-3 py-3">
			<SearchBar />
		</div>

		<!-- Folders -->
		<div class="flex-1 overflow-y-auto px-3 pb-2">
			<div class="mb-2 flex items-center px-2">
				<span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Folders</span>
			</div>
			<a
				href="/"
				class="mb-1 flex items-center gap-2 rounded-md px-2 py-1 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent/50"
			>
				<svg
					class="h-4 w-4 text-muted-foreground"
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<rect width="7" height="7" x="3" y="3" rx="1" />
					<rect width="7" height="7" x="14" y="3" rx="1" />
					<rect width="7" height="7" x="14" y="14" rx="1" />
					<rect width="7" height="7" x="3" y="14" rx="1" />
				</svg>
				All Bookmarks
			</a>
			<FolderTree folders={data.folderTree} />
		</div>
	</aside>

	<!-- Main content -->
	<main class="flex-1 overflow-y-auto">
		<div class="mx-auto max-w-4xl px-6 py-6">
			{@render children()}
		</div>
	</main>

	<!-- Right Sidebar: Tags + Stats (hidden on small screens) -->
	<aside class="hidden w-[280px] shrink-0 flex-col border-l border-sidebar-border bg-sidebar lg:flex overflow-y-auto">
		<!-- Stats -->
		<div class="px-5 pt-6 pb-5">
			<div class="mb-3 flex items-center">
				<span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Stats</span>
			</div>
			<div class="space-y-2.5 text-sm">
				<div class="flex items-center justify-between">
					<span class="text-muted-foreground">Bookmarks</span>
					<span class="font-medium text-foreground">{data.stats.totalBookmarks}</span>
				</div>
				<div class="flex items-center justify-between">
					<span class="text-muted-foreground">Folders</span>
					<span class="font-medium text-foreground">{data.stats.totalFolders}</span>
				</div>
				<div class="flex items-center justify-between">
					<span class="text-muted-foreground">Tags</span>
					<span class="font-medium text-foreground">{data.stats.totalTags}</span>
				</div>
			</div>
		</div>

		<div class="mx-5 border-t border-sidebar-border"></div>

		<!-- Tags -->
		{#if data.tags.length > 0}
			<div class="px-5 pt-5 pb-6">
				<div class="mb-4 flex items-center">
					<span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tags</span>
				</div>
				<div class="flex flex-wrap gap-1.5">
					{#each data.tags as tag (tag.id)}
						<TagBadge name={tag.name} count={tag.bookmark_count} />
					{/each}
				</div>
			</div>
		{/if}
	</aside>
</div>
