import { useState, useMemo } from 'react'
import { cn } from '@one-bear/ui'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'

// Mock data — satisfaction API does not exist yet
const mockSurveys = [
	{ id: '1', date: '2026-04-02T10:30:00Z', customerName: 'Somchai P.', roomId: 'r-001', platform: 'Line', rating: 5, comment: 'Excellent service, very responsive!' },
	{ id: '2', date: '2026-04-02T09:15:00Z', customerName: 'Nittaya K.', roomId: 'r-002', platform: 'Facebook', rating: 4, comment: 'Good service, could be faster.' },
	{ id: '3', date: '2026-04-01T16:45:00Z', customerName: 'Wichai S.', roomId: 'r-003', platform: 'Instagram', rating: 5, comment: '' },
	{ id: '4', date: '2026-04-01T14:20:00Z', customerName: 'Pranee L.', roomId: 'r-004', platform: 'WhatsApp', rating: 3, comment: 'Had to wait too long for a response.' },
	{ id: '5', date: '2026-04-01T11:00:00Z', customerName: 'Thawatchai R.', roomId: 'r-005', platform: 'Line', rating: 2, comment: 'Issue was not fully resolved.' },
	{ id: '6', date: '2026-03-31T15:30:00Z', customerName: 'Siriporn M.', roomId: 'r-006', platform: 'Email', rating: 4, comment: 'Helpful agent.' },
	{ id: '7', date: '2026-03-31T10:10:00Z', customerName: 'Kritsada W.', roomId: 'r-007', platform: 'Line', rating: 5, comment: 'Problem solved quickly!' },
	{ id: '8', date: '2026-03-30T09:45:00Z', customerName: 'Pattama C.', roomId: 'r-008', platform: 'Facebook', rating: 1, comment: 'Very poor experience. Agent was rude.' },
	{ id: '9', date: '2026-03-30T08:00:00Z', customerName: 'Apirak T.', roomId: 'r-009', platform: 'TikTok', rating: 4, comment: '' },
	{ id: '10', date: '2026-03-29T17:20:00Z', customerName: 'Jintana B.', roomId: 'r-010', platform: 'Shopee', rating: 5, comment: 'Outstanding!' },
]

