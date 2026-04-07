import { useState, useCallback } from 'react'
import { cn } from '@one-bear/ui'
import { useIntegrations, useGreetings, useUpdateGreetings, type GreetingMessage } from '@/api/useIntegrations'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'

function GreetingItem({
	greeting,
	onToggle,
	onEdit,
	onDelete,
}: {
	greeting: GreetingMessage
	onToggle: () => void
	onEdit: () => void
	onDelete: () => void
}) {
	return (
		<div
			className={cn(
				'rounded-lg border bg-white p-4 transition-colors',
				greeting.enabled ? 'border-gray-200' : 'border-gray-200 opacity-60',
			)}
		>
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0 flex-1">
					<div className="mb-1 flex items-center gap-2">
						<span
							className={cn(
								'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
								greeting.type === 'text'
									? 'bg-blue-100 text-blue-700'
									: 'bg-purple-100 text-purple-700',
							)}
						>
							{greeting.type}
						</span>
						{!greeting.enabled && (
							<span className="text-xs text-gray-400">Disabled</span>
						)}
					</div>
					<p className="text-sm text-gray-700">
						{greeting.type === 'image' ? (
							<span className="italic text-gray-500">{greeting.content}</span>
						) : (
							greeting.content
						)}
					</p>
				</div>
				<div className="flex items-center gap-1">
					<button
						type="button"
						onClick={onToggle}
						className={cn(
							'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors',
							greeting.enabled ? 'bg-blue-600' : 'bg-gray-300',
						)}
					>
						<span
							className={cn(
								'inline-block h-4 w-4 translate-y-0.5 rounded-full bg-white shadow-sm transition-transform',
								greeting.enabled ? 'translate-x-4' : 'translate-x-0.5',
							)}
						/>
					</button>
					<button
						type="button"
						onClick={onEdit}
						className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
					>
						<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
						</svg>
					</button>
					<button
						type="button"
						onClick={onDelete}
						className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
					>
						<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
						</svg>
					</button>
				</div>
			</div>
		</div>
	)
}

function GreetingForm({
	initial,
	onSave,
	onCancel,
}: {
	initial?: GreetingMessage | null
	onSave: (data: { type: 'text' | 'image'; content: string; enabled: boolean }) => void
	onCancel: () => void
}) {
	const [type, setType] = useState<'text' | 'image'>(initial?.type ?? 'text')
	const [content, setContent] = useState(initial?.content ?? '')
	const [enabled, setEnabled] = useState(initial?.enabled ?? true)

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (!content.trim()) return
		onSave({ type, content: content.trim(), enabled })
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-blue-200 bg-blue-50/30 p-4">
			<div className="flex gap-2">
				<button
					type="button"
					onClick={() => setType('text')}
					className={cn(
						'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
						type === 'text' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50',
					)}
				>
					Text
				</button>
				<button
					type="button"
					onClick={() => setType('image')}
					className={cn(
						'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
						type === 'image' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50',
					)}
				>
					Image URL
				</button>
			</div>

			{type === 'text' ? (
				<Textarea
					label="Message"
					placeholder="Enter greeting message..."
					value={content}
					onChange={(e) => setContent(e.target.value)}
					required
				/>
			) : (
				<Input
					label="Image URL"
					placeholder="https://example.com/image.jpg"
					value={content}
					onChange={(e) => setContent(e.target.value)}
					required
				/>
			)}

			<div className="flex items-center gap-2">
				<button
					type="button"
					onClick={() => setEnabled(!enabled)}
					className={cn(
						'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors',
						enabled ? 'bg-blue-600' : 'bg-gray-300',
					)}
				>
					<span
						className={cn(
							'inline-block h-4 w-4 translate-y-0.5 rounded-full bg-white shadow-sm transition-transform',
							enabled ? 'translate-x-4' : 'translate-x-0.5',
						)}
					/>
				</button>
				<span className="text-sm text-gray-600">Enabled</span>
			</div>

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

export function GreetingEditor() {
	const { data: integrations, isLoading: loadingIntegrations } = useIntegrations()
	const [selectedIntegrationId, setSelectedIntegrationId] = useState('')
	const { data: greetings, isLoading: loadingGreetings } = useGreetings(selectedIntegrationId)
	const updateMutation = useUpdateGreetings(selectedIntegrationId)

	const [editingIndex, setEditingIndex] = useState<number | null>(null)
	const [isAdding, setIsAdding] = useState(false)

	const handleSave = useCallback(
		(data: { type: 'text' | 'image'; content: string; enabled: boolean }) => {
			if (!greetings) return

			let updated: GreetingMessage[]
			if (editingIndex !== null) {
				updated = greetings.map((g, i) =>
					i === editingIndex ? { ...g, ...data } : g,
				)
			} else {
				updated = [
					...greetings,
					{ id: crypto.randomUUID(), ...data },
				]
			}

			updateMutation.mutate(
				{ greetings: updated },
				{
					onSuccess: () => {
						setEditingIndex(null)
						setIsAdding(false)
					},
				},
			)
		},
		[greetings, editingIndex, updateMutation],
	)

	const handleToggle = useCallback(
		(index: number) => {
			if (!greetings) return
			const updated = greetings.map((g, i) =>
				i === index ? { ...g, enabled: !g.enabled } : g,
			)
			updateMutation.mutate({ greetings: updated })
		},
		[greetings, updateMutation],
	)

	const handleDelete = useCallback(
		(index: number) => {
			if (!greetings) return
			const updated = greetings.filter((_, i) => i !== index)
			updateMutation.mutate({ greetings: updated })
		},
		[greetings, updateMutation],
	)

	return (
		<div className="space-y-4">
			<div>
				<h2 className="text-lg font-semibold text-gray-900">Greeting Messages</h2>
				<p className="text-sm text-gray-500">
					Configure welcome messages sent when a new conversation starts
				</p>
			</div>

			{/* Integration selector */}
			<div className="flex flex-col gap-1.5">
				<label className="text-sm font-medium text-gray-700">Select Integration</label>
				<select
					value={selectedIntegrationId}
					onChange={(e) => {
						setSelectedIntegrationId(e.target.value)
						setEditingIndex(null)
						setIsAdding(false)
					}}
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
					Select an integration above to manage greeting messages
				</div>
			)}

			{selectedIntegrationId && loadingGreetings && (
				<div className="flex h-32 items-center justify-center">
					<div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
				</div>
			)}

			{selectedIntegrationId && !loadingGreetings && (
				<div className="space-y-3">
					{greetings?.map((greeting, index) =>
						editingIndex === index ? (
							<GreetingForm
								key={greeting.id}
								initial={greeting}
								onSave={handleSave}
								onCancel={() => setEditingIndex(null)}
							/>
						) : (
							<GreetingItem
								key={greeting.id}
								greeting={greeting}
								onToggle={() => handleToggle(index)}
								onEdit={() => {
									setEditingIndex(index)
									setIsAdding(false)
								}}
								onDelete={() => handleDelete(index)}
							/>
						),
					)}

					{isAdding && (
						<GreetingForm
							onSave={handleSave}
							onCancel={() => setIsAdding(false)}
						/>
					)}

					{!isAdding && editingIndex === null && (
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsAdding(true)}
						>
							+ Add Greeting
						</Button>
					)}
				</div>
			)}
		</div>
	)
}
