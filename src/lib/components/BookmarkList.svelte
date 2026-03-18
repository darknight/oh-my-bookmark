<script lang="ts">
	import type { BookmarkWithTags, PaginatedResult } from '$lib/types.js';
	import { goto } from '$app/navigation';
	import TagBadge from './TagBadge.svelte';

	const PAGE_SIZES = [10, 20, 50, 100];

	interface Props {
		result: PaginatedResult<BookmarkWithTags>;
		baseUrl?: string;
		onEdit?: (id: number) => void;
		onDelete?: (id: number) => void;
	}

	let { result, baseUrl = '', onEdit, onDelete }: Props = $props();

	function getDomain(url: string): string {
		try {
			return new URL(url).hostname;
		} catch {
			return url;
		}
	}

	function formatDate(dateStr: string): string {
		try {
			return new Date(dateStr).toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'short',
				day: 'numeric'
			});
		} catch {
			return dateStr;
		}
	}

	function buildPageUrl(page: number): string {
		const url = new URL(baseUrl || '/', 'http://placeholder');
		url.searchParams.set('page', String(page));
		if (result.pageSize !== 10) {
			url.searchParams.set('size', String(result.pageSize));
		}
		return `${url.pathname}${url.search}`;
	}

	function handlePageSizeChange(e: Event) {
		const size = Number((e.target as HTMLSelectElement).value);
		const url = new URL(baseUrl || '/', 'http://placeholder');
		url.searchParams.set('page', '1');
		if (size !== 10) {
			url.searchParams.set('size', String(size));
		}
		goto(`${url.pathname}${url.search}`);
	}
</script>

{#if result.items.length === 0}
	<div class="flex flex-col items-center justify-center py-16 text-center">
		<svg
			class="mb-4 h-12 w-12 text-muted-foreground/50"
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="1.5"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
		</svg>
		<p class="text-lg font-medium text-muted-foreground">No bookmarks found</p>
		<p class="mt-1 text-sm text-muted-foreground/75">Try adjusting your search or filters.</p>
	</div>
{:else}
	<div class="space-y-1">
		{#each result.items as bookmark (bookmark.id)}
			<div class="group rounded-lg border border-transparent px-4 py-3 transition-colors hover:border-border hover:bg-card">
				<div class="flex items-start justify-between gap-4">
					<div class="min-w-0 flex-1">
						<div class="flex items-center gap-2">
							<a
								href={bookmark.url}
								target="_blank"
								rel="noopener noreferrer"
								class="truncate text-base font-medium text-foreground hover:text-primary hover:underline"
							>
								{bookmark.title || bookmark.url}
							</a>
							{#if bookmark.favorite}
								<svg
									class="h-3.5 w-3.5 shrink-0 fill-warning text-warning"
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 24 24"
								>
									<polygon
										points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
									/>
								</svg>
							{/if}
						</div>
						<div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
							<span class="truncate">{getDomain(bookmark.url)}</span>
							{#if bookmark.folder_path}
								<span class="flex items-center gap-1">
									<svg class="h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
										<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
									</svg>
									{bookmark.folder_path}
								</span>
							{/if}
							<span>{formatDate(bookmark.created_at)}</span>
						</div>
						{#if bookmark.tags && bookmark.tags.length > 0}
							<div class="mt-2 flex flex-wrap gap-1.5">
								{#each bookmark.tags as tag}
									<TagBadge name={tag} />
								{/each}
							</div>
						{/if}
					</div>
					{#if onEdit || onDelete}
						<div class="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
							{#if onEdit}
								<button
									type="button"
									onclick={() => onEdit(bookmark.id)}
									class="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
									title="编辑"
								>
									<svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
										<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
										<path d="m15 5 4 4"/>
									</svg>
								</button>
							{/if}
							{#if onDelete}
								<button
									type="button"
									onclick={() => onDelete(bookmark.id)}
									class="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
									title="删除"
								>
									<svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
										<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
									</svg>
								</button>
							{/if}
						</div>
					{/if}
				</div>
			</div>
		{/each}
	</div>

	<div class="mt-6 flex items-center justify-between">
		<!-- Page size selector -->
		<div class="flex items-center gap-2 text-sm text-muted-foreground">
			<span>Per page</span>
			<select
				onchange={handlePageSizeChange}
				value={result.pageSize}
				class="rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
			>
				{#each PAGE_SIZES as size}
					<option value={size}>{size}</option>
				{/each}
			</select>
		</div>

		<!-- Pagination -->
		{#if result.totalPages > 1}
			<nav class="flex items-center gap-1">
				{#if result.page > 1}
					<a
						href={buildPageUrl(result.page - 1)}
						class="rounded-md border border-input px-3 py-1.5 text-sm transition-colors hover:bg-accent"
					>
						Previous
					</a>
				{/if}
				{#each Array.from({ length: result.totalPages }, (_, i) => i + 1) as p}
					{#if p === result.page}
						<span class="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground">
							{p}
						</span>
					{:else if p === 1 || p === result.totalPages || (p >= result.page - 2 && p <= result.page + 2)}
						<a
							href={buildPageUrl(p)}
							class="rounded-md border border-input px-3 py-1.5 text-sm transition-colors hover:bg-accent"
						>
							{p}
						</a>
					{:else if p === result.page - 3 || p === result.page + 3}
						<span class="px-1 text-muted-foreground">...</span>
					{/if}
				{/each}
				{#if result.page < result.totalPages}
					<a
						href={buildPageUrl(result.page + 1)}
						class="rounded-md border border-input px-3 py-1.5 text-sm transition-colors hover:bg-accent"
					>
						Next
					</a>
				{/if}
			</nav>
		{/if}
	</div>
{/if}
