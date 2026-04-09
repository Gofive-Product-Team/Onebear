import { cn } from '@one-bear/ui'

const CUSTOMER_SORT_OPTIONS = [
	{ value: 'recent', label: 'กิจกรรมล่าสุด' },
	{ value: 'revenue', label: 'ยอดซื้อสะสม' },
	{ value: 'lastOrder', label: 'สั่งซื้อล่าสุด' },
	{ value: 'name', label: 'ชื่อ A-Z' },
	{ value: 'newest', label: 'สมัครใหม่สุด' },
] as const

const LEAD_SORT_OPTIONS = [
	{ value: 'recent', label: 'กิจกรรมล่าสุด' },
	{ value: 'name', label: 'ชื่อ A-Z' },
	{ value: 'newest', label: 'เพิ่มใหม่สุด' },
] as const

interface Props {
	value: string
	onChange: (sort: string) => void
	variant?: 'customer' | 'lead'
	className?: string
}

export function SortDropdown({ value, onChange, variant = 'customer', className }: Props) {
	const options = variant === 'lead' ? LEAD_SORT_OPTIONS : CUSTOMER_SORT_OPTIONS
	return (
		<select
			value={value}
			onChange={(e) => onChange(e.target.value)}
			aria-label="เรียงลำดับ"
			className={cn(
				'h-9 rounded-md border border-border-input bg-bg-input px-3 text-sm text-t1 shadow-sm',
				'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
				'cursor-pointer',
				className,
			)}
		>
			{options.map((opt) => (
				<option key={opt.value} value={opt.value}>
					{opt.label}
				</option>
			))}
		</select>
	)
}
