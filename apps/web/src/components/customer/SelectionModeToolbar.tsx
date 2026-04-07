import { cn } from '@one-bear/ui'
import { Button } from '@/components/ui/Button'

interface Props {
	isSelectionMode: boolean
	selectedCount: number
	onToggleSelectionMode: () => void
	onFollowup: () => void
}

export function SelectionModeToolbar({ isSelectionMode, selectedCount, onToggleSelectionMode, onFollowup }: Props) {
	if (!isSelectionMode) {
		return (
			<Button variant="outline" size="sm" onClick={onToggleSelectionMode}>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					className="h-4 w-4"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
					aria-hidden="true"
				>
					<rect x="3" y="3" width="18" height="18" rx="2" />
					<path d="m9 12 2 2 4-4" />
				</svg>
				Select
			</Button>
		)
	}

	return (
		<>
			{/* Desktop toolbar — inline in page header */}
			<div className="hidden items-center gap-2 md:flex">
				<span className="text-sm text-t2">
					{selectedCount > 0 ? `${selectedCount} selected` : 'Select customers'}
				</span>
				{selectedCount > 0 && (
					<Button size="sm" onClick={onFollowup}>
						Follow up with {selectedCount} customer{selectedCount !== 1 ? 's' : ''}
					</Button>
				)}
				<Button variant="outline" size="sm" onClick={onToggleSelectionMode}>
					Cancel
				</Button>
			</div>

			{/* Mobile sticky bottom bar */}
			<div
				className={cn(
					'fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-border bg-bg-card px-4 py-3 shadow-lg md:hidden',
					'animate-in slide-in-from-bottom-2',
				)}
			>
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={onToggleSelectionMode}
						className="rounded-md px-2 py-1.5 text-sm font-medium text-t2 hover:bg-bg-hover"
					>
						Cancel
					</button>
					<span className="text-sm text-t2">
						{selectedCount > 0 ? `${selectedCount} selected` : 'Tap to select'}
					</span>
				</div>
				<Button size="sm" disabled={selectedCount === 0} onClick={onFollowup}>
					Follow up{selectedCount > 0 ? ` (${selectedCount})` : ''}
				</Button>
			</div>
		</>
	)
}
