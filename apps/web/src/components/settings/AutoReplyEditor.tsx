import { useState, useCallback } from 'react'
import { cn } from '@one-bear/ui'
import { useIntegrations, useAutoReplies, useUpdateAutoReplies, type AutoReplyRule } from '@/api/useIntegrations'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'

function RuleItem({
	rule,
	onToggle,
	onEdit,
	onDelete,
}: {
	rule: AutoReplyRule
	onToggle: () => void
	onEdit: () => void
	onDelete: () => void
}) {
	return (
		<div
			className={cn(
				'rounded-lg border bg-white p-4 transition-colors',
				rule.enabled ? 'border-gray-200' : 'border-gray-200 opacity-60',
			)}
		>
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0 flex-1">
					<div className="mb-2 flex flex-wrap gap-1">
						{(rule.keywords ?? []).map((kw) => (
							<Badge key={kw} variant="outline" className="text-xs">
								{kw}
							</Badge>
						))}
					</div>
					<p className="text-sm text-gray-700">{rule.response}</p>
				</div>
				<div className="flex items-center gap-1">
					<button
						type="button"
						onClick={onToggle}
						className={cn(
							'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors',
							rule.enabled ? 'bg-blue-600' : 'bg-gray-300',
						)}
					>
						<span
							className={cn(
								'inline-block h-4 w-4 translate-y-0.5 rounded-full bg-white shadow-sm transition-transform',
								rule.enabled ? 'translate-x-4' : 'translate-x-0.5',
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

function RuleForm({
	initial,
	onSave,
	onCancel,
}: {
	initial?: AutoReplyRule | null
	onSave: (data: { keywords: string[]; response: string; enabled: boolean }) => void
	onCancel: () => void
}) {
	const [keywordsText, setKeywordsText] = useState((initial?.keywords ?? []).join(', '))
	const [response, setResponse] = useState(initial?.response ?? '')
	const [enabled, setEnabled] = useState(initial?.enabled ?? true)

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		const keywords = keywordsText
			.split(',')
			.map((k) => k.trim())
			.filter(Boolean)
		if (keywords.length === 0 || !response.trim()) return
		onSave({ keywords, response: response.trim(), enabled })
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-blue-200 bg-blue-50/30 p-4">
			<Input
				label="Trigger Keywords (comma-separated)"
				placeholder="hello, hi, hey"
				value={keywordsText}
				onChange={(e) => setKeywordsText(e.target.value)}
				required
			/>

			<Textarea
				label="Response"
				placeholder="Auto-reply message content..."
				value={response}
				onChange={(e) => setResponse(e.target.value)}
				required
			/>

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

export function AutoReplyEditor() {
	const { data: integrations, isLoading: loadingIntegrations } = useIntegrations()
	const [selectedIntegrationId, setSelectedIntegrationId] = useState('')
	const { data: rules, isLoading: loadingRules } = useAutoReplies(selectedIntegrationId)
	const updateMutation = useUpdateAutoReplies(selectedIntegrationId)

	const [editingIndex, setEditingIndex] = useState<number | null>(null)
	const [isAdding, setIsAdding] = useState(false)

	const handleSave = useCallback(
		(data: { keywords: string[]; response: string; enabled: boolean }) => {
			if (!rules) return

			let updated: AutoReplyRule[]
			if (editingIndex !== null) {
				updated = rules.map((r, i) =>
					i === editingIndex ? { ...r, ...data } : r,
				)
			} else {
				updated = [
					...rules,
					{ id: crypto.randomUUID(), ...data },
				]
			}

			updateMutation.mutate(
				{ rules: updated },
				{
					onSuccess: () => {
						setEditingIndex(null)
						setIsAdding(false)
					},
				},
			)
		},
		[rules, editingIndex, updateMutation],
	)

	const handleToggle = useCallback(
		(index: number) => {
			if (!rules) return
			const updated = rules.map((r, i) =>
				i === index ? { ...r, enabled: !r.enabled } : r,
			)
			updateMutation.mutate({ rules: updated })
		},
		[rules, updateMutation],
	)

	const handleDelete = useCallback(
		(index: number) => {
			if (!rules) return
			const updated = rules.filter((_, i) => i !== index)
			updateMutation.mutate({ rules: updated })
		},
		[rules, updateMutation],
	)

	return (
		<div className="space-y-4">
			<div>
				<h2 className="text-lg font-semibold text-gray-900">Auto Reply Rules</h2>
				<p className="text-sm text-gray-500">
					Configure automatic responses triggered by specific keywords
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
					Select an integration above to manage auto-reply rules
				</div>
			)}

			{selectedIntegrationId && loadingRules && (
				<div className="flex h-32 items-center justify-center">
					<div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
				</div>
			)}

			{selectedIntegrationId && !loadingRules && (
				<div className="space-y-3">
					{rules?.map((rule, index) =>
						editingIndex === index ? (
							<RuleForm
								key={rule.id}
								initial={rule}
								onSave={handleSave}
								onCancel={() => setEditingIndex(null)}
							/>
						) : (
							<RuleItem
								key={rule.id}
								rule={rule}
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
						<RuleForm
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
							+ Add Rule
						</Button>
					)}
				</div>
			)}
		</div>
	)
}