function StarDisplay({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
	return (
		<span className="inline-flex items-center gap-0.5">
			{Array.from({ length: 5 }, (_, i) => (
				<svg
					key={i}
					className={cn(
						i < rating ? 'text-yellow-400' : 'text-gray-300',
						size === 'lg' ? 'h-6 w-6' : 'h-4 w-4',
					)}
					fill="currentColor"
					viewBox="0 0 20 20"
				>
					<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
				</svg>
			))}
		</span>
	)
}

function RatingDistributionBar({ count, total }: { count: number; total: number }) {
	const percentage = total > 0 ? (count / total) * 100 : 0
	return (
		<div className="flex items-center gap-2">
			<div className="h-2 flex-1 rounded-full bg-gray-100">
				<div
					className="h-2 rounded-full bg-yellow-400 transition-all"
					style={{ width: `${percentage}%` }}
				/>
			</div>
			<span className="w-8 text-right text-xs text-gray-500">{count}</span>
		</div>
	)
}

export function SatisfactionPage() {
	const [dateFrom, setDateFrom] = useState('')
	const [dateTo, setDateTo] = useState('')
	const [ratingFilter, setRatingFilter] = useState<number | null>(null)

	const filteredSurveys = useMemo(() => {
		return mockSurveys.filter((survey) => {
			if (dateFrom && survey.date < dateFrom) return false
			if (dateTo && survey.date > dateTo + 'T23:59:59Z') return false
			if (ratingFilter !== null && survey.rating !== ratingFilter) return false
			return true
		})
	}, [dateFrom, dateTo, ratingFilter])

	const averageRating = useMemo(() => {
		if (filteredSurveys.length === 0) return 0
		const sum = filteredSurveys.reduce((acc, s) => acc + s.rating, 0)
		return sum / filteredSurveys.length
	}, [filteredSurveys])

	const ratingDistribution = useMemo(() => {
		const dist = [0, 0, 0, 0, 0] as [number, number, number, number, number]
		for (const survey of filteredSurveys) {
			const index = survey.rating - 1
			if (index >= 0 && index <= 4) {
				dist[index as 0 | 1 | 2 | 3 | 4]++
			}
		}
		return dist
	}, [filteredSurveys])

	return (
		<div className="mx-auto max-w-7xl space-y-6">
			<div>
				<h1 className="text-2xl font-bold text-gray-900">Customer Satisfaction</h1>
				<p className="mt-1 text-sm text-gray-500">Track CSAT survey results and feedback</p>
			</div>

			{/* Overview Stats */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				{/* Average Score */}
				<div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
					<p className="text-sm font-medium text-gray-500">Average Score</p>
					<div className="mt-2 flex items-center gap-3">
						<span className="text-4xl font-bold text-gray-900">
							{averageRating.toFixed(1)}
						</span>
						<div>
							<StarDisplay rating={Math.round(averageRating)} size="lg" />
							<p className="mt-0.5 text-xs text-gray-500">
								{filteredSurveys.length} response{filteredSurveys.length !== 1 ? 's' : ''}
							</p>
						</div>
					</div>
				</div>

				{/* Rating Distribution */}
				<div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm sm:col-span-2">
					<p className="text-sm font-medium text-gray-500">Rating Distribution</p>
					<div className="mt-3 space-y-1.5">
						{[5, 4, 3, 2, 1].map((star) => (
							<div key={star} className="flex items-center gap-2">
								<button
									type="button"
									onClick={() => setRatingFilter(ratingFilter === star ? null : star)}
									className={cn(
										'flex w-12 items-center gap-1 rounded px-1 py-0.5 text-xs transition-colors',
										ratingFilter === star
											? 'bg-yellow-100 font-bold text-yellow-700'
											: 'text-gray-600 hover:bg-gray-50',
									)}
								>
									{star}
									<svg className="h-3 w-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
										<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
									</svg>
								</button>
								<div className="flex-1">
									<RatingDistributionBar
										count={ratingDistribution[star - 1] ?? 0}
										total={filteredSurveys.length}
									/>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>

			{/* Filters */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-end">
				<div className="flex-1">
					<label className="mb-1.5 block text-sm font-medium text-gray-700">From</label>
					<input
						type="date"
						value={dateFrom}
						onChange={(e) => setDateFrom(e.target.value)}
						className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
					/>
				</div>
				<div className="flex-1">
					<label className="mb-1.5 block text-sm font-medium text-gray-700">To</label>
					<input
						type="date"
						value={dateTo}
						onChange={(e) => setDateTo(e.target.value)}
						className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
					/>
				</div>
				{ratingFilter !== null && (
					<button
						type="button"
						onClick={() => setRatingFilter(null)}
						className="inline-flex h-9 items-center gap-1 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-600 hover:bg-gray-50"
					>
						Rating: {ratingFilter}
						<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				)}
			</div>

			{/* Survey Table */}
			<div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
				<table className="w-full text-sm">
					<thead>
						<tr className="border-b border-gray-200 bg-gray-50">
							<th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
							<th className="px-4 py-3 text-left font-medium text-gray-500">Customer</th>
							<th className="px-4 py-3 text-left font-medium text-gray-500">Platform</th>
							<th className="px-4 py-3 text-left font-medium text-gray-500">Rating</th>
							<th className="px-4 py-3 text-left font-medium text-gray-500">Comment</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-gray-100">
						{filteredSurveys.map((survey) => (
							<tr key={survey.id} className="hover:bg-gray-50">
								<td className="whitespace-nowrap px-4 py-3 text-gray-600">
									{new Date(survey.date).toLocaleDateString('en-US', {
										month: 'short',
										day: 'numeric',
									})}
									<span className="ml-1 text-gray-400">
										{new Date(survey.date).toLocaleTimeString([], {
											hour: '2-digit',
											minute: '2-digit',
										})}
									</span>
								</td>
								<td className="px-4 py-3 font-medium text-gray-900">
									{survey.customerName}
								</td>
								<td className="px-4 py-3">
									<Badge platform={survey.platform}>{survey.platform}</Badge>
								</td>
								<td className="px-4 py-3">
									<StarDisplay rating={survey.rating} />
								</td>
								<td className="max-w-xs px-4 py-3 text-gray-600">
									{survey.comment || (
										<span className="italic text-gray-400">No comment</span>
									)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
				{filteredSurveys.length === 0 && (
					<div className="py-12 text-center text-sm text-gray-500">
						No survey responses match your filters
					</div>
				)}
			</div>
		</div>
	)
}
