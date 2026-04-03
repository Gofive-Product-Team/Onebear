import type { DateRange } from '@/api/useDashboard'

interface Props {
	value: DateRange
	onChange: (range: DateRange) => void
}

function toIsoDate(date: Date): string {
	return date.toISOString().slice(0, 10)
}

export function DateRangeFilter({ value, onChange }: Props) {
	function setPreset(preset: 'last7' | 'last30' | 'thisMonth') {
		const now = new Date()
		if (preset === 'last7') {
			const from = new Date(now)
			from.setDate(from.getDate() - 6)
			onChange({ from: toIsoDate(from), to: toIsoDate(now) })
		} else if (preset === 'last30') {
			const from = new Date(now)
			from.setDate(from.getDate() - 29)
			onChange({ from: toIsoDate(from), to: toIsoDate(now) })
		} else {
			const from = new Date(now.getFullYear(), now.getMonth(), 1)
			onChange({ from: toIsoDate(from), to: toIsoDate(now) })
		}
	}

	return (
		<div className="flex flex-wrap items-center gap-2">
			<button
				type="button"
				onClick={() => setPreset('last7')}
				className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
			>
				Last 7 days
			</button>
			<button
				type="button"
				onClick={() => setPreset('last30')}
				className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
			>
				Last 30 days
			</button>
			<button
				type="button"
				onClick={() => setPreset('thisMonth')}
				className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
			>
				This month
			</button>
			<div className="flex items-center gap-2">
				<input
					type="date"
					value={value.from}
					max={value.to}
					onChange={(e) => onChange({ ...value, from: e.target.value })}
					className="rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
				<span className="text-sm text-gray-500">to</span>
				<input
					type="date"
					value={value.to}
					min={value.from}
					onChange={(e) => onChange({ ...value, to: e.target.value })}
					className="rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
		</div>
	)
}
