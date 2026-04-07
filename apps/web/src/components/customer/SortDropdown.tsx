import { cn } from '@one-bear/ui'

const SORT_OPTIONS = [
	{ value: 'recent', label: 'Recent activity' },
	{ value: 'revenue', label: 'Revenue' },
	{ value: 'lastOrder', label: 'Last order' },
	{ value: 'name', label: 'Name A-Z' },
	{ value: 'newest', label: 'Newest' },
] as const

interface Props {
	value: string
	onChange: (sort: string) => void
	className?: string
}

export function SortDropdown({ value, onChange, className }: Props) {
	return (
		<select
			value={value}
			onChange={(e) => onChange(e.target.value)}
			aria-label="Sort customers"
			className={cn(
				'h-9 rounded-md border border-border-input bg-bg-input px-3 text-sm text-t1 shadow-sm',
				'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
				'cursor-pointer',
				className,
			)}
		>
			{SORT_OPTIONS.map((opt) => (
				<option key={opt.value} value={opt.value}>
					{opt.label}
				</option>
			))}
		</select>
	)
}
