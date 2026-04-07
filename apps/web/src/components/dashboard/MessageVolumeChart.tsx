import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
} from 'recharts'
import type { MessageVolume } from '@/api/useDashboard'

interface Props {
	data: MessageVolume[]
}

export function MessageVolumeChart({ data }: Props) {
	return (
		<div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
			<h2 className="text-lg font-semibold text-gray-900">Message Volume</h2>
			<p className="mt-1 text-sm text-gray-500">Inbound vs outbound messages per day</p>
			<div className="mt-4 h-64">
				<ResponsiveContainer width="100%" height="100%">
					<BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
						<CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
						<XAxis dataKey="date" tick={{ fontSize: 12 }} />
						<YAxis tick={{ fontSize: 12 }} />
						<Tooltip />
						<Legend />
						<Bar dataKey="inbound" name="Inbound" fill="#3b82f6" radius={[2, 2, 0, 0]} />
						<Bar dataKey="outbound" name="Outbound" fill="#22c55e" radius={[2, 2, 0, 0]} />
					</BarChart>
				</ResponsiveContainer>
			</div>
		</div>
	)
}
