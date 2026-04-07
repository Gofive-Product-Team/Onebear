import { cn } from '@one-bear/ui'

interface Props {
	label: string
	value: string
	change: number // percentage or absolute
	positive?: boolean // true = green, false = red
}

export function StatCard({ label, value, change, positive }: Props) {
	const isPositive = positive ?? change >= 0
	const sign = change >= 0 ? '+' : ''

	return (
		<div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
			<p className="text-sm font-medium text-gray-500">{label}</p>
			<p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
			<p
				className={cn(
					'mt-1 text-sm font-medium',
					isPositive ? 'text-green-600' : 'text-red-600',
				)}
			>
				{sign}{change}% from last period
			</p>
		</div>
	)
}
