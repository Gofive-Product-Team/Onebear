import { useEffect, useRef, useState } from 'react'
import { Skeleton } from '@/components/ui/Skeleton'
import { useActivityLog } from '@/api/useActivityLog'
import { ActivityTimelineItem } from './ActivityTimelineItem'

// ─── Filter options ───────────────────────────────────────────────────────────

const FILTER_OPTIONS = [
	{ value: '', label: 'All' },
	{ value: 'chat', label: 'Chat' },
	{ value: 'order', label: 'Order' },
	{ value: 'note', label: 'Note' },
	{ value: 'tag_change', label: 'Tag Change' },
	{ value: 'status_change', label: 'Status Change' },
]

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function ActivitySkeleton() {
	return (
		<div className="space-y-4">
			{Array.from({ length: 4 }).map((_, i) => (
				<div key={i} className="flex gap-3">
					<Skeleton className="h-8 w-8 shrink-0 rounded-full" />
					<div className="flex-1 space-y-1.5 pt-1">
						<Skeleton className="h-3.5 w-3/4" />
						<Skeleton className="h-2.5 w-1/3" />
					</div>
				</div>
			))}
		</div>
	)
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
	customerId: string
}

export function ActivityLogTab({ customerId }: Props) {
	const [typeFilter, setTypeFilter] = useState('')
	const sentinelRef = useRef<HTMLDivElement>(null)

	const { data, isLoading, isError, isFetchingNextPage, fetchNextPage, hasNextPage } = useActivityLog(
		customerId,
		typeFilter || undefined,
	)

	const items = data?.pages.flatMap((p) => p.data) ?? []

	// Infinite scroll
	useEffect(() => {
		if (!hasNextPage) return
		const sentinel = sentinelRef.current
		if (!sentinel) return

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting && !isFetchingNextPage) {
					fetchNextPage()
				}
			},
			{ rootMargin: '100px' },
		)
		observer.observe(sentinel)
		return () => observer.disconnect()
	}, [hasNextPage, isFetchingNextPage, fetchNextPage])

	return (
		<div className="space-y-4">
			{/* Type filter dropdown */}
			<div className="flex items-center gap-2">
				<label htmlFor="activity-type-filter" className="text-xs font-medium text-t2 shrink-0">
					Filter:
				</label>
				<select
					id="activity-type-filter"
					value={typeFilter}
					onChange={(e) => setTypeFilter(e.target.value)}
					className="rounded-md border border-border bg-bg-card px-3 py-1.5 text-sm text-t1 focus:outline-none focus:ring-2 focus:ring-primary"
				>
					{FILTER_OPTIONS.map((opt) => (
						<option key={opt.value} value={opt.value}>
							{opt.label}
						</option>
					))}
				</select>
			</div>

			{/* Error */}
			{isError && (
				<p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
					Failed to load activity log.
				</p>
			)}

			{/* Loading */}
			{isLoading && <ActivitySkeleton />}

			{/* Empty state */}
			{!isLoading && !isError && items.length === 0 && (
				<div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
					<div className="flex h-14 w-14 items-center justify-center rounded-full bg-bg-input text-2xl">
						📋
					</div>
					<div>
						<p className="text-sm font-medium text-t1">No activity recorded yet</p>
						<p className="mt-1 text-xs text-t2">Activity will appear here as you interact with this customer.</p>
					</div>
				</div>
			)}

			{/* Timeline */}
			{!isLoading && items.length > 0 && (
				<div>
					{items.map((item, idx) => (
						<ActivityTimelineItem key={item.id} item={item} isLast={idx === items.length - 1} />
					))}
				</div>
			)}

			{/* Infinite scroll sentinel */}
			<div ref={sentinelRef} className="h-2" aria-hidden="true" />

			{/* Loading next page */}
			{isFetchingNextPage && (
				<div className="flex justify-center py-2">
					<div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
				</div>
			)}
		</div>
	)
}
