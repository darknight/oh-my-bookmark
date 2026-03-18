<script lang="ts">
	import BookmarkList from '$lib/components/BookmarkList.svelte';
	import BookmarkForm from '$lib/components/BookmarkForm.svelte';
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();
	let showForm = $state(false);
	let editingBookmark = $state<any>(null);

	async function handleSave(formData: Record<string, unknown>) {
		const url = editingBookmark
			? `/api/bookmarks/${editingBookmark.id}`
			: '/api/bookmarks';
		const method = editingBookmark ? 'PUT' : 'POST';

		const res = await fetch(url, {
			method,
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(formData)
		});

		if (res.ok) {
			showForm = false;
			editingBookmark = null;
			await invalidateAll();
		}
	}

	function handleCancel() {
		showForm = false;
		editingBookmark = null;
	}

	async function handleDelete(id: number) {
		if (!confirm('确定要删除这个书签吗？')) return;
		const res = await fetch(`/api/bookmarks/${id}`, { method: 'DELETE' });
		if (res.ok) {
			await invalidateAll();
		}
	}

	async function handleEdit(id: number) {
		const res = await fetch(`/api/bookmarks/${id}`);
		if (res.ok) {
			editingBookmark = await res.json();
			showForm = true;
		}
	}
</script>

<svelte:head>
	<title>All Bookmarks - Oh My Bookmark</title>
</svelte:head>

<div class="mb-6 flex items-center justify-between">
	<h1 class="text-2xl font-bold text-foreground">All Bookmarks</h1>
	<button
		type="button"
		onclick={() => { editingBookmark = null; showForm = !showForm; }}
		class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
	>
		{showForm ? '取消' : '+ 新增书签'}
	</button>
</div>

{#if showForm}
	<div class="mb-6 rounded-lg border border-border bg-card p-6">
		<h2 class="mb-4 text-lg font-semibold">{editingBookmark ? '编辑书签' : '新增书签'}</h2>
		<BookmarkForm
			bookmark={editingBookmark}
			folders={data.folderTree}
			onSave={handleSave}
			onCancel={handleCancel}
		/>
	</div>
{/if}

<BookmarkList
	result={data.bookmarks}
	baseUrl="/"
	onEdit={handleEdit}
	onDelete={handleDelete}
/>
