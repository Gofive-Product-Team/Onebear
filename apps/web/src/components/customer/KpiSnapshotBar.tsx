import { cn } from '@one-bear/ui'
import { Skeleton } from '@/components/ui/Skeleton'
import { useKpiSnapshot } from '@/api/useCustomerKpi'

// ─── Currency formatter ───────────────────────────────────────────────────────

function formatCurrency(value: number): string {
	if (value >= 1_000_000) return `฿${(value / 1_000_000).toFixed(1)}M`
	if (value >= 1_000) return `฿${(value / 1_000).toFixed(1)}K`
	return `฿${value.toFixed(0)}`
}

// ─── Stat card ────────────────────────────────────────────────────────────────

interface StatCardProps {
	label: string
	value: string | number
	accent?: 'red' | 'green' | 'blue' | 'default'
}

function StatCard({ label, value, accent = 'default' }: StatCardProps) {
	return (
		<div
			className={cn(
				'flex min-w-[110px] shrink-0 flex-col items-center justify-center rounded-lg border px-4 py-2.5',
				accent === 'red' && 'border-red-200 bg-red-50',
				accent === 'green' && 'border-green-200 bg-green-50',
				accent === 'blue' && 'border-blue-200 bg-blue-50',
				accent === 'default' && 'border-border bg-bg-card',
			)}
		>
			<p
				className={cn(
					'text-base font-bold',
					accent === 'red' && 'text-red-700',
					accent === 'green' && 'text-green-700',
					accent === 'blue' && 'text-blue-700',
					accent === 'default' && 'text-t1',
				)}
			>
				{value}
			</p>
			<p className="mt-0.5 text-[11px] text-t3">{label}</p>
		</div>
	)
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function KpiSnapshotSkeleton() {
	return (
		<div className="flex gap-3 overflow-x-auto pb-1">
			{Array.from({ length: 5 }).map((_, i) => (
				<Skeleton key={i} className="h-[62px] min-w-[110px] shrink-0 rounded-lg" />
			))}
		</div>
	)
}

// ─── Component ────────────────────────────────────────────────────────────────

export function KpiSnapshotBar() {
	const { data, isLoading } = useKpiSnapshot()

	if (isLoading) return <KpiSnapshotSkeleton />
	if (!data) return null

	return (
		<div className="space-y-2">
			{/* Alert banner */}
			{data.alertMessage && (
				<div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-medium text-orange-700">
					<span aria-hidden="true">⚠️</span>
					<span>{data.alertMessage}</span>
				</div>
			)}

			{/* Stat cards — horizontal scroll on mobile */}
			<div className="flex gap-3 overflow-x-auto pb-1 md:overflow-x-visible">
				<StatCard label="Total Customers" value={data.totalCustomers.toLocaleString()} />
				<StatCard label="Hot" value={data.hotCount} accent="green" />
				<StatCard label="At-Risk" value={data.atRiskCount} accent="red" />
				<StatCard label="New This Week" value={data.newThisWeek} accent="blue" />
				<StatCard label="Total LTV" value={formatCurrency(data.totalLtv)} />
			</div>
		</div>
	)
}
