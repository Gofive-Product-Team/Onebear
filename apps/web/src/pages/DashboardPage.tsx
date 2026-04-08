import { useState } from 'react'
import type { DateRange } from '@/api/useDashboard'
import {
	useDashboardStats,
	usePlatformDistribution,
	useMessageVolume,
	useResponseTimeTrend,
	useAgentPerformance,
	useOrderKpi,
	useCalendarHeatmap,
} from '@/api/useDashboard'
import { StatCard } from '@/components/dashboard/StatCard'
import { PlatformDistributionChart } from '@/components/dashboard/PlatformDistributionChart'
import { MessageVolumeChart } from '@/components/dashboard/MessageVolumeChart'
import { ResponseTimeChart } from '@/components/dashboard/ResponseTimeChart'
import { AgentPerformanceTable } from '@/components/dashboard/AgentPerformanceTable'
import { DateRangeFilter } from '@/components/dashboard/DateRangeFilter'

function toIsoDate(date: Date): string {
	return date.toISOString().slice(0, 10)
}

function getDefaultDateRange(): DateRange {
	const now = new Date()
	const from = new Date(now)
	from.setDate(from.getDate() - 6)
	return { from: toIsoDate(from), to: toIsoDate(now) }
}

function formatMs(ms: number): string {
	const totalSeconds = Math.floor(ms / 1000)
	const minutes = Math.floor(totalSeconds / 60)
	const seconds = totalSeconds % 60
	return `${minutes}m ${seconds}s`
}

function SkeletonCard() {
	return (
		<div className="rounded-lg border border-border bg-bg-card p-6 shadow-sm animate-pulse">
			<div className="h-4 w-24 rounded bg-bg-input" />
			<div className="mt-2 h-8 w-32 rounded bg-bg-input" />
			<div className="mt-1 h-4 w-20 rounded bg-bg-input" />
		</div>
	)
}

function SkeletonChart() {
	return (
		<div className="rounded-lg border border-border bg-bg-card p-6 shadow-sm animate-pulse">
			<div className="h-5 w-40 rounded bg-bg-input" />
			<div className="mt-1 h-4 w-56 rounded bg-bg-input" />
			<div className="mt-4 h-64 rounded bg-bg-page" />
		</div>
	)
}

