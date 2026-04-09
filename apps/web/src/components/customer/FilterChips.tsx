import { useCallback, useRef, type ReactNode } from 'react'
import { cn } from '@one-bear/ui'
import { Users, AlertTriangle, Sparkles, Star, RefreshCw, XCircle } from 'lucide-react'
import type { SegmentCounts } from '@/api/useCustomers'

interface Segment {
	key: string
	label: string
	icon: ReactNode | null
	color: string
	count: (counts: SegmentCounts) => number
}

const SEGMENTS: Segment[] = [
	{ key: 'All', label: 'ทั้งหมด', icon: <Users className="h-3.5 w-3.5" />, color: 'bg-blue-500', count: (c) => c.all },
	{ key: 'NeedsAttention', label: 'ต้องดูแล', icon: <AlertTriangle className="h-3.5 w-3.5" />, color: 'bg-orange-500', count: (c) => c.atRisk },
	{ key: 'VIP', label: 'VIP', icon: <Star className="h-3.5 w-3.5" />, color: 'bg-purple-500', count: (c) => c.vip },
	{ key: 'Repeat', label: 'ซื้อซ้ำ', icon: <RefreshCw className="h-3.5 w-3.5" />, color: 'bg-teal-500', count: (c) => c.repeat ?? 0 },
	{ key: 'New', label: 'ใหม่เดือนนี้', icon: <Sparkles className="h-3.5 w-3.5" />, color: 'bg-blue-400', count: (c) => c.new },
	{ key: 'Churned', label: 'หายไป', icon: <XCircle className="h-3.5 w-3.5" />, color: 'bg-gray-500', count: (c) => c.churned ?? c.cold ?? 0 },
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
							'flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
							'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
							isSelected
								? 'border-primary bg-primary text-white shadow-sm'
								: 'border-border bg-bg-card text-t2 hover:border-primary/50 hover:text-t1',
						)}
					>
						{seg.icon && <span className="shrink-0">{seg.icon}</span>}
						<span>{seg.label}</span>
						<span
							className={cn(
								'rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums',
								isSelected ? 'bg-white/20 text-white' : 'bg-bg-input text-t3',
							)}
						>
							{count}
						</span>
					</button>
				)
			})}
		</div>
	)
}
