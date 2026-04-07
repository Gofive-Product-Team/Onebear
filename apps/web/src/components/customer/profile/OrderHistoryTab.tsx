import { useState } from 'react'
import { cn } from '@one-bear/ui'
import { Package } from 'lucide-react'
import { Tooltip } from '@/components/ui/Tooltip'
import { Button } from '@/components/ui/Button'
import type { CustomerDetail } from '@/api/useCustomers'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
	if (value >= 1_000_000) return `฿${(value / 1_000_000).toFixed(1)}M`
	if (value >= 1_000) return `฿${(value / 1_000).toFixed(1)}K`
	return `฿${value.toFixed(0)}`
}

// ─── Stat strip ───────────────────────────────────────────────────────────────

interface StatStripProps {
	customer: CustomerDetail
}

function StatStrip({ customer }: StatStripProps) {
	return (
		<div className="grid grid-cols-3 gap-3">
			<div className="rounded-lg border border-border bg-bg-card p-4 text-center">
				<p className="text-xl font-bold text-t1">{formatCurrency(customer.ltv)}</p>
				<p className="mt-0.5 text-xs text-t3">Lifetime Value</p>
			</div>
			<div className="rounded-lg border border-border bg-bg-card p-4 text-center">
				<p className="text-xl font-bold text-t1">{formatCurrency(customer.aov)}</p>
				<p className="mt-0.5 text-xs text-t3">Avg Order Value</p>
			</div>
			<div className="rounded-lg border border-border bg-bg-card p-4 text-center">
				<p className="text-xl font-bold text-t1">{customer.orderCount}</p>
				<p className="mt-0.5 text-xs text-t3">Total Orders</p>
			</div>
		</div>
	)
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
	customer: CustomerDetail
}

export function OrderHistoryTab({ customer }: Props) {
	const [dateRange, setDateRange] = useState('All')

	return (
		<div className="space-y-6">
			{/* Date filter buttons */}
			<div className="flex gap-2">
				{['7d', '30d', '90d', 'All'].map((range) => (
					<button
						key={range}
						type="button"
						onClick={() => setDateRange(range)}
						className={cn(
							'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
							dateRange === range
								? 'bg-primary text-white'
								: 'bg-bg-input text-t2 hover:bg-bg-hover',
						)}
					>
						{range === 'All' ? 'All time' : `Last ${range}`}
					</button>
				))}
			</div>

			{/* CRM stats */}
			<StatStrip customer={customer} />

			{/* Placeholder content */}
			<div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border py-16 text-center">
				<div className="flex h-16 w-16 items-center justify-center rounded-full bg-bg-input text-t3">
					<Package className="h-8 w-8" />
				</div>
				<div>
					<p className="text-base font-semibold text-t1">Order history coming soon</p>
					<p className="mt-1 max-w-sm text-sm text-t2">
						Order history will be available when the Order module is implemented in a future phase.
					</p>
				</div>
				<Tooltip content="Coming soon" side="top">
					<span>
						<Button disabled variant="outline" className="cursor-not-allowed opacity-50">
							Create New Order
						</Button>
					</span>
				</Tooltip>
			</div>
		</div>
	)
}
