import { useState } from 'react'
import { cn } from '@one-bear/ui'
import type { AgentPerformance } from '@/api/useDashboard'

interface Props {
	data: AgentPerformance[]
}

type SortKey = 'name' | 'roomsHandled' | 'avgResponseTimeMs' | 'satisfaction'

function formatMs(ms: number): string {
	const totalSeconds = Math.floor(ms / 1000)
	const minutes = Math.floor(totalSeconds / 60)
	const seconds = totalSeconds % 60
	return `${minutes}m ${seconds}s`
}

interface SortIconProps {
	active: boolean
	asc: boolean
}

function SortIcon({ active, asc }: SortIconProps) {
	return (
		<span className="ml-1 inline-flex flex-col text-xs leading-none">
			<span className={cn(active && asc ? 'text-blue-600' : 'text-gray-300')}>▲</span>
			<span className={cn(active && !asc ? 'text-blue-600' : 'text-gray-300')}>▼</span>
		</span>
	)
}

export function AgentPerformanceTable({ data }: Props) {
	const [sortKey, setSortKey] = useState<SortKey>('roomsHandled')
	const [sortAsc, setSortAsc] = useState(false)

	function handleSort(key: SortKey) {
		if (sortKey === key) {
			setSortAsc((prev) => !prev)
		} else {
			setSortKey(key)
			setSortAsc(false)
		}
	}

	const sorted = [...data].sort((a, b) => {
		const aVal = a[sortKey]
		const bVal = b[sortKey]
		if (typeof aVal === 'string' && typeof bVal === 'string') {
			return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
		}
		if (typeof aVal === 'number' && typeof bVal === 'number') {
			return sortAsc ? aVal - bVal : bVal - aVal
		}
		return 0
	})

	function thClass(key: SortKey) {
		return cn(
			'cursor-pointer select-none pb-3 text-left font-medium text-gray-500 hover:text-gray-700',
			sortKey === key && 'text-blue-600',
		)
	}

	return (
		<div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
			<h2 className="text-lg font-semibold text-gray-900">Agent Performance</h2>
			<p className="mt-1 text-sm text-gray-500">Click column header to sort</p>
			<div className="mt-4 overflow-x-auto">
				<table className="w-full text-sm">
					<thead>
						<tr className="border-b border-gray-200">
							<th className={thClass('name')} onClick={() => handleSort('name')}>
								Agent
								<SortIcon active={sortKey === 'name'} asc={sortAsc} />
							</th>
							<th
								className={cn(thClass('roomsHandled'), 'text-right')}
								onClick={() => handleSort('roomsHandled')}
							>
								Rooms
								<SortIcon active={sortKey === 'roomsHandled'} asc={sortAsc} />
							</th>
							<th
								className={cn(thClass('avgResponseTimeMs'), 'text-right')}
								onClick={() => handleSort('avgResponseTimeMs')}
							>
								Avg Time
								<SortIcon active={sortKey === 'avgResponseTimeMs'} asc={sortAsc} />
							</th>
							<th
								className={cn(thClass('satisfaction'), 'text-right')}
								onClick={() => handleSort('satisfaction')}
							>
								Rating
								<SortIcon active={sortKey === 'satisfaction'} asc={sortAsc} />
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-gray-100">
						{sorted.map((agent) => (
							<tr key={agent.userId}>
								<td className="py-3 font-medium text-gray-900">{agent.name}</td>
								<td className="py-3 text-right text-gray-600">{agent.roomsHandled}</td>
								<td className="py-3 text-right text-gray-600">{formatMs(agent.avgResponseTimeMs)}</td>
								<td className="py-3 text-right text-gray-600">{agent.satisfaction.toFixed(1)}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	)
}
