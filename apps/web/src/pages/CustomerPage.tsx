import { useState, useMemo, useCallback } from 'react'
import { cn } from '@one-bear/ui'
import type { SocialPlatform } from '@one-bear/shared-types'
import { useCustomers, useCustomer, type Customer } from '@/api/useCustomers'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { ScrollArea } from '@/components/ui/ScrollArea'
import { formatRelativeTime } from '@/lib/date'

const PLATFORMS: Array<{ value: string; label: string }> = [
	{ value: '', label: 'All Platforms' },
	{ value: 'Line', label: 'LINE' },
	{ value: 'Facebook', label: 'Facebook' },
	{ value: 'Instagram', label: 'Instagram' },
	{ value: 'WhatsApp', label: 'WhatsApp' },
	{ value: 'Email', label: 'Email' },
	{ value: 'TikTok', label: 'TikTok' },
	{ value: 'Lazada', label: 'Lazada' },
	{ value: 'Shopee', label: 'Shopee' },
]

function CustomerDetailPanel({
	customerId,
	onClose,
}: {
	customerId: string
	onClose: () => void
}) {
	const { data: customer, isLoading } = useCustomer(customerId)

	if (isLoading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
			</div>
		)
	}

	if (!customer) {
		return (
			<div className="p-6 text-center text-sm text-gray-500">Customer not found</div>
		)
	}

	return (
		<div className="space-y-6">
			<div className="flex items-start justify-between">
				<div className="flex items-center gap-4">
					<Avatar
						src={customer.avatar}
						fallback={customer.name.slice(0, 2)}
						size="lg"
					/>
					<div>
						<h3 className="text-lg font-semibold text-gray-900">{customer.name}</h3>
						{customer.email && (
							<p className="text-sm text-gray-500">{customer.email}</p>
						)}
						{customer.phone && (
							<p className="text-sm text-gray-500">{customer.phone}</p>
						)}
					</div>
				</div>
				<button
					onClick={onClose}
					className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
				>
					<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<div className="flex flex-wrap gap-2">
				<Badge platform={customer.platform}>{customer.platform}</Badge>
				{customer.tags.map((tag) => (
					<Badge key={tag} variant="secondary">
						{tag}
					</Badge>
				))}
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div className="rounded-md bg-gray-50 p-3">
					<p className="text-xs font-medium text-gray-500">Total Rooms</p>
					<p className="text-lg font-semibold text-gray-900">{customer.totalRooms}</p>
				</div>
				<div className="rounded-md bg-gray-50 p-3">
					<p className="text-xs font-medium text-gray-500">Last Contact</p>
					<p className="text-lg font-semibold text-gray-900">
						{customer.lastContactAt
							? formatRelativeTime(customer.lastContactAt)
							: 'Never'}
					</p>
				</div>
			</div>

			{customer.rooms && customer.rooms.length > 0 && (
				<div>
					<h4 className="mb-3 text-sm font-semibold text-gray-900">Chat History</h4>
					<ScrollArea className="max-h-64">
						<div className="space-y-2">
							{customer.rooms.map((room) => (
								<div
									key={room.id}
									className="flex items-center justify-between rounded-md border border-gray-200 p-3"
								>
									<div className="min-w-0 flex-1">
										<div className="flex items-center gap-2">
											<Badge platform={room.platform} className="text-[10px]">
												{room.platform}
											</Badge>
											<span
												className={cn(
													'inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium',
													room.state === 'Resolved'
														? 'bg-green-100 text-green-700'
														: room.state === 'Closed'
															? 'bg-gray-100 text-gray-700'
															: 'bg-blue-100 text-blue-700',
												)}
											>
												{room.state}
											</span>
										</div>
										{room.lastMessage && (
											<p className="mt-1 truncate text-xs text-gray-500">
												{room.lastMessage}
											</p>
										)}
									</div>
									<span className="shrink-0 text-xs text-gray-400">
										{formatRelativeTime(room.createdAt)}
									</span>
								</div>
							))}
						</div>
					</ScrollArea>
				</div>
			)}
		</div>
	)
}

