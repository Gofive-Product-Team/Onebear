import { useState, useCallback, useRef } from 'react'
import { cn } from '@one-bear/ui'
import {
	useFaqEntries,
	useAddFaq,
	useUpdateFaq,
	useDeleteFaq,
	useImportFaqCsv,
	useKnowledgeSources,
	useAddKnowledgeSource,
	useDeleteKnowledgeSource,
	useUnansweredQuestions,
	useAddInsightToFaq,
	useDismissInsight,
	type FaqEntry,
	type KnowledgeSource,
	type UnansweredQuestion,
} from '@/api/useChatbot'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Tabs, TabList, Tab, TabPanel } from '@/components/ui/Tabs'
import { formatDate } from '@/lib/date'

// --- FAQ Tab ---

function FaqTab() {
	const { data: entries, isLoading } = useFaqEntries()
	const addMutation = useAddFaq()
	const updateMutation = useUpdateFaq()
	const deleteMutation = useDeleteFaq()
	const importMutation = useImportFaqCsv()
	const fileInputRef = useRef<HTMLInputElement>(null)

	const [showAddForm, setShowAddForm] = useState(false)
	const [newQuestion, setNewQuestion] = useState('')
	const [newAnswer, setNewAnswer] = useState('')
	const [editingId, setEditingId] = useState<string | null>(null)
	const [editQuestion, setEditQuestion] = useState('')
	const [editAnswer, setEditAnswer] = useState('')

	const handleAdd = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault()
			if (!newQuestion.trim() || !newAnswer.trim()) return
			addMutation.mutate(
				{ question: newQuestion.trim(), answer: newAnswer.trim() },
				{
					onSuccess: () => {
						setShowAddForm(false)
						setNewQuestion('')
						setNewAnswer('')
					},
				},
			)
		},
		[newQuestion, newAnswer, addMutation],
	)

	const handleUpdate = useCallback(
		(faqId: string) => {
			if (!editQuestion.trim() || !editAnswer.trim()) return
			updateMutation.mutate(
				{ faqId, body: { question: editQuestion.trim(), answer: editAnswer.trim() } },
				{
					onSuccess: () => {
						setEditingId(null)
						setEditQuestion('')
						setEditAnswer('')
					},
				},
			)
		},
		[editQuestion, editAnswer, updateMutation],
	)

	const handleCsvImport = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0]
			if (!file) return
			importMutation.mutate(file)
			// Reset input so same file can be re-selected
			e.target.value = ''
		},
		[importMutation],
	)

	function startEdit(entry: FaqEntry) {
		setEditingId(entry.id)
		setEditQuestion(entry.question)
		setEditAnswer(entry.answer)
	}

	if (isLoading) {
		return (
			<div className="flex h-20 items-center justify-center">
				<div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
			</div>
		)
	}

	return (
		<div className="space-y-4">
			{/* Actions bar */}
			<div className="flex items-center justify-between">
				<p className="text-sm text-t3">
					{entries?.length ?? 0} FAQ {(entries?.length ?? 0) === 1 ? 'entry' : 'entries'}
				</p>
				<div className="flex gap-2">
					<input
						ref={fileInputRef}
						type="file"
						accept=".csv"
						className="hidden"
						onChange={handleCsvImport}
					/>
					<Button
						variant="outline"
						size="sm"
						onClick={() => fileInputRef.current?.click()}
						loading={importMutation.isPending}
					>
						Import CSV
					</Button>
					{!showAddForm && (
						<Button size="sm" onClick={() => setShowAddForm(true)}>
							+ Add FAQ
						</Button>
					)}
				</div>
			</div>

			{/* Add form */}
			{showAddForm && (
				<form
					onSubmit={handleAdd}
					className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-4"
				>
					<Input
						label="Question"
						placeholder="e.g., What are your business hours?"
						value={newQuestion}
						onChange={(e) => setNewQuestion(e.target.value)}
						required
					/>
					<Textarea
						label="Answer"
						placeholder="Enter the answer..."
						value={newAnswer}
						onChange={(e) => setNewAnswer(e.target.value)}
						required
					/>
					<div className="flex justify-end gap-2">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => {
								setShowAddForm(false)
								setNewQuestion('')
								setNewAnswer('')
							}}
						>
							Cancel
						</Button>
						<Button type="submit" size="sm" loading={addMutation.isPending}>
							Save
						</Button>
					</div>
				</form>
			)}

			{/* FAQ entries list */}
			{entries?.map((entry) => (
				<div
					key={entry.id}
					className="rounded-lg border border-gray-200 bg-white p-4"
				>
					{editingId === entry.id ? (
						<div className="space-y-3">
							<Input
								label="Question"
								value={editQuestion}
								onChange={(e) => setEditQuestion(e.target.value)}
								required
							/>
							<Textarea
								label="Answer"
								value={editAnswer}
								onChange={(e) => setEditAnswer(e.target.value)}
								required
							/>
							<div className="flex justify-end gap-2">
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => setEditingId(null)}
								>
									Cancel
								</Button>
								<Button
									size="sm"
									loading={updateMutation.isPending}
									onClick={() => handleUpdate(entry.id)}
								>
									Update
								</Button>
							</div>
						</div>
					) : (
						<div>
							<div className="flex items-start justify-between gap-3">
								<div className="min-w-0 flex-1">
									<div className="flex items-center gap-2">
										<p className="text-sm font-medium text-t1">{entry.question}</p>
										{entry.isDefault && (
											<span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
												Default
											</span>
										)}
									</div>
									<p className="mt-1 text-sm text-t2 line-clamp-2">{entry.answer}</p>
								</div>
								<div className="flex shrink-0 gap-1">
									<button
										type="button"
										onClick={() => startEdit(entry)}
										className="rounded p-1.5 text-t3 hover:bg-bg-hover hover:text-t1"
										aria-label="Edit"
									>
										<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
											<path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
										</svg>
									</button>
									<button
										type="button"
										onClick={() => deleteMutation.mutate(entry.id)}
										className="rounded p-1.5 text-t3 hover:bg-red-50 hover:text-red-600"
										aria-label="Delete"
									>
										<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
											<path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
										</svg>
									</button>
								</div>
							</div>
						</div>
					)}
				</div>
			))}

			{(!entries || entries.length === 0) && !showAddForm && (
				<div className="rounded-lg border border-dashed border-gray-300 py-8 text-center">
					<p className="text-sm text-t3">No FAQ entries yet</p>
					<p className="mt-1 text-xs text-t3">Add questions and answers to help the AI respond to customers</p>
				</div>
			)}
		</div>
	)
}

