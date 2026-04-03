import { useState } from 'react'
import { useAddTag, useRemoveTag } from '@/api/useCustomers'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export function TagManager({ customerId, tags }: { customerId: string; tags: string[] }) {
	const [isAdding, setIsAdding] = useState(false)
	const [newTag, setNewTag] = useState('')

	const addTagMutation = useAddTag()
	const removeTagMutation = useRemoveTag()

	function handleAdd() {
		const trimmed = newTag.trim()
		if (!trimmed) return
		addTagMutation.mutate(
			{ customerId, tag: trimmed },
			{
				onSuccess: () => {
					setNewTag('')
					setIsAdding(false)
				},
			},
		)
	}

	function handleRemove(tag: string) {
		removeTagMutation.mutate({ customerId, tag })
	}

	function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		if (e.key === 'Enter') {
			e.preventDefault()
			handleAdd()
		} else if (e.key === 'Escape') {
			setIsAdding(false)
			setNewTag('')
		}
	}

	return (
		<div className="flex flex-wrap items-center gap-2">
			{tags.map((tag) => (
				<span key={tag} className="inline-flex items-center gap-1">
					<Badge variant="secondary">{tag}</Badge>
					<button
						type="button"
						onClick={() => handleRemove(tag)}
						disabled={removeTagMutation.isPending}
						className="flex h-4 w-4 items-center justify-center rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 disabled:opacity-50"
						aria-label={`Remove tag ${tag}`}
					>
						<svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</span>
			))}

			{isAdding ? (
				<div className="flex items-center gap-1.5">
					<Input
						className="h-7 w-28 py-0 text-xs"
						placeholder="Tag name"
						value={newTag}
						onChange={(e) => setNewTag(e.target.value)}
						onKeyDown={handleKeyDown}
						autoFocus
					/>
					<Button size="sm" className="h-7 px-2 text-xs" loading={addTagMutation.isPending} onClick={handleAdd}>
						Add
					</Button>
					<Button
						size="sm"
						variant="outline"
						className="h-7 px-2 text-xs"
						onClick={() => {
							setIsAdding(false)
							setNewTag('')
						}}
					>
						Cancel
					</Button>
				</div>
			) : (
				<button
					type="button"
					onClick={() => setIsAdding(true)}
					className="inline-flex items-center gap-1 rounded-full border border-dashed border-gray-300 px-2 py-0.5 text-xs text-gray-500 transition-colors hover:border-gray-400 hover:text-gray-700"
				>
					<svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
					</svg>
					Add tag
				</button>
			)}
		</div>
	)
}
