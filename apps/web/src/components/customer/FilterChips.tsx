import { useCallback, useRef } from 'react'
import { cn } from '@one-bear/ui'
import type { SegmentCounts } from '@/api/useCustomers'

interface Segment {
	key: string
	label: string
	emoji: string
	color: string
	count: (counts: SegmentCounts) => number
}

const SEGMENTS: Segment[] = [
	{ key: 'All', label: 'All', emoji: '', color: 'bg-blue-500', count: (c) => c.all },
	{ key: 'Hot', label: 'Hot', emoji: '\u{1F534}', color: 'bg-red-500', count: (c) => c.hot },
	{ key: 'At-risk', label: 'At-risk', emoji: '\u{1F7E1}', color: 'bg-orange-500', count: (c) => c.atRisk },
	{ key: 'New', label: 'New', emoji: '\u{1F195}', color: 'bg-blue-400', count: (c) => c.new },
	{ key: 'VIP', label: 'VIP', emoji: '\u2B50', color: 'bg-purple-500', count: (c) => c.vip },
	{ key: 'Cold', label: 'Cold', emoji: '\u{1F535}', color: 'bg-gray-400', count: (c) => c.cold },
	{ key: 'Organization', label: 'Org', emoji: '\u{1F3E2}', color: 'bg-violet-500', count: (c) => c.organization },
]

interface Props {
	counts: SegmentCounts
	selected: string
	onSelect: (segment: string) => void
}

export function FilterChips({ counts, selected, onSelect }: Props) {
	const containerRef = useRef<HTMLDivElement>(null)

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			const currentIndex = SEGMENTS.findIndex((s) => s.key === selected)
			if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
				e.preventDefault()
				const next = (currentIndex + 1) % SEGMENTS.length
				onSelect(SEGMENTS[next].key)
				const buttons = containerRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
				buttons?.[next]?.focus()
			} else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
				e.preventDefault()
				const prev = (currentIndex - 1 + SEGMENTS.length) % SEGMENTS.length
				onSelect(SEGMENTS[prev].key)
				const buttons = containerRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
				buttons?.[prev]?.focus()
			}
		},
		[selected, onSelect],
	)

	return (
		<div
			ref={containerRef}
			className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide"
			style={{ scrollbarWidth: 'none' }}
			role="tablist"
			aria-label="Customer segments"
			onKeyDown={handleKeyDown}
		>
			{SEGMENTS.map((seg) => {
				const isSelected = selected === seg.key
				const count = seg.count(counts)
				return (
					<button
						key={seg.key}
						type="button"
						role="tab"
						aria-selected={isSelected}
						tabIndex={isSelected ? 0 : -1}
						onClick={() => onSelect(seg.key)}
						className={cn(
							'relative flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium transition-all',
							'min-h-[44px] min-w-[60px]',
							'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
							isSelected ? 'text-t1 bg-bg-card shadow-sm' : 'text-t3 hover:text-t2 hover:bg-bg-hover',
						)}
					>
						{seg.emoji && <span className="text-xs">{seg.emoji}</span>}
						<span>{seg.label}</span>
						<span
							className={cn(
								'rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums',
								isSelected ? 'bg-primary/10 text-primary' : 'bg-bg-input text-t3',
							)}
						>
							{count}
						</span>
						{isSelected && (
							<span className={cn('absolute bottom-0 left-2 right-2 h-0.5 rounded-full', seg.color)} />
						)}
					</button>
				)
			})}
		</div>
	)
}
