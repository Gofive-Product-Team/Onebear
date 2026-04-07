import { useState, useCallback, useRef } from 'react'
import { cn } from '@one-bear/ui'
import {
	useIntegrations,
	useShortcuts,
	useAddShortcut,
	useDeleteShortcut,
	useUpdateShortcut,
	useUpdateCategory,
	useDeleteCategory,
	type ShortcutCategory,
	type Shortcut,
} from '@/api/useIntegrations'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'

function ShortcutForm({
	categoryId,
	initial,
	onSave,
	onCancel,
}: {
	categoryId: string
	initial?: Shortcut | null
	onSave: (data: { keyword: string; content: string; categoryId: string }) => void
	onCancel: () => void
}) {
	const [keyword, setKeyword] = useState(initial?.keyword ?? '')
	const [content, setContent] = useState(initial?.content ?? '')

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (!keyword.trim() || !content.trim()) return
		onSave({ keyword: keyword.trim(), content: content.trim(), categoryId })
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-3 rounded-md border border-blue-200 bg-blue-50/30 p-3">
			<Input
				label="Shortcut Keyword"
				placeholder="/greeting"
				value={keyword}
				onChange={(e) => setKeyword(e.target.value)}
				required
			/>
			<Textarea
				label="Content"
				placeholder="Shortcut message content..."
				value={content}
				onChange={(e) => setContent(e.target.value)}
				required
			/>
			<div className="flex justify-end gap-2">
				<Button type="button" variant="outline" size="sm" onClick={onCancel}>
					Cancel
				</Button>
				<Button type="submit" size="sm">
					{initial ? 'Update' : 'Add'}
				</Button>
			</div>
		</form>
	)
}

function CategorySection({
	category,
	integrationId,
	searchQuery,
}: {
	category: ShortcutCategory
	integrationId: string
	searchQuery: string
}) {
	const [isAdding, setIsAdding] = useState(false)
	const [editingShortcutId, setEditingShortcutId] = useState<string | null>(null)
	const [isRenaming, setIsRenaming] = useState(false)
	const [renameValue, setRenameValue] = useState(category.name)
	const renameInputRef = useRef<HTMLInputElement>(null)

	const addMutation = useAddShortcut(integrationId)
	const deleteMutation = useDeleteShortcut(integrationId)
	const updateShortcutMutation = useUpdateShortcut(integrationId)
	const updateCategoryMutation = useUpdateCategory(integrationId)
	const deleteCategoryMutation = useDeleteCategory(integrationId)

	const filteredShortcuts = searchQuery
		? category.shortcuts.filter(
				(s) =>
					s.keyword.toLowerCase().includes(searchQuery.toLowerCase()) ||
					s.content.toLowerCase().includes(searchQuery.toLowerCase()),
			)
		: category.shortcuts

	const handleAdd = useCallback(
		(data: { keyword: string; content: string; categoryId: string }) => {
			addMutation.mutate(data, {
				onSuccess: () => setIsAdding(false),
			})
		},
		[addMutation],
	)

	const handleUpdateShortcut = useCallback(
		(shortcutId: string, data: { keyword: string; content: string; categoryId: string }) => {
			updateShortcutMutation.mutate(
				{ shortcutId, body: data },
				{ onSuccess: () => setEditingShortcutId(null) },
			)
		},
		[updateShortcutMutation],
	)

	function startRename() {
		setRenameValue(category.name)
		setIsRenaming(true)
		setTimeout(() => renameInputRef.current?.focus(), 0)
	}

	function commitRename() {
		const trimmed = renameValue.trim()
		if (!trimmed || trimmed === category.name) {
			setIsRenaming(false)
			return
		}
		updateCategoryMutation.mutate(
			{ categoryId: category.id, body: { name: trimmed } },
			{ onSuccess: () => setIsRenaming(false) },
		)
	}

	function handleRenameKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		if (e.key === 'Enter') {
			e.preventDefault()
			commitRename()
		} else if (e.key === 'Escape') {
			setIsRenaming(false)
		}
	}

	function handleDeleteCategory() {
		if (!window.confirm(`Delete category "${category.name}" and all its shortcuts?`)) return
		deleteCategoryMutation.mutate(category.id)
	}

	if (searchQuery && filteredShortcuts.length === 0) return null

	return (
		<div className="rounded-lg border border-gray-200 bg-white">
			<div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
				{isRenaming ? (
					<input
						ref={renameInputRef}
						className="flex-1 rounded border border-blue-300 px-2 py-0.5 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
						value={renameValue}
						onChange={(e) => setRenameValue(e.target.value)}
						onBlur={commitRename}
						onKeyDown={handleRenameKeyDown}
					/>
				) : (
					<h3
						className="cursor-pointer text-sm font-semibold text-gray-900 hover:text-blue-700"
						onDoubleClick={startRename}
						title="Double-click to rename"
					>
						{category.name}
					</h3>
				)}
				<div className="flex items-center gap-2">
					<span className="text-xs text-gray-400">
						{filteredShortcuts.length} shortcut{filteredShortcuts.length !== 1 ? 's' : ''}
					</span>
					<button
						type="button"
						onClick={handleDeleteCategory}
						disabled={deleteCategoryMutation.isPending}
						className="rounded p-0.5 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
						title="Delete category"
					>
						<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
			</div>

			<div className="divide-y divide-gray-50 p-2">
				{filteredShortcuts.map((shortcut) => (
					<div key={shortcut.id}>
						{editingShortcutId === shortcut.id ? (
							<div className="px-2 py-2">
								<ShortcutForm
									categoryId={category.id}
									initial={shortcut}
									onSave={(data) => handleUpdateShortcut(shortcut.id, data)}
									onCancel={() => setEditingShortcutId(null)}
								/>
							</div>
						) : (
							<div
								className="flex items-start justify-between gap-3 rounded-md px-3 py-2 hover:bg-gray-50"
							>
								<div
									className="min-w-0 flex-1 cursor-pointer"
									onClick={() => setEditingShortcutId(shortcut.id)}
									title="Click to edit"
								>
									<code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-blue-700">
										{shortcut.keyword}
									</code>
									<p className="mt-1 text-sm text-gray-600">{shortcut.content}</p>
								</div>
								<button
									type="button"
									onClick={() => deleteMutation.mutate(shortcut.id)}
									className="shrink-0 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
								>
									<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
									</svg>
								</button>
							</div>
						)}
					</div>
				))}

				{isAdding && (
					<div className="px-2 py-2">
						<ShortcutForm
							categoryId={category.id}
							onSave={handleAdd}
							onCancel={() => setIsAdding(false)}
						/>
					</div>
				)}

				{!isAdding && (
					<div className="px-2 pt-2">
						<button
							type="button"
							onClick={() => setIsAdding(true)}
							className="w-full rounded-md border border-dashed border-gray-300 py-2 text-xs font-medium text-gray-500 transition-colors hover:border-gray-400 hover:text-gray-700"
						>
							+ Add Shortcut
						</button>
					</div>
				)}
			</div>
		</div>
	)
}

