import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { useSetPinnedNote, useRemovePinnedNote } from '@/api/useCustomers'

interface Props {
	customerId: string
	currentNote: string | null
	onClose: () => void
}

export function PinnedNoteEditor({ customerId, currentNote, onClose }: Props) {
	const [note, setNote] = useState(currentNote ?? '')
	const [confirmRemove, setConfirmRemove] = useState(false)

	const setPinnedNote = useSetPinnedNote()
	const removePinnedNote = useRemovePinnedNote()

	const isReplacing = !!currentNote && note !== currentNote && note.trim().length > 0

	async function handleSave() {
		if (!note.trim()) return
		await setPinnedNote.mutateAsync({ id: customerId, note: note.trim() })
		onClose()
	}

	async function handleRemove() {
		await removePinnedNote.mutateAsync(customerId)
		onClose()
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<h4 className="text-sm font-semibold text-t1">Pinned Note</h4>
				<button
					type="button"
					onClick={onClose}
					className="rounded p-1 text-t3 hover:text-t2"
					aria-label="Close note editor"
				>
					<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
						<path d="M18 6 6 18" />
						<path d="m6 6 12 12" />
					</svg>
				</button>
			</div>

			{/* Replace warning */}
			{isReplacing && (
				<div className="rounded-md border border-warning bg-warning-bg px-3 py-2 text-xs text-warning">
					This will replace the existing pinned note.
				</div>
			)}

			<textarea
				value={note}
				onChange={(e) => setNote(e.target.value)}
				placeholder="Write a note about this customer..."
				rows={5}
				className="w-full rounded-md border border-border-input bg-bg-input px-3 py-2 text-sm text-t1 placeholder:text-t3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary resize-none"
				aria-label="Pinned note"
			/>

			{/* Remove confirmation */}
			{confirmRemove ? (
				<div className="flex flex-col gap-2 rounded-md border border-error bg-error-bg p-3">
					<p className="text-xs text-error">Are you sure you want to remove this note?</p>
					<div className="flex gap-2">
						<Button
							type="button"
							variant="destructive"
							size="sm"
							onClick={handleRemove}
							loading={removePinnedNote.isPending}
						>
							Remove
						</Button>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => setConfirmRemove(false)}
						>
							Cancel
						</Button>
					</div>
				</div>
			) : null}

			<div className="flex gap-2">
				{currentNote && !confirmRemove && (
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => setConfirmRemove(true)}
						className="text-error hover:text-error"
					>
						Remove Note
					</Button>
				)}
				<Button
					type="button"
					size="sm"
					className="ml-auto"
					onClick={handleSave}
					disabled={!note.trim()}
					loading={setPinnedNote.isPending}
				>
					Save Note
				</Button>
			</div>

			{setPinnedNote.isError && (
				<p className="text-xs text-error">Failed to save note. Please try again.</p>
			)}
		</div>
	)
}
