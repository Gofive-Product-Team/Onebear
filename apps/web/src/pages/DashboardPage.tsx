import { useState } from 'react'
import { cn } from '@one-bear/ui'
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function formatThb(amount: number) {
	return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(amount)
}

// ─── Skeleton helpers ─────────────────────────────────────────────────────────

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

// ─── Tab types ────────────────────────────────────────────────────────────────

type Tab = 'chat' | 'revenue' | 'ai'

const TABS: { id: Tab; label: string }[] = [
	{ id: 'chat', label: 'Chat' },
	{ id: 'revenue', label: 'Revenue' },
	{ id: 'ai', label: 'AI Agent' },
]

// ─── Top Products stub data ───────────────────────────────────────────────────

const TOP_PRODUCTS = [
	{ name: 'ครีมบำรุงผิวหน้า SPF50', revenue: 215000, orders: 254, pct: 28.4 },
	{ name: 'เซรั่มวิตามินซี', revenue: 178500, orders: 210, pct: 23.6 },
	{ name: 'มาส์กหน้าลดสิว', revenue: 134200, orders: 192, pct: 17.7 },
	{ name: 'โลชั่นบำรุงผิวกาย', revenue: 98700, orders: 147, pct: 13.0 },
	{ name: 'ครีมล้างหน้าอ่อนโยน', revenue: 131000, orders: 178, pct: 17.3 },
]

// ─── Handoff Queue stub data ──────────────────────────────────────────────────

const HANDOFF_ROWS = [
	{ customer: 'Jane Smith', channel: 'LINE', reason: 'ลูกค้าขอคนช่วย', wait: '2 นาที' },
	{ customer: 'John Doe', channel: 'Facebook', reason: 'ไม่เข้าใจคำถาม', wait: '5 นาที' },
	{ customer: 'สมใจ รักดี', channel: 'Instagram', reason: 'ต้องการยืนยันออเดอร์', wait: '8 นาที' },
]

// ─── AI stat card ─────────────────────────────────────────────────────────────

