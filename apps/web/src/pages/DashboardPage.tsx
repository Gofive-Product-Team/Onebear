import { useState } from 'react'
import type { DateRange } from '@/api/useDashboard'
import {
	useDashboardStats,
	usePlatformDistribution,
	useMessageVolume,
	useResponseTimeTrend,
	useAgentPerformance,
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
		<div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm animate-pulse">
			<div className="h-4 w-24 rounded bg-gray-200" />
			<div className="mt-2 h-8 w-32 rounded bg-gray-200" />
			<div className="mt-1 h-4 w-20 rounded bg-gray-200" />
		</div>
	)
}

function SkeletonChart() {
	return (
		<div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm animate-pulse">
			<div className="h-5 w-40 rounded bg-gray-200" />
			<div className="mt-1 h-4 w-56 rounded bg-gray-200" />
			<div className="mt-4 h-64 rounded bg-gray-100" />
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

	return (
		<div className="mx-auto max-w-7xl space-y-6">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
					<p className="mt-1 text-sm text-gray-500">Overview of your messaging performance</p>
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