// --- Knowledge Sources Tab ---

function KnowledgeSourcesTab() {
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
				<div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
			</div>
		)
	}

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<p className="text-sm text-t3">
					{sources?.length ?? 0} knowledge {(sources?.length ?? 0) === 1 ? 'source' : 'sources'}
				</p>
				{!isAdding && (
					<Button variant="outline" size="sm" onClick={() => setIsAdding(true)}>
						+ Add Source
					</Button>
				)}
			</div>

			{sources?.map((source) => (
				<div
					key={source.id}
					className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3"
				>
					<div className="min-w-0 flex-1">
						<div className="flex items-center gap-2">
							<span className="text-sm font-medium text-t1">{source.name}</span>
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
						<p className="mt-0.5 truncate text-xs text-t3">{source.content}</p>
					</div>
					<button
						type="button"
						onClick={() => deleteMutation.mutate(source.id)}
						className="ml-2 shrink-0 rounded p-1.5 text-t3 hover:bg-red-50 hover:text-red-600"
						aria-label="Delete"
					>
						<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
							<path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
						</svg>
					</button>
				</div>
			))}

			{(!sources || sources.length === 0) && !isAdding && (
				<div className="rounded-lg border border-dashed border-gray-300 py-8 text-center">
					<p className="text-sm text-t3">No knowledge sources configured</p>
				</div>
			)}

			{isAdding && (
				<form
					onSubmit={handleAdd}
					className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-4"
				>
					<Input
						label="Source Name"
						placeholder="e.g., Product FAQ"
						value={newName}
						onChange={(e) => setNewName(e.target.value)}
						required
					/>
					<div className="flex flex-col gap-1.5">
						<label className="text-sm font-medium text-t3">Type</label>
						<div className="flex gap-2">
							{(['url', 'file', 'text'] as const).map((t) => (
								<button
									key={t}
									type="button"
									onClick={() => setNewType(t)}
									className={cn(
										'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
										newType === t
											? 'bg-primary text-white'
											: 'bg-white text-t2 hover:bg-bg-hover',
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
								newType === 'url' ? 'https://example.com/faq' : '/path/to/document.pdf'
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

// --- Insights Tab ---

function InsightsTab() {
	const { data: questions, isLoading } = useUnansweredQuestions()
	const addToFaqMutation = useAddInsightToFaq()
	const dismissMutation = useDismissInsight()

	if (isLoading) {
		return (
			<div className="flex h-20 items-center justify-center">
				<div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
			</div>
		)
	}

	const sorted = (Array.isArray(questions) ? [...questions] : []).sort((a, b) => b.frequency - a.frequency)

	return (
		<div className="space-y-3">
			<p className="text-sm text-t3">
				Questions customers asked that the AI could not answer. Add them to FAQ to improve responses.
			</p>

			{sorted.map((q) => (
				<div
					key={q.id}
					className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3"
				>
					<div className="min-w-0 flex-1">
						<div className="flex items-center gap-2">
							<p className="text-sm font-medium text-t1">{q.question}</p>
							<span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
								{q.frequency}x
							</span>
						</div>
					</div>
					<div className="ml-3 flex shrink-0 gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => addToFaqMutation.mutate(q.id)}
							loading={addToFaqMutation.isPending}
						>
							Add to FAQ
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => dismissMutation.mutate(q.id)}
							loading={dismissMutation.isPending}
						>
							Dismiss
						</Button>
					</div>
				</div>
			))}

			{sorted.length === 0 && (
				<div className="rounded-lg border border-dashed border-gray-300 py-8 text-center">
					<p className="text-sm text-t3">No unanswered questions yet</p>
					<p className="mt-1 text-xs text-t3">Questions that the AI cannot answer will appear here</p>
				</div>
			)}
		</div>
	)
}

// --- Main KnowledgeBase Component ---

export function KnowledgeBase() {
	return (
		<div className="rounded-lg border border-gray-200 bg-white p-6">
			<div className="mb-4">
				<h3 className="text-base font-semibold text-t1">Knowledge Base</h3>
				<p className="text-sm text-t3">
					Manage FAQ entries, knowledge sources, and review unanswered questions
				</p>
			</div>

			<Tabs defaultValue="faq">
				<TabList>
					<Tab value="faq">FAQ</Tab>
					<Tab value="sources">Knowledge Sources</Tab>
					<Tab value="insights">Insights</Tab>
				</TabList>

				<TabPanel value="faq">
					<FaqTab />
				</TabPanel>

				<TabPanel value="sources">
					<KnowledgeSourcesTab />
				</TabPanel>

				<TabPanel value="insights">
					<InsightsTab />
				</TabPanel>
			</Tabs>
		</div>
	)
}
