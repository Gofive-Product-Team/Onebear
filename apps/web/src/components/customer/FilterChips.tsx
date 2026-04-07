import { cn } from '@one-bear/ui'
import type { SegmentCounts } from '@/api/useCustomers'

interface Chip {
	key: string
	label: string
	count: (counts: SegmentCounts) => number
}

const CHIPS: Chip[] = [
	{ key: 'All', label: 'All', count: (c) => c.all },
	{ key: 'Hot', label: 'Hot', count: (c) => c.hot },
	{ key: 'VIP', label: 'VIP', count: (c) => c.vip },
	{ key: 'At-risk', label: 'At-risk', count: (c) => c.atRisk },
	{ key: 'New', label: 'New', count: (c) => c.new },
	{ key: 'Cold', label: 'Cold', count: (c) => c.cold },
	{ key: 'Organization', label: 'Organization', count: (c) => c.organization },
]

interface Props {
	counts: SegmentCounts
	selected: string
	onSelect: (segment: string) => void
}

export function FilterChips({ counts, selected, onSelect }: Props) {
	return (
		<div
			className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
			style={{ scrollbarWidth: 'none' }}
			role="tablist"
			aria-label="Customer segments"
		>
			{CHIPS.map((chip) => {
				const isSelected = selected === chip.key
				const count = chip.count(counts)
				return (
					<button
						key={chip.key}
						type="button"
						role="tab"
						aria-selected={isSelected}
						onClick={() => onSelect(chip.key)}
						className={cn(
							'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
							'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
							isSelected
								? 'bg-primary text-white shadow-sm'
								: 'bg-bg-input text-t2 hover:bg-bg-hover',
						)}
					>
						{chip.label}
						<span
							className={cn(
								'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
								isSelected ? 'bg-white/20 text-white' : 'bg-bg-hover text-t3',
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
