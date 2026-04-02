import { useState, useEffect, useCallback } from 'react'
import { cn } from '@one-bear/ui'
import {
	useChatbotConfiguration,
	useUpdateChatbot,
	useKnowledgeSources,
	useAddKnowledgeSource,
	useDeleteKnowledgeSource,
	type ChatbotScheduleMode,
	type DaySchedule,
	type KnowledgeSource,
} from '@/api/useChatbot'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { formatDate } from '@/lib/date'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const DEFAULT_SCHEDULE: DaySchedule[] = DAYS.map((day) => ({
	day,
	enabled: day !== 'Saturday' && day !== 'Sunday',
	startTime: '09:00',
	endTime: '18:00',
}))

const SCHEDULE_MODES: Array<{ value: ChatbotScheduleMode; label: string; description: string }> = [
	{ value: 'always', label: 'Always Active', description: 'Chatbot responds at all times' },
	{ value: 'never', label: 'Never', description: 'Chatbot is completely disabled' },
	{ value: 'scheduled', label: 'Scheduled', description: 'Chatbot responds only during set hours' },
	{ value: 'outside-hours', label: 'Outside Business Hours', description: 'Chatbot responds only outside set business hours' },
]

function ScheduleGrid({
	schedule,
	onChange,
}: {
	schedule: DaySchedule[]
	onChange: (schedule: DaySchedule[]) => void
}) {
	function updateDay(index: number, updates: Partial<DaySchedule>) {
		const updated = schedule.map((s, i) => (i === index ? { ...s, ...updates } : s))
		onChange(updated)
	}

	return (
		<div className="space-y-2">
			{schedule.map((day, index) => (
				<div
					key={day.day}
					className={cn(
						'flex items-center gap-3 rounded-md px-3 py-2',
						day.enabled ? 'bg-white' : 'bg-gray-50 opacity-60',
					)}
				>
					<label className="flex w-28 shrink-0 cursor-pointer items-center gap-2">
						<input
							type="checkbox"
							checked={day.enabled}
							onChange={(e) => updateDay(index, { enabled: e.target.checked })}
							className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
						/>
						<span className="text-sm font-medium text-gray-700">{day.day}</span>
					</label>
					<input
						type="time"
						value={day.startTime}
						onChange={(e) => updateDay(index, { startTime: e.target.value })}
						disabled={!day.enabled}
						className="h-8 rounded border border-gray-300 px-2 text-sm disabled:opacity-50"
					/>
					<span className="text-xs text-gray-400">to</span>
					<input
						type="time"
						value={day.endTime}
						onChange={(e) => updateDay(index, { endTime: e.target.value })}
						disabled={!day.enabled}
						className="h-8 rounded border border-gray-300 px-2 text-sm disabled:opacity-50"
					/>
				</div>
			))}
		</div>
	)
}