export function DashboardPage() {
	const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange)

	const { data: stats, isLoading: statsLoading } = useDashboardStats(dateRange)
	const { data: platformData, isLoading: platformLoading } = usePlatformDistribution(dateRange)
	const { data: volumeData, isLoading: volumeLoading } = useMessageVolume(dateRange)
	const { data: responseData, isLoading: responseLoading } = useResponseTimeTrend(dateRange)
	const { data: agentData, isLoading: agentLoading } = useAgentPerformance(dateRange)
	const { data: orderKpi, isLoading: orderKpiLoading } = useOrderKpi(dateRange)
	const { data: heatmap, isLoading: heatmapLoading } = useCalendarHeatmap(dateRange)

	function formatThb(amount: number) {
		return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(amount)
	}

	return (
		<div className="mx-auto max-w-7xl space-y-6">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-2xl font-bold text-t1">Dashboard</h1>
					<p className="mt-1 text-sm text-t2">Overview of your messaging performance</p>
				</div>
				<DateRangeFilter value={dateRange} onChange={setDateRange} />
			</div>

			{/* Stat Cards (4 cols) */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{statsLoading || !stats ? (
					<>
						<SkeletonCard />
						<SkeletonCard />
						<SkeletonCard />
						<SkeletonCard />
					</>
				) : (
					<>
						<StatCard
							label="Total Rooms"
							value={stats.totalRooms.toLocaleString()}
							change={stats.totalRoomsChange}
						/>
						<StatCard
							label="Active Rooms"
							value={stats.activeRooms.toLocaleString()}
							change={stats.activeRoomsChange}
						/>
						<StatCard
							label="Resolved Today"
							value={stats.resolvedToday.toLocaleString()}
							change={stats.resolvedTodayChange}
							positive={stats.resolvedTodayChange >= 0}
						/>
						<StatCard
							label="Avg Response Time"
							value={formatMs(stats.avgResponseTimeMs)}
							change={stats.avgResponseTimeMsChange}
							positive={stats.avgResponseTimeMsChange <= 0}
						/>
					</>
				)}
			</div>

			{/* Order KPIs */}
			{orderKpiLoading || !orderKpi ? (
				<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
					{Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
				</div>
			) : (
				<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
					<div className="rounded-lg border border-border bg-bg-card p-4 shadow-sm">
						<p className="text-xs font-medium text-t3">Today Revenue</p>
						<p className="mt-1 text-xl font-bold text-success">{formatThb(orderKpi.todayRevenue)}</p>
					</div>
					<div className="rounded-lg border border-border bg-bg-card p-4 shadow-sm">
						<p className="text-xs font-medium text-t3">Period Revenue</p>
						<p className="mt-1 text-xl font-bold text-t1">{formatThb(orderKpi.periodRevenue)}</p>
					</div>
					<div className="rounded-lg border border-border bg-bg-card p-4 shadow-sm">
						<p className="text-xs font-medium text-t3">Avg Order Value</p>
						<p className="mt-1 text-xl font-bold text-t1">{formatThb(orderKpi.avgOrderValue)}</p>
					</div>
					<div className="rounded-lg border border-border bg-bg-card p-4 shadow-sm">
						<p className="text-xs font-medium text-t3">Paid Orders</p>
						<p className="mt-1 text-xl font-bold text-t1">{orderKpi.paidOrders}</p>
					</div>
					<div className="rounded-lg border border-border bg-bg-card p-4 shadow-sm">
						<p className="text-xs font-medium text-t3">Pending Payment</p>
						<p className="mt-1 text-xl font-bold text-warning">{orderKpi.pendingPayment}</p>
					</div>
					<div className="rounded-lg border border-border bg-bg-card p-4 shadow-sm">
						<p className="text-xs font-medium text-t3">New Orders</p>
						<p className="mt-1 text-xl font-bold text-info">{orderKpi.newOrders}</p>
					</div>
				</div>
			)}

			{/* Calendar Heatmap */}
			{!heatmapLoading && heatmap && heatmap.length > 0 && (
				<div className="rounded-lg border border-border bg-bg-card p-6 shadow-sm">
					<h3 className="text-sm font-semibold text-t1">Revenue Calendar</h3>
					<p className="mb-4 text-xs text-t3">Daily revenue heatmap</p>
					<div className="flex flex-wrap gap-1">
						{heatmap.map((day) => {
							const maxRevenue = Math.max(...heatmap.map((d) => d.revenue), 1)
							const intensity = day.revenue / maxRevenue
							const bg = intensity === 0
								? 'bg-bg-input'
								: intensity < 0.25
									? 'bg-primary/20'
									: intensity < 0.5
										? 'bg-primary/40'
										: intensity < 0.75
											? 'bg-primary/60'
											: 'bg-primary'
							return (
								<div
									key={day.date}
									className={`h-5 w-5 rounded-sm ${bg} transition-colors`}
									title={`${day.date}: ${formatThb(day.revenue)}`}
								/>
							)
						})}
					</div>
					<div className="mt-2 flex items-center gap-2 text-xs text-t3">
						<span>Less</span>
						<div className="h-3 w-3 rounded-sm bg-bg-input" />
						<div className="h-3 w-3 rounded-sm bg-primary/20" />
						<div className="h-3 w-3 rounded-sm bg-primary/40" />
						<div className="h-3 w-3 rounded-sm bg-primary/60" />
						<div className="h-3 w-3 rounded-sm bg-primary" />
						<span>More</span>
					</div>
				</div>
			)}

			{/* 2x2 chart grid */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				{platformLoading || !platformData ? (
					<SkeletonChart />
				) : (
					<PlatformDistributionChart data={platformData} />
				)}

				{volumeLoading || !volumeData ? (
					<SkeletonChart />
				) : (
					<MessageVolumeChart data={volumeData} />
				)}

				{responseLoading || !responseData ? (
					<SkeletonChart />
				) : (
					<ResponseTimeChart data={responseData} />
				)}

				{agentLoading || !agentData ? (
					<SkeletonChart />
				) : (
					<AgentPerformanceTable data={agentData} />
				)}
			</div>
		</div>
	)
}
