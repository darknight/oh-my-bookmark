<script lang="ts">
	import BookmarkList from '$lib/components/BookmarkList.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Search: {data.query} - Oh My Bookmark</title>
</svelte:head>

<div class="mb-6">
	<p class="text-sm text-muted-foreground">Search results for</p>
	<h1 class="text-2xl font-bold text-foreground">"{data.query}"</h1>
	<p class="mt-1 text-sm text-muted-foreground">{data.bookmarks.total} result{data.bookmarks.total !== 1 ? 's' : ''} found</p>
</div>
<BookmarkList result={data.bookmarks} baseUrl="/search?q={encodeURIComponent(data.query)}" />
