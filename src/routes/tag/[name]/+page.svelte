<script lang="ts">
	import BookmarkList from '$lib/components/BookmarkList.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Tag: {data.tagName} - Oh My Bookmark</title>
</svelte:head>

<div class="mb-6">
	<p class="text-sm text-muted-foreground">Tag</p>
	<h1 class="text-2xl font-bold text-foreground">#{data.tagName}</h1>
</div>
<BookmarkList result={data.bookmarks} baseUrl="/tag/{encodeURIComponent(data.tagName)}" />
