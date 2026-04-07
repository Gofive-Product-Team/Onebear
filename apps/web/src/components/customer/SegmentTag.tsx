import { cn } from '@one-bear/ui'
import type { CustomerTag } from '@/api/useCustomers'

// Priority colour map: Hot > At-risk > VIP > Loyal > Cold > New > fallback
const SEGMENT_COLORS: Record<string, string> = {
	hot: 'bg-red-100 text-red-700 border-red-200',
	'at-risk': 'bg-orange-100 text-orange-700 border-orange-200',
	atrisk: 'bg-orange-100 text-orange-700 border-orange-200',
	vip: 'bg-purple-100 text-purple-700 border-purple-200',
	loyal: 'bg-blue-100 text-blue-700 border-blue-200',
	cold: 'bg-gray-100 text-gray-600 border-gray-200',
	new: 'bg-green-100 text-green-700 border-green-200',
}

function getSegmentColor(name: string): string {
	const key = name.toLowerCase().replace(/\s+/g, '')
	return SEGMENT_COLORS[key] ?? 'bg-bg-input text-t2 border-border-input'
}

interface Props {
	tag: CustomerTag
	className?: string
}

export function SegmentTag({ tag, className }: Props) {
	return (
		<span
			title={tag.reason ?? undefined}
			className={cn(
				'inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-xs font-medium',
				getSegmentColor(tag.name),
				className,
			)}
		>
			{tag.isAiAssigned && (
				<span aria-label="AI assigned" className="mr-0.5 text-[10px] leading-none">
					★
				</span>
			)}
			{tag.name}
		</span>
	)
}
