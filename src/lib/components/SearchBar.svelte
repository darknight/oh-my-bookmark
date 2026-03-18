<script lang="ts">
	import { goto } from '$app/navigation';

	let query = $state('');

	function handleSubmit(e: Event) {
		e.preventDefault();
		const trimmed = query.trim();
		if (trimmed) {
			goto(`/search?q=${encodeURIComponent(trimmed)}`);
		}
	}
</script>

<form onsubmit={handleSubmit} class="relative">
	<svg
		class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<circle cx="11" cy="11" r="8" />
		<path d="m21 21-4.3-4.3" />
	</svg>
	<input
		type="text"
		bind:value={query}
		placeholder="Search bookmarks..."
		class="w-full rounded-md border border-input bg-background py-2 pl-10 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
	/>
</form>
