<script lang="ts">
	import BookmarkList from '$lib/components/BookmarkList.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>{data.folder.name} - Oh My Bookmark</title>
</svelte:head>

<div class="mb-6">
	<p class="text-sm text-muted-foreground">{data.folder.path}</p>
	<h1 class="text-2xl font-bold text-foreground">{data.folder.name}</h1>
</div>
<BookmarkList result={data.bookmarks} baseUrl="/folder/{data.folder.id}" />
