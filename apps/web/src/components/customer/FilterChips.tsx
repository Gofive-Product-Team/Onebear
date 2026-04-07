import { useCallback, useRef, type ReactNode } from 'react'
import { cn } from '@one-bear/ui'
import { Users, Flame, AlertTriangle, Sparkles, Star, Snowflake, Building2 } from 'lucide-react'
import type { SegmentCounts } from '@/api/useCustomers'

interface Segment {
	key: string
	label: string
	icon: ReactNode | null
	color: string
	count: (counts: SegmentCounts) => number
}

const SEGMENTS: Segment[] = [
	{ key: 'All', label: 'All', icon: <Users className="h-3.5 w-3.5" />, color: 'bg-blue-500', count: (c) => c.all },
	{ key: 'Hot', label: 'Hot', icon: <Flame className="h-3.5 w-3.5 text-red-500" />, color: 'bg-red-500', count: (c) => c.hot },
	{ key: 'At-risk', label: 'At-risk', icon: <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />, color: 'bg-orange-500', count: (c) => c.atRisk },
	{ key: 'New', label: 'New', icon: <Sparkles className="h-3.5 w-3.5 text-blue-500" />, color: 'bg-blue-400', count: (c) => c.new },
	{ key: 'VIP', label: 'VIP', icon: <Star className="h-3.5 w-3.5 text-purple-500" />, color: 'bg-purple-500', count: (c) => c.vip },
	{ key: 'Cold', label: 'Cold', icon: <Snowflake className="h-3.5 w-3.5 text-gray-400" />, color: 'bg-gray-400', count: (c) => c.cold },
	{ key: 'Organization', label: 'Org', icon: <Building2 className="h-3.5 w-3.5 text-violet-500" />, color: 'bg-violet-500', count: (c) => c.organization },
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
						{seg.icon && <span className="shrink-0">{seg.icon}</span>}
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