function AiStatCard({
	title,
	value,
	label,
	showUpArrow,
}: {
	title: string
	value: string
	label: string
	showUpArrow?: boolean
}) {
	return (
		<div className="rounded-lg border border-border bg-bg-card p-5 shadow-sm">
			<p className="text-xs font-medium text-t3">{title}</p>
			<div className="mt-1 flex items-end gap-1.5">
				<p className="text-2xl font-bold text-t1">{value}</p>
				{showUpArrow && (
					<span className="mb-0.5 text-sm font-semibold text-success">↑</span>
				)}
			</div>
			<p className="mt-0.5 text-xs text-t2">{label}</p>
		</div>
	)
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function DashboardPage() {
	const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange)
	const [activeTab, setActiveTab] = useState<Tab>('chat')

	const { data: stats, isLoading: statsLoading } = useDashboardStats(dateRange)
	const { data: platformData, isLoading: platformLoading } = usePlatformDistribution(dateRange)
	const { data: volumeData, isLoading: volumeLoading } = useMessageVolume(dateRange)
	const { data: responseData, isLoading: responseLoading } = useResponseTimeTrend(dateRange)
	const { data: agentData, isLoading: agentLoading } = useAgentPerformance(dateRange)
	const { data: orderKpi, isLoading: orderKpiLoading } = useOrderKpi(dateRange)
	const { data: heatmap, isLoading: heatmapLoading } = useCalendarHeatmap(dateRange)

	return (
		<div className="mx-auto max-w-7xl space-y-6">
			{/* Header row: title + tabs + date filter */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-2xl font-bold text-t1">Dashboard</h1>
					<p className="mt-1 text-sm text-t2">Overview of your messaging performance</p>
				</div>

				{/* Right side: tabs + date filter */}
				<div className="flex flex-wrap items-center gap-3">
					{/* Pill tabs */}
					<div className="flex items-center gap-1 rounded-full border border-border bg-bg-card p-1 shadow-sm">
						{TABS.map((tab) => (
							<button
								key={tab.id}
								onClick={() => setActiveTab(tab.id)}
								className={cn(
									'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
									activeTab === tab.id
										? 'bg-primary text-white shadow-sm'
										: 'text-t3 hover:text-t1',
								)}
							>
								{tab.label}
							</button>
						))}
					</div>

					<DateRangeFilter value={dateRange} onChange={setDateRange} />
				</div>
			</div>

			{/* ── Chat tab ───────────────────────────────────────────────────── */}
			{activeTab === 'chat' && (
				<div className="space-y-6">
					{/* 4 stat cards */}
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
			)}

			{/* ── Revenue tab ────────────────────────────────────────────────── */}
			{activeTab === 'revenue' && (
				<div className="space-y-6">
					{/* 6 Order KPI cards */}
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

					{/* Revenue Calendar heatmap */}
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

					{/* Top Products by Revenue table */}
					<div className="rounded-lg border border-border bg-bg-card shadow-sm overflow-hidden">
						<div className="border-b border-border px-5 py-3.5">
							<h3 className="text-sm font-semibold text-t1">Top Products by Revenue</h3>
							<p className="mt-0.5 text-xs text-t3">สินค้าขายดีในช่วงเวลาที่เลือก</p>
						</div>
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b border-border bg-bg-input/50">
										<th className="px-5 py-2.5 text-left text-xs font-medium text-t3">ชื่อสินค้า</th>
										<th className="px-5 py-2.5 text-right text-xs font-medium text-t3">ยอดขาย</th>
										<th className="px-5 py-2.5 text-right text-xs font-medium text-t3">จำนวนออเดอร์</th>
										<th className="px-5 py-2.5 text-right text-xs font-medium text-t3">% ของยอดรวม</th>
									</tr>
								</thead>
								<tbody>
									{TOP_PRODUCTS.map((row, i) => (
										<tr
											key={row.name}
											className="border-b border-border/50 hover:bg-bg-hover transition-colors"
										>
											<td className="px-5 py-3 font-medium text-t1">
												<div className="flex items-center gap-2">
													<span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
														{i + 1}
													</span>
													{row.name}
												</div>
											</td>
											<td className="px-5 py-3 text-right font-semibold text-success">
												{formatThb(row.revenue)}
											</td>
											<td className="px-5 py-3 text-right text-t2">{row.orders.toLocaleString()}</td>
											<td className="px-5 py-3 text-right">
												<div className="flex items-center justify-end gap-2">
													<div className="h-1.5 w-16 overflow-hidden rounded-full bg-bg-input">
														<div
															className="h-full rounded-full bg-primary"
															style={{ width: `${row.pct}%` }}
														/>
													</div>
													<span className="w-10 text-right text-t2">{row.pct}%</span>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			)}

			{/* ── AI Agent tab ───────────────────────────────────────────────── */}
			{activeTab === 'ai' && (
				<div className="space-y-6">
					{/* 4 AI stat cards */}
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
						<AiStatCard
							title="AI ตอบแชท"
							value="68%"
							label="อัตราการตอบสำเร็จ"
							showUpArrow
						/>
						<AiStatCard
							title="แชทที่ AI จัดการ"
							value="247"
							label="วันนี้"
						/>
						<AiStatCard
							title="Handoff ไปคน"
							value="31"
							label="วันนี้"
						/>
						<AiStatCard
							title="ประหยัดเวลา"
							value="4.2h"
							label="เฉลี่ยต่อวัน"
						/>
					</div>

					{/* Handoff Queue */}
					<div className="rounded-lg border border-border bg-bg-card shadow-sm overflow-hidden">
						<div className="border-b border-border px-5 py-3.5">
							<h3 className="text-sm font-semibold text-t1">Handoff Queue</h3>
							<p className="mt-0.5 text-xs text-t3">แชทที่ AI ส่งต่อให้คน รอรับอยู่</p>
						</div>
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b border-border bg-bg-input/50">
										<th className="px-5 py-2.5 text-left text-xs font-medium text-t3">ลูกค้า</th>
										<th className="px-5 py-2.5 text-left text-xs font-medium text-t3">ช่องทาง</th>
										<th className="px-5 py-2.5 text-left text-xs font-medium text-t3">เหตุผล Handoff</th>
										<th className="px-5 py-2.5 text-right text-xs font-medium text-t3">รอนาน</th>
										<th className="px-5 py-2.5 text-right text-xs font-medium text-t3" />
									</tr>
								</thead>
								<tbody>
									{HANDOFF_ROWS.map((row, i) => (
										<tr
											key={i}
											className="border-b border-border/50 hover:bg-bg-hover transition-colors"
										>
											<td className="px-5 py-3 font-medium text-t1">{row.customer}</td>
											<td className="px-5 py-3 text-t2">{row.channel}</td>
											<td className="px-5 py-3 text-t2">{row.reason}</td>
											<td className="px-5 py-3 text-right text-warning font-medium">{row.wait}</td>
											<td className="px-5 py-3 text-right">
												<button className="rounded-lg bg-success px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-80">
													รับแชท
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
