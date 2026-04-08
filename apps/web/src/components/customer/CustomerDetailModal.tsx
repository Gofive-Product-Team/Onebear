import { useCallback, useEffect } from 'react'
import { cn } from '@one-bear/ui'
import { Skeleton } from '@/components/ui/Skeleton'
import { Tabs, TabList, Tab, TabPanel } from '@/components/ui/Tabs'
import { useCustomer } from '@/api/useCustomers'
import { getHighestPriorityTag, SegmentTag } from './SegmentTag'
import { generateAvatarColor } from './CustomerCard'
import { GeneralInfoTab } from './profile/GeneralInfoTab'
import { OrderHistoryTab } from './profile/OrderHistoryTab'
import { ConversationHistoryTab } from './profile/ConversationHistoryTab'
import { ActivityLogTab } from './profile/ActivityLogTab'

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function ModalSkeleton() {
	return (
		<div className="space-y-6 p-6">
			<div className="flex items-center gap-4">
				<Skeleton className="h-14 w-14 rounded-full" />
				<div className="flex-1 space-y-2">
					<Skeleton className="h-5 w-40" />
					<Skeleton className="h-4 w-24" />
				</div>
			</div>
			<div className="flex gap-3">
				{Array.from({ length: 4 }).map((_, i) => (
					<Skeleton key={i} className="h-14 w-28 rounded-lg" />
				))}
			</div>
			<div className="flex gap-2">
				{Array.from({ length: 4 }).map((_, i) => (
					<Skeleton key={i} className="h-9 w-32 rounded-md" />
				))}
			</div>
			<div className="space-y-3">
				<Skeleton className="h-24 rounded-lg" />
				<Skeleton className="h-16 rounded-lg" />
				<Skeleton className="h-32 rounded-lg" />
			</div>
		</div>
	)
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
	customerId: string | null // null = closed
	onClose: () => void
}

export function CustomerDetailModal({ customerId, onClose }: Props) {
	// Fetch customer data when modal is open
	const { data: customer, isLoading, isError } = useCustomer(customerId ?? '')

	// Close on Escape key
	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose()
		},
		[onClose],
	)

	useEffect(() => {
		if (!customerId) return
		document.addEventListener('keydown', handleKeyDown)
		// Prevent body scroll when modal is open
		document.body.style.overflow = 'hidden'
		return () => {
			document.removeEventListener('keydown', handleKeyDown)
			document.body.style.overflow = ''
		}
	}, [customerId, handleKeyDown])

	// Don't render anything when closed
	if (!customerId) return null

	const initials = customer?.name?.slice(0, 2).toUpperCase() ?? ''
	const avatarBg = customer ? generateAvatarColor(customer.name) : undefined
	const topTag = customer ? getHighestPriorityTag(customer.tags) : null

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
			onClick={onClose}
			role="dialog"
			aria-modal="true"
			aria-label="Customer detail"
		>
			{/* Modal panel */}
			<div
				className={cn(
					'relative flex flex-col rounded-2xl border border-border bg-bg-card shadow-2xl',
					'w-[80vw] max-w-5xl h-[90vh]',
					'max-md:w-full max-md:h-full max-md:rounded-none max-md:max-w-none',
					'animate-in fade-in-0 zoom-in-95 duration-200',
				)}
				onClick={(e) => e.stopPropagation()}
			>
				{/* Close button */}
				<button
					type="button"
					onClick={onClose}
					className="absolute right-4 top-4 z-10 rounded-md p-1.5 text-t3 transition-colors hover:bg-bg-hover hover:text-t2"
					aria-label="Close"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="h-5 w-5"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="M18 6 6 18" />
						<path d="m6 6 12 12" />
					</svg>
				</button>

				{/* Loading state */}
				{isLoading && (
					<div className="overflow-y-auto flex-1">
						<ModalSkeleton />
					</div>
				)}

				{/* Error state */}
				{isError && (
					<div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
						<p className="text-sm text-t2">Could not load customer profile.</p>
						<button
							type="button"
							onClick={onClose}
							className="rounded-lg bg-bg-input px-4 py-2 text-sm font-medium text-t1 hover:bg-bg-hover"
						>
							Close
						</button>
					</div>
				)}

				{/* Content */}
				{customer && !isLoading && (
					<div className="flex flex-1 flex-col overflow-hidden">
						{/* Header */}
						<div className="shrink-0 border-b border-border px-6 pb-4 pt-6">
							<div className="flex items-center gap-4 pr-8">
								{/* Avatar */}
								<div
									className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
									style={{ backgroundColor: customer.avatar ? undefined : avatarBg }}
								>
									{customer.avatar ? (
										<img
											src={customer.avatar}
											alt={customer.name}
											className="h-14 w-14 rounded-full object-cover"
										/>
									) : (
										initials
									)}
								</div>

								{/* Name + tag */}
								<div className="min-w-0 flex-1">
									<h2 className="truncate text-xl font-bold text-t1">{customer.name}</h2>
									<div className="mt-1 flex flex-wrap items-center gap-2">
										<span
											className={cn(
												'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
												customer.customerType === 'Organization'
													? 'bg-purple-100 text-purple-700'
													: 'bg-bg-input text-t3',
											)}
										>
											{customer.customerType}
										</span>
										{topTag && <SegmentTag tag={topTag} />}
										{customer.isAtRisk && (
											<span className="inline-flex rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700">
												At-risk
											</span>
										)}
									</div>
								</div>
							</div>

							{/* Quick Stats bar */}
							<div className="mt-4 flex gap-3 overflow-x-auto">
								{[
									{
										label: 'LTV',
										value: `฿${customer.ltv >= 1000 ? (customer.ltv / 1000).toFixed(1) + 'K' : customer.ltv}`,
									},
									{ label: 'Orders', value: String(customer.orderCount) },
									{
										label: 'AOV',
										value: `฿${customer.aov >= 1000 ? (customer.aov / 1000).toFixed(1) + 'K' : customer.aov}`,
									},
									{
										label: 'Tier',
										value: topTag?.name ?? '\u2014',
									},
								].map((stat) => (
									<div
										key={stat.label}
										className="min-w-[80px] shrink-0 rounded-lg border border-border bg-bg-page px-4 py-2.5 text-center"
									>
										<p className="text-[10px] font-medium uppercase tracking-wide text-t3">
											{stat.label}
										</p>
										<p className="text-sm font-bold text-t1">{stat.value}</p>
									</div>
								))}
							</div>
						</div>

						{/* Tabs */}
						<div className="flex-1 overflow-y-auto px-6 pb-6 pt-4">
							<Tabs defaultValue="general">
								<TabList className="w-full sm:w-auto">
									<Tab value="general">General Info</Tab>
									<Tab value="orders">Order History</Tab>
									<Tab value="conversations">Conversations</Tab>
									<Tab value="activity">Activity Log</Tab>
								</TabList>

								<TabPanel value="general" className="mt-6">
									<GeneralInfoTab customer={customer} />
								</TabPanel>

								<TabPanel value="orders" className="mt-6">
									<OrderHistoryTab customer={customer} />
								</TabPanel>

								<TabPanel value="conversations" className="mt-6">
									<ConversationHistoryTab customer={customer} />
								</TabPanel>

								<TabPanel value="activity" className="mt-6">
									<ActivityLogTab customerId={customer.id} />
								</TabPanel>
							</Tabs>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}