export function CustomerPage() {
	const [search, setSearch] = useState('')
	const [platformFilter, setPlatformFilter] = useState('')
	const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)

	const params = useMemo(() => {
		const p: Record<string, string> = {}
		if (search) p.search = search
		if (platformFilter) p.platform = platformFilter
		return Object.keys(p).length > 0 ? p : undefined
	}, [search, platformFilter])

	const { data: customers, isLoading, isError } = useCustomers(params)

	const handleRowClick = useCallback((customer: Customer) => {
		setSelectedCustomerId((prev) => (prev === customer.id ? null : customer.id))
	}, [])

	return (
		<div className="mx-auto max-w-7xl space-y-6">
			<div>
				<h1 className="text-2xl font-bold text-gray-900">Customers</h1>
				<p className="mt-1 text-sm text-gray-500">Manage and view customer information</p>
			</div>

			{/* Filters */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-end">
				<div className="flex-1">
					<Input
						placeholder="Search by name, email, or phone..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
				</div>
				<select
					value={platformFilter}
					onChange={(e) => setPlatformFilter(e.target.value)}
					className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
				>
					{PLATFORMS.map((p) => (
						<option key={p.value} value={p.value}>
							{p.label}
						</option>
					))}
				</select>
			</div>

			{isError && (
				<div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
					Failed to load customers. Please try again.
				</div>
			)}

			{isLoading && (
				<div className="flex h-64 items-center justify-center">
					<div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
				</div>
			)}

			{!isLoading && !isError && (
				<div className="flex flex-col gap-6 lg:flex-row">
					{/* Desktop Table / Mobile Cards */}
					<div className="flex-1">
						{/* Desktop table */}
						<div className="hidden overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm md:block">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b border-gray-200 bg-gray-50">
										<th className="px-4 py-3 text-left font-medium text-gray-500">Customer</th>
										<th className="px-4 py-3 text-left font-medium text-gray-500">Contact</th>
										<th className="px-4 py-3 text-left font-medium text-gray-500">Platform</th>
										<th className="px-4 py-3 text-right font-medium text-gray-500">Rooms</th>
										<th className="px-4 py-3 text-left font-medium text-gray-500">Last Contact</th>
										<th className="px-4 py-3 text-left font-medium text-gray-500">Tags</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-100">
									{customers?.map((customer) => (
										<tr
											key={customer.id}
											onClick={() => handleRowClick(customer)}
											className={cn(
												'cursor-pointer transition-colors hover:bg-gray-50',
												selectedCustomerId === customer.id && 'bg-blue-50 hover:bg-blue-50',
											)}
										>
											<td className="px-4 py-3">
												<div className="flex items-center gap-3">
													<Avatar
														src={customer.avatar}
														fallback={customer.name.slice(0, 2)}
														size="sm"
													/>
													<span className="font-medium text-gray-900">{customer.name}</span>
												</div>
											</td>
											<td className="px-4 py-3 text-gray-600">
												{customer.email ?? customer.phone ?? '-'}
											</td>
											<td className="px-4 py-3">
												<Badge platform={customer.platform}>{customer.platform}</Badge>
											</td>
											<td className="px-4 py-3 text-right text-gray-600">
												{customer.totalRooms}
											</td>
											<td className="px-4 py-3 text-gray-500">
												{customer.lastContactAt
													? formatRelativeTime(customer.lastContactAt)
													: '-'}
											</td>
											<td className="px-4 py-3">
												<div className="flex flex-wrap gap-1">
													{customer.tags.slice(0, 2).map((tag) => (
														<Badge key={tag} variant="secondary" className="text-[10px]">
															{tag}
														</Badge>
													))}
													{customer.tags.length > 2 && (
														<span className="text-xs text-gray-400">
															+{customer.tags.length - 2}
														</span>
													)}
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
							{(!customers || customers.length === 0) && (
								<div className="py-12 text-center text-sm text-gray-500">
									No customers found
								</div>
							)}
						</div>

						{/* Mobile cards */}
						<div className="space-y-3 md:hidden">
							{customers?.map((customer) => (
								<button
									key={customer.id}
									type="button"
									onClick={() => handleRowClick(customer)}
									className={cn(
										'w-full rounded-lg border bg-white p-4 text-left shadow-sm transition-colors',
										selectedCustomerId === customer.id
											? 'border-blue-300 bg-blue-50'
											: 'border-gray-200 hover:bg-gray-50',
									)}
								>
									<div className="flex items-center gap-3">
										<Avatar
											src={customer.avatar}
											fallback={customer.name.slice(0, 2)}
											size="md"
										/>
										<div className="min-w-0 flex-1">
											<p className="font-medium text-gray-900">{customer.name}</p>
											<p className="truncate text-xs text-gray-500">
												{customer.email ?? customer.phone ?? '-'}
											</p>
										</div>
										<Badge platform={customer.platform} className="shrink-0">
											{customer.platform}
										</Badge>
									</div>
									<div className="mt-3 flex items-center justify-between text-xs text-gray-500">
										<span>{customer.totalRooms} rooms</span>
										<span>
											{customer.lastContactAt
												? formatRelativeTime(customer.lastContactAt)
												: 'No contact'}
										</span>
									</div>
									{customer.tags.length > 0 && (
										<div className="mt-2 flex flex-wrap gap-1">
											{customer.tags.slice(0, 3).map((tag) => (
												<Badge key={tag} variant="secondary" className="text-[10px]">
													{tag}
												</Badge>
											))}
										</div>
									)}
								</button>
							))}
							{(!customers || customers.length === 0) && (
								<div className="rounded-lg border border-gray-200 bg-white py-12 text-center text-sm text-gray-500">
									No customers found
								</div>
							)}
						</div>
					</div>

					{/* Customer Detail Panel */}
					{selectedCustomerId && (
						<div className="w-full shrink-0 rounded-lg border border-gray-200 bg-white p-6 shadow-sm lg:w-96">
							<CustomerDetailPanel
								customerId={selectedCustomerId}
								onClose={() => setSelectedCustomerId(null)}
							/>
						</div>
					)}
				</div>
			)}
		</div>
	)
}
