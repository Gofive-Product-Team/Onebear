import { cn } from '@one-bear/ui'

// Mock data — analytics API does not exist yet
const stats = [
	{ label: 'Total Rooms', value: '1,284', change: '+12%', changeType: 'positive' as const },
	{ label: 'Active Rooms', value: '47', change: '+3', changeType: 'positive' as const },
	{ label: 'Resolved Today', value: '23', change: '-5%', changeType: 'negative' as const },
	{ label: 'Avg Response Time', value: '2m 34s', change: '-18%', changeType: 'positive' as const },
]

const platformDistribution = [
	{ platform: 'LINE', count: 542, color: 'bg-green-500' },
	{ platform: 'Facebook', count: 318, color: 'bg-blue-500' },
	{ platform: 'Instagram', count: 186, color: 'bg-pink-500' },
	{ platform: 'WhatsApp', count: 104, color: 'bg-emerald-500' },
	{ platform: 'Email', count: 72, color: 'bg-gray-500' },
	{ platform: 'TikTok', count: 34, color: 'bg-slate-700' },
	{ platform: 'Lazada', count: 18, color: 'bg-orange-500' },
	{ platform: 'Shopee', count: 10, color: 'bg-red-500' },
]

const agentPerformance = [
	{ name: 'Somchai K.', roomsHandled: 84, avgResponseTime: '1m 45s', satisfaction: 4.8 },
	{ name: 'Nattaporn S.', roomsHandled: 72, avgResponseTime: '2m 12s', satisfaction: 4.6 },
	{ name: 'Kittipong W.', roomsHandled: 68, avgResponseTime: '2m 55s', satisfaction: 4.3 },
	{ name: 'Areeya P.', roomsHandled: 61, avgResponseTime: '3m 08s', satisfaction: 4.5 },
	{ name: 'Thanakrit L.', roomsHandled: 55, avgResponseTime: '2m 30s', satisfaction: 4.7 },
]

const maxPlatformCount = Math.max(...platformDistribution.map((p) => p.count))

function StatCard({
	label,
	value,
	change,
	changeType,
}: {
	label: string
	value: string
	change: string
	changeType: 'positive' | 'negative'
}) {
	return (
		<div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
			<p className="text-sm font-medium text-gray-500">{label}</p>
			<p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
			<p
				className={cn(
					'mt-1 text-sm font-medium',
					changeType === 'positive' ? 'text-green-600' : 'text-red-600',
				)}
			>
				{change} from last week
			</p>
		</div>
	)
}

function StarRating({ rating }: { rating: number }) {
	const fullStars = Math.floor(rating)
	const hasHalf = rating - fullStars >= 0.5

	return (
		<span className="inline-flex items-center gap-0.5">
			{Array.from({ length: 5 }, (_, i) => (
				<svg
					key={i}
					className={cn(
						'h-4 w-4',
						i < fullStars
							? 'text-yellow-400'
							: i === fullStars && hasHalf
								? 'text-yellow-400'
								: 'text-gray-300',
					)}
					fill="currentColor"
					viewBox="0 0 20 20"
				>
					<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
				</svg>
			))}
			<span className="ml-1 text-sm text-gray-600">{rating.toFixed(1)}</span>
		</span>
	)
}

export function DashboardPage() {
	return (
		<div className="mx-auto max-w-7xl space-y-6">
			<div>
				<h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
				<p className="mt-1 text-sm text-gray-500">Overview of your messaging performance</p>
			</div>

			{/* Stat Cards */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{stats.map((stat) => (
					<StatCard key={stat.label} {...stat} />
				))}
			</div>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				{/* Platform Distribution */}
				<div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
					<h2 className="text-lg font-semibold text-gray-900">Platform Distribution</h2>
					<p className="mt-1 text-sm text-gray-500">Rooms by messaging platform</p>
					<div className="mt-6 space-y-3">
						{platformDistribution.map((p) => (
							<div key={p.platform} className="flex items-center gap-3">
								<span className="w-20 shrink-0 text-sm font-medium text-gray-700">
									{p.platform}
								</span>
								<div className="flex-1">
									<div className="h-6 w-full rounded-full bg-gray-100">
										<div
											className={cn('h-6 rounded-full transition-all', p.color)}
											style={{ width: `${(p.count / maxPlatformCount) * 100}%` }}
										/>
									</div>
								</div>
								<span className="w-12 shrink-0 text-right text-sm font-medium text-gray-600">
									{p.count}
								</span>
							</div>
						))}
					</div>
				</div>

				{/* Agent Performance */}
				<div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
					<h2 className="text-lg font-semibold text-gray-900">Agent Performance</h2>
					<p className="mt-1 text-sm text-gray-500">Top agents this week</p>
					<div className="mt-6 overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b border-gray-200">
									<th className="pb-3 text-left font-medium text-gray-500">Agent</th>
									<th className="pb-3 text-right font-medium text-gray-500">Rooms</th>
									<th className="pb-3 text-right font-medium text-gray-500">Avg Time</th>
									<th className="pb-3 text-right font-medium text-gray-500">Rating</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-100">
								{agentPerformance.map((agent) => (
									<tr key={agent.name}>
										<td className="py-3 font-medium text-gray-900">{agent.name}</td>
										<td className="py-3 text-right text-gray-600">{agent.roomsHandled}</td>
										<td className="py-3 text-right text-gray-600">{agent.avgResponseTime}</td>
										<td className="py-3 text-right">
											<StarRating rating={agent.satisfaction} />
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	)
}