function KnowledgeSourceList() {
	const { data: sources, isLoading } = useKnowledgeSources()
	const addMutation = useAddKnowledgeSource()
	const deleteMutation = useDeleteKnowledgeSource()

	const [isAdding, setIsAdding] = useState(false)
	const [newName, setNewName] = useState('')
	const [newType, setNewType] = useState<'url' | 'file' | 'text'>('url')
	const [newContent, setNewContent] = useState('')

	const handleAdd = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault()
			if (!newName.trim() || !newContent.trim()) return
			addMutation.mutate(
				{ name: newName.trim(), type: newType, content: newContent.trim() },
				{
					onSuccess: () => {
						setIsAdding(false)
						setNewName('')
						setNewContent('')
					},
				},
			)
		},
		[newName, newType, newContent, addMutation],
	)

	if (isLoading) {
		return (
			<div className="flex h-20 items-center justify-center">
				<div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
			</div>
		)
	}

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<label className="text-sm font-medium text-gray-700">Knowledge Sources</label>
				{!isAdding && (
					<Button variant="outline" size="sm" onClick={() => setIsAdding(true)}>
						+ Add Source
					</Button>
				)}
			</div>

			{sources?.map((source) => (
				<div
					key={source.id}
					className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2"
				>
					<div className="min-w-0 flex-1">
						<div className="flex items-center gap-2">
							<span className="text-sm font-medium text-gray-900">{source.name}</span>
							<span
								className={cn(
									'rounded-full px-1.5 py-0.5 text-[10px] font-medium',
									source.type === 'url'
										? 'bg-blue-100 text-blue-700'
										: source.type === 'file'
											? 'bg-green-100 text-green-700'
											: 'bg-gray-100 text-gray-700',
								)}
							>
								{source.type}
							</span>
						</div>
						<p className="mt-0.5 truncate text-xs text-gray-500">{source.content}</p>
					</div>
					<button
						type="button"
						onClick={() => deleteMutation.mutate(source.id)}
						className="ml-2 shrink-0 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
					>
						<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
						</svg>
					</button>
				</div>
			))}

			{(!sources || sources.length === 0) && !isAdding && (
				<p className="text-sm text-gray-500">No knowledge sources configured</p>
			)}

			{isAdding && (
				<form
					onSubmit={handleAdd}
					className="space-y-3 rounded-md border border-blue-200 bg-blue-50/30 p-3"
				>
					<Input
						label="Source Name"
						placeholder="e.g., Product FAQ"
						value={newName}
						onChange={(e) => setNewName(e.target.value)}
						required
					/>
					<div className="flex flex-col gap-1.5">
						<label className="text-sm font-medium text-gray-700">Type</label>
						<div className="flex gap-2">
							{(['url', 'file', 'text'] as const).map((t) => (
								<button
									key={t}
									type="button"
									onClick={() => setNewType(t)}
									className={cn(
										'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
										newType === t
											? 'bg-blue-600 text-white'
											: 'bg-white text-gray-600 hover:bg-gray-50',
									)}
								>
									{t.charAt(0).toUpperCase() + t.slice(1)}
								</button>
							))}
						</div>
					</div>
					{newType === 'text' ? (
						<Textarea
							label="Content"
							placeholder="Enter knowledge text..."
							value={newContent}
							onChange={(e) => setNewContent(e.target.value)}
							required
						/>
					) : (
						<Input
							label={newType === 'url' ? 'URL' : 'File Path'}
							placeholder={
								newType === 'url'
									? 'https://example.com/faq'
									: '/path/to/document.pdf'
							}
							value={newContent}
							onChange={(e) => setNewContent(e.target.value)}
							required
						/>
					)}
					<div className="flex justify-end gap-2">
						<Button type="button" variant="outline" size="sm" onClick={() => setIsAdding(false)}>
							Cancel
						</Button>
						<Button type="submit" size="sm" loading={addMutation.isPending}>
							Add
						</Button>
					</div>
				</form>
			)}
		</div>
	)
}

