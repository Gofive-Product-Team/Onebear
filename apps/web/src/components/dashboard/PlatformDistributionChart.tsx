import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts'
import type { PieLabelRenderProps } from 'recharts'
import type { PlatformDistribution } from '@/api/useDashboard'

interface Props {
	data: PlatformDistribution[]
}

export function PlatformDistributionChart({ data }: Props) {
	return (
		<div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
			<h2 className="text-lg font-semibold text-gray-900">Platform Distribution</h2>
			<p className="mt-1 text-sm text-gray-500">Rooms by messaging platform</p>
			<div className="mt-4 h-64">
				<ResponsiveContainer width="100%" height="100%">
					<PieChart>
						<Pie
							data={data}
							dataKey="count"
							nameKey="platform"
							cx="50%"
							cy="50%"
							outerRadius={80}
							label={(props: PieLabelRenderProps) =>
								`${String(props.name ?? '')} ${((Number(props.percent) ?? 0) * 100).toFixed(0)}%`
							}
							labelLine={false}
						>
							{data.map((entry) => (
								<Cell key={entry.platform} fill={entry.color} />
							))}
						</Pie>
						<Tooltip
							formatter={(value) => [`${Number(value).toLocaleString()}`, 'Rooms']}
						/>
						<Legend />
					</PieChart>
				</ResponsiveContainer>
			</div>
		</div>
	)
}
