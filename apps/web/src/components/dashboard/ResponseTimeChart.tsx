import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from 'recharts'
import type { ResponseTimeTrend } from '@/api/useDashboard'

interface Props {
	data: ResponseTimeTrend[]
}

function formatMs(ms: number): string {
	const totalSeconds = Math.floor(ms / 1000)
	const minutes = Math.floor(totalSeconds / 60)
	const seconds = totalSeconds % 60
	return `${minutes}m ${seconds}s`
}

export function ResponseTimeChart({ data }: Props) {
	return (
		<div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
			<h2 className="text-lg font-semibold text-gray-900">Avg Response Time</h2>
			<p className="mt-1 text-sm text-gray-500">Average agent response time trend</p>
			<div className="mt-4 h-64">
				<ResponsiveContainer width="100%" height="100%">
					<LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
						<CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
						<XAxis dataKey="date" tick={{ fontSize: 12 }} />
						<YAxis
							tick={{ fontSize: 12 }}
							tickFormatter={(value: number) => formatMs(value)}
							width={56}
						/>
						<Tooltip
							formatter={(value) => [formatMs(Number(value)), 'Avg Response Time']}
						/>
						<Line
							type="monotone"
							dataKey="avgMs"
							name="Avg Response Time"
							stroke="#8b5cf6"
							strokeWidth={2}
							dot={{ r: 4, fill: '#8b5cf6' }}
							activeDot={{ r: 6 }}
						/>
					</LineChart>
				</ResponsiveContainer>
			</div>
		</div>
	)
}
