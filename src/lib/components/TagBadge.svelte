<script lang="ts">
	interface Props {
		name: string;
		count?: number;
	}

	let { name, count }: Props = $props();
</script>

<a
	href="/tag/{encodeURIComponent(name)}"
	class="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground transition-colors hover:bg-accent"
>
	{name}
	{#if count !== undefined}
		<span class="text-muted-foreground">({count})</span>
	{/if}
</a>
