import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@one-bear/ui'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { useCustomers, useSegmentCounts, type SegmentCounts } from '@/api/useCustomers'
import { CustomerCard } from '@/components/customer/CustomerCard'
import { CustomerDetailPanel } from '@/components/customer/CustomerDetailPanel'
import { FilterChips } from '@/components/customer/FilterChips'
import { SortDropdown } from '@/components/customer/SortDropdown'
import { CustomerSearch } from '@/components/customer/CustomerSearch'
import { AddCustomerPanel } from '@/components/customer/AddCustomerPanel'
import { FloatingActionButton } from '@/components/customer/FloatingActionButton'

// ─── Empty segment counts fallback ────────────────────────────────────────────

const EMPTY_COUNTS: SegmentCounts = { all: 0, hot: 0, vip: 0, atRisk: 0, new: 0, cold: 0, organization: 0 }

// ─── Skeleton grid ────────────────────────────────────────────────────────────

function SkeletonCard() {
	return (
		<div className="flex flex-col gap-3 rounded-xl border border-border bg-bg-card p-4 shadow-sm">
			<div className="flex items-center gap-3">
				<Skeleton className="h-10 w-10 rounded-full" />
				<div className="flex-1 space-y-1.5">
					<Skeleton className="h-3.5 w-28" />
					<Skeleton className="h-2.5 w-16" />
				</div>
			</div>
			<div className="flex gap-2">
				<Skeleton className="h-5 w-14 rounded-full" />
				<Skeleton className="h-5 w-14 rounded-full" />
			</div>
			<Skeleton className="h-12 rounded-lg" />
			<div className="flex gap-2">
				<Skeleton className="h-7 flex-1 rounded-md" />
				<Skeleton className="h-7 flex-1 rounded-md" />
				<Skeleton className="h-7 flex-1 rounded-md" />
			</div>
		</div>
	)
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ search, onAdd }: { search: string; onAdd: () => void }) {
	if (search) {
		return (
			<div className="col-span-full flex flex-col items-center justify-center gap-4 py-20 text-center">
				<div className="flex h-16 w-16 items-center justify-center rounded-full bg-bg-input text-t3">
					<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
						<circle cx="11" cy="11" r="8" />
						<path d="m21 21-4.35-4.35" />
					</svg>
				</div>
				<div>
					<p className="text-sm font-medium text-t1">No customers found for &ldquo;{search}&rdquo;</p>
					<p className="mt-1 text-xs text-t2">Try different search terms or add a new customer.</p>
				</div>
			</div>
		)
	}

	return (
		<div className="col-span-full flex flex-col items-center justify-center gap-4 py-24 text-center">
			<div className="flex h-20 w-20 items-center justify-center rounded-full bg-bg-input text-t3">
				<svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
					<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
					<circle cx="9" cy="7" r="4" />
					<path d="M23 21v-2a4 4 0 0 0-3-3.87" />
					<path d="M16 3.13a4 4 0 0 1 0 7.75" />
				</svg>
			</div>
			<div>
				<p className="text-base font-semibold text-t1">No customers yet</p>
				<p className="mt-1 text-sm text-t2">Add your first customer to get started.</p>
			</div>
			<Button onClick={onAdd}>Add your first customer</Button>
		</div>
	)
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function CustomerPage() {
	const [segment, setSegment] = useState('All')
	const [search, setSearch] = useState('')
	const [sort, setSort] = useState('recent')
	const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
	const [showAddPanel, setShowAddPanel] = useState(false)
	const [addInitialName, setAddInitialName] = useState<string | undefined>(undefined)

	// Infinite query
	const { data, isLoading, isError, isFetchingNextPage, fetchNextPage, hasNextPage } = useCustomers({
		segment,
		search,
		sort,
	})

	// Segment counts for filter chips
	const { data: counts } = useSegmentCounts()

	const customers = data?.pages.flatMap((p) => p.data) ?? []
	const isEmpty = !isLoading && !isError && customers.length === 0

	// IntersectionObserver sentinel for infinite scroll
	const sentinelRef = useRef<HTMLDivElement>(null)
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
			{ rootMargin: '200px' },
		)
		observer.observe(sentinel)
		return () => observer.disconnect()
	}, [hasNextPage, isFetchingNextPage, fetchNextPage])

	const handleCardClick = useCallback((id: string) => {
		setSelectedCustomerId((prev) => (prev === id ? null : id))
	}, [])

	function openAddPanel(initialName?: string) {
		setAddInitialName(initialName)
		setShowAddPanel(true)
	}

	return (
		<div className="mx-auto max-w-7xl space-y-5 pb-20">
			{/* Page header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-t1">Customers</h1>
					<p className="mt-0.5 text-sm text-t2">Manage and view customer information</p>
				</div>
				{/* "+ Add Customer" button — desktop only */}
				<Button
					onClick={() => openAddPanel()}
					className="hidden md:inline-flex"
				>
					<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
						<path d="M12 5v14" />
						<path d="M5 12h14" />
					</svg>
					Add Customer
				</Button>
			</div>

			{/* Filter chips */}
			<FilterChips
				counts={counts ?? EMPTY_COUNTS}
				selected={segment}
				onSelect={(s) => {
					setSegment(s)
					setSelectedCustomerId(null)
				}}
			/>

			{/* Search + Sort row */}
			<div className="flex gap-3">
				<div className="flex-1">
					<CustomerSearch
						value={search}
						onChange={setSearch}
						showAddNew={isEmpty && !!search}
						onAddNew={(name) => openAddPanel(name)}
					/>
				</div>
				<SortDropdown value={sort} onChange={setSort} />
			</div>

			{/* Error state */}
			{isError && (
				<div className="rounded-md border border-error bg-error-bg p-4 text-sm text-error">
					Failed to load customers.{' '}
					<button
						type="button"
						className="underline hover:no-underline"
						onClick={() => window.location.reload()}
					>
						Retry
					</button>
				</div>
			)}

			{/* Content layout: grid + detail panel */}
			<div className={cn('flex gap-6', selectedCustomerId && 'lg:pr-0')}>
				{/* Card grid */}
				<div className="min-w-0 flex-1">
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
						{/* Loading skeletons */}
						{isLoading &&
							Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}

						{/* Cards */}
						{!isLoading &&
							customers.map((customer) => (
								<CustomerCard
									key={customer.id}
									customer={customer}
									onClick={() => handleCardClick(customer.id)}
								/>
							))}

						{/* Empty state (spans all cols) */}
						{isEmpty && (
							<EmptyState search={search} onAdd={() => openAddPanel()} />
						)}
					</div>

					{/* Infinite scroll sentinel */}
					<div ref={sentinelRef} className="h-4" aria-hidden="true" />

					{/* Fetching next page indicator */}
					{isFetchingNextPage && (
						<div className="mt-4 flex justify-center">
							<div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
						</div>
					)}
				</div>

				{/* Detail panel — fixed width on large screens */}
				{selectedCustomerId && (
					<div className="w-full shrink-0 overflow-y-auto rounded-xl border border-border bg-bg-card shadow-sm lg:w-96">
						<CustomerDetailPanel
							customerId={selectedCustomerId}
							onClose={() => setSelectedCustomerId(null)}
						/>
					</div>
				)}
			</div>

			{/* Add customer panel */}
			<AddCustomerPanel
				open={showAddPanel}
				onOpenChange={setShowAddPanel}
				initialName={addInitialName}
			/>

			{/* Mobile FAB */}
			<FloatingActionButton onClick={() => openAddPanel()} />
		</div>
	)
}
