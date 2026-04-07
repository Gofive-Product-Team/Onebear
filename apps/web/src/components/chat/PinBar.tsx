import { useState } from 'react'
import { cn } from '@one-bear/ui'
import { Pin } from 'lucide-react'
import type { ChatMessage } from '@one-bear/shared-types'

interface Props {
	pinnedMessages: ChatMessage[]
	onScrollToMessage: (messageId: string) => void
}

function truncate(text: string | null, max = 80): string {
	if (!text) return 'Attachment'
	return text.length > max ? text.slice(0, max) + '…' : text
}

export function PinBar({ pinnedMessages, onScrollToMessage }: Props) {
	const [expanded, setExpanded] = useState(false)

	if (pinnedMessages.length === 0) return null

	// Show latest pinned message (highest pinnedTimestamp or last in list)
	const sorted = [...pinnedMessages].sort((a, b) => (b.pinnedTimestamp ?? 0) - (a.pinnedTimestamp ?? 0))
	const latest = sorted[0]!

	const handleClick = () => {
		if (pinnedMessages.length === 1) {
			onScrollToMessage(latest.id)
		} else {
			setExpanded((v) => !v)
		}
	}

	return (
		<div className="shrink-0 border-b border-border bg-amber-50">
			{/* Single-line bar — always visible */}
			<button
				type="button"
				onClick={handleClick}
				className="flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-amber-100 transition-colors"
				aria-label={pinnedMessages.length === 1 ? 'Jump to pinned message' : 'Toggle pinned messages list'}
			>
				<Pin className="h-4 w-4 shrink-0 text-amber-700" aria-hidden />
				<span className="flex-1 min-w-0 text-xs text-amber-900 truncate">
					{pinnedMessages.length === 1
						? truncate(latest.content)
						: `${pinnedMessages.length} pinned messages`}
				</span>
				{pinnedMessages.length > 1 && (
					<svg
						className={cn('h-3.5 w-3.5 shrink-0 text-amber-700 transition-transform', expanded && 'rotate-180')}
						viewBox="0 0 16 16"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
					>
						<path d="M4 6l4 4 4-4" />
					</svg>
				)}
			</button>

			{/* Expanded list */}
			{expanded && pinnedMessages.length > 1 && (
				<ul className="border-t border-amber-200 max-h-48 overflow-y-auto divide-y divide-amber-100">
					{sorted.map((msg) => (
						<li key={msg.id}>
							<button
								type="button"
								onClick={() => {
									setExpanded(false)
									onScrollToMessage(msg.id)
								}}
								className="flex w-full items-start gap-2 px-4 py-2 text-left hover:bg-amber-100 transition-colors"
							>
								<Pin className="h-3.5 w-3.5 shrink-0 text-amber-500 mt-0.5" aria-hidden />
								<span className="flex-1 min-w-0 text-xs text-amber-900 break-words line-clamp-2">
									{truncate(msg.content, 120)}
								</span>
							</button>
						</li>
					))}
				</ul>
			)}
		</div>
	)
}