export function ShortcutManager() {
	const { data: integrations, isLoading: loadingIntegrations } = useIntegrations()
	const [selectedIntegrationId, setSelectedIntegrationId] = useState('')
	const { data: categories, isLoading: loadingShortcuts } = useShortcuts(selectedIntegrationId)
	const addMutation = useAddShortcut(selectedIntegrationId)

	const [search, setSearch] = useState('')
	const [showAddCategory, setShowAddCategory] = useState(false)
	const [newCategoryName, setNewCategoryName] = useState('')

	function handleAddCategory(e: React.FormEvent) {
		e.preventDefault()
		if (!newCategoryName.trim()) return

		// Adding a category is done via addShortcut with a special payload
		addMutation.mutate(
			{ categoryName: newCategoryName.trim(), keyword: '', content: '', isNewCategory: true },
			{
				onSuccess: () => {
					setShowAddCategory(false)
					setNewCategoryName('')
				},
			},
		)
	}

	return (
		<div className="space-y-4">
			<div>
				<h2 className="text-lg font-semibold text-gray-900">Shortcuts</h2>
				<p className="text-sm text-gray-500">
					Quick-access message templates organized by category
				</p>
			</div>

			{/* Integration selector */}
			<div className="flex flex-col gap-1.5">
				<label className="text-sm font-medium text-gray-700">Select Integration</label>
				<select
					value={selectedIntegrationId}
					onChange={(e) => setSelectedIntegrationId(e.target.value)}
					className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
					disabled={loadingIntegrations}
				>
					<option value="">Choose an integration...</option>
					{integrations?.map((int) => (
						<option key={int.id} value={int.id}>
							{int.name} ({int.platform})
						</option>
					))}
				</select>
			</div>

			{!selectedIntegrationId && (
				<div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
					Select an integration above to manage shortcuts
				</div>
			)}

			{selectedIntegrationId && loadingShortcuts && (
				<div className="flex h-32 items-center justify-center">
					<div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
				</div>
			)}

			{selectedIntegrationId && !loadingShortcuts && (
				<>
					{/* Search + actions */}
					<div className="flex gap-2">
						<div className="flex-1">
							<Input
								placeholder="Search shortcuts..."
								value={search}
								onChange={(e) => setSearch(e.target.value)}
							/>
						</div>
						<Button variant="outline" onClick={() => setShowAddCategory(true)}>
							+ Category
						</Button>
					</div>

					{/* Add category form */}
					{showAddCategory && (
						<form
							onSubmit={handleAddCategory}
							className="flex items-end gap-2 rounded-lg border border-blue-200 bg-blue-50/30 p-3"
						>
							<div className="flex-1">
								<Input
									label="Category Name"
									placeholder="e.g., Greetings"
									value={newCategoryName}
									onChange={(e) => setNewCategoryName(e.target.value)}
									required
								/>
							</div>
							<Button type="button" variant="outline" size="sm" onClick={() => setShowAddCategory(false)}>
								Cancel
							</Button>
							<Button type="submit" size="sm" loading={addMutation.isPending}>
								Add
							</Button>
						</form>
					)}

					{/* Categories */}
					<div className="space-y-4">
						{categories?.map((category) => (
							<CategorySection
								key={category.id}
								category={category}
								integrationId={selectedIntegrationId}
								searchQuery={search}
							/>
						))}

						{(!categories || categories.length === 0) && (
							<div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
								No shortcut categories yet. Create one to get started.
							</div>
						)}
					</div>
				</>
			)}
		</div>
	)
}