export function ChatbotConfig() {
	const { data: config, isLoading } = useChatbotConfiguration()
	const updateMutation = useUpdateChatbot()

	const [enabled, setEnabled] = useState(false)
	const [scheduleMode, setScheduleMode] = useState<ChatbotScheduleMode>('always')
	const [schedule, setSchedule] = useState<DaySchedule[]>(DEFAULT_SCHEDULE)
	const [businessOverview, setBusinessOverview] = useState('')
	const [responseStyle, setResponseStyle] = useState('')
	const [instructions, setInstructions] = useState('')
	const [hasChanges, setHasChanges] = useState(false)

	useEffect(() => {
		if (config) {
			setEnabled(config.enabled)
			setScheduleMode(config.scheduleMode)
			setSchedule(config.schedule.length > 0 ? config.schedule : DEFAULT_SCHEDULE)
			setBusinessOverview(config.businessOverview)
			setResponseStyle(config.responseStyle)
			setInstructions(config.instructions)
			setHasChanges(false)
		}
	}, [config])

	function markChanged() {
		setHasChanges(true)
	}

	function handleSave() {
		updateMutation.mutate(
			{
				enabled,
				scheduleMode,
				schedule,
				businessOverview,
				responseStyle,
				instructions,
			},
			{ onSuccess: () => setHasChanges(false) },
		)
	}

	if (isLoading) {
		return (
			<div className="flex h-48 items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
			</div>
		)
	}

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-lg font-semibold text-gray-900">AI Chatbot</h2>
				<p className="text-sm text-gray-500">
					Configure AI-powered automatic responses for your customers
				</p>
			</div>

			<div className="space-y-6 rounded-lg border border-gray-200 bg-white p-6">
				{/* Enable toggle */}
				<div className="flex items-center justify-between">
					<div>
						<p className="text-sm font-medium text-gray-900">Enable AI Chatbot</p>
						<p className="text-xs text-gray-500">
							Allow AI to respond automatically to customer messages
						</p>
					</div>
					<button
						type="button"
						onClick={() => {
							setEnabled(!enabled)
							markChanged()
						}}
						className={cn(
							'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors',
							enabled ? 'bg-blue-600' : 'bg-gray-300',
						)}
					>
						<span
							className={cn(
								'inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow-sm transition-transform',
								enabled ? 'translate-x-5' : 'translate-x-0.5',
							)}
						/>
					</button>
				</div>

				<div
					className={cn(
						'space-y-6 transition-opacity',
						!enabled && 'pointer-events-none opacity-50',
					)}
				>
					{/* Schedule mode */}
					<div className="space-y-3">
						<label className="text-sm font-medium text-gray-700">Schedule Mode</label>
						<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
							{SCHEDULE_MODES.map((m) => (
								<button
									key={m.value}
									type="button"
									onClick={() => {
										setScheduleMode(m.value)
										markChanged()
									}}
									className={cn(
										'rounded-lg border p-3 text-left transition-colors',
										scheduleMode === m.value
											? 'border-blue-500 bg-blue-50'
											: 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
									)}
								>
									<p className="text-sm font-medium text-gray-900">{m.label}</p>
									<p className="mt-0.5 text-xs text-gray-500">{m.description}</p>
								</button>
							))}
						</div>
					</div>

					{/* Day schedule grid */}
					{(scheduleMode === 'scheduled' || scheduleMode === 'outside-hours') && (
						<div className="space-y-2 rounded-md border border-gray-200 p-3">
							<label className="text-sm font-medium text-gray-700">
								{scheduleMode === 'scheduled'
									? 'Active Hours'
									: 'Business Hours (chatbot active outside these hours)'}
							</label>
							<ScheduleGrid
								schedule={schedule}
								onChange={(s) => {
									setSchedule(s)
									markChanged()
								}}
							/>
						</div>
					)}

					{/* Business overview */}
					<Textarea
						label="Business Overview"
						placeholder="Describe your business so the AI can provide relevant responses..."
						value={businessOverview}
						onChange={(e) => {
							setBusinessOverview(e.target.value)
							markChanged()
						}}
					/>

					{/* Response style */}
					<Textarea
						label="Response Style"
						placeholder="Describe how the AI should communicate (e.g., formal, friendly, concise)..."
						value={responseStyle}
						onChange={(e) => {
							setResponseStyle(e.target.value)
							markChanged()
						}}
					/>

					{/* Instructions */}
					<Textarea
						label="Additional Instructions"
						placeholder="Any specific rules or guidelines for the AI chatbot..."
						value={instructions}
						onChange={(e) => {
							setInstructions(e.target.value)
							markChanged()
						}}
					/>

					{/* Knowledge sources */}
					<KnowledgeSourceList />
				</div>

				{/* Save button */}
				<div className="flex justify-end border-t border-gray-100 pt-4">
					<Button
						onClick={handleSave}
						loading={updateMutation.isPending}
						disabled={!hasChanges}
					>
						Save Changes
					</Button>
				</div>
			</div>
		</div>
	)
}
