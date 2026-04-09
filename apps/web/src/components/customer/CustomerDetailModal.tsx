import { useCallback, useEffect, useState } from 'react'
import { cn } from '@one-bear/ui'
import { Pencil } from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'
import { Tabs, TabList, Tab, TabPanel } from '@/components/ui/Tabs'
import { useCustomer, useUpdateCustomer } from '@/api/useCustomers'
import { getHighestPriorityTag, SegmentTag } from './SegmentTag'
import { generateAvatarColor } from './CustomerCard'
import { GeneralInfoTab } from './profile/GeneralInfoTab'
import { OrderHistoryTab } from './profile/OrderHistoryTab'
import { ConversationHistoryTab } from './profile/ConversationHistoryTab'
import { ActivityLogTab } from './profile/ActivityLogTab'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtCurrency(value: number): string {
	if (value >= 1_000_000) return `฿${(value / 1_000_000).toFixed(1)}M`
	if (value >= 1_000) return `฿${(value / 1_000).toFixed(1)}K`
	return `฿${value.toFixed(0)}`
}

function fmtDate(ts: number | null | undefined): string {
	if (!ts) return '—'
	return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

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

// ─── Lead status config (mirrored from CustomerPage) ─────────────────────────

const LEAD_STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
	'New':            { label: 'New',           color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-400' },
	'Contacted':      { label: 'Contacted',     color: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-500'   },
	'Interested':     { label: 'Interested',    color: 'bg-green-100 text-green-700',  dot: 'bg-green-500'  },
	'Followed-up':    { label: 'Followed-up',   color: 'bg-teal-100 text-teal-700',    dot: 'bg-teal-500'   },
	'Not Interested': { label: 'Not Interested',color: 'bg-gray-100 text-gray-500',    dot: 'bg-gray-400'   },
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
	customerId: string | null // null = closed
	onClose: () => void
	/** When provided, skip the API fetch and use this data directly (e.g. for Leads) */
	initialData?: import('@/api/useCustomers').CustomerDetail
	/** If this is a lead, pass the current status to show the Lead banner */
	leadStatus?: string
	/** Called when admin converts lead → customer */
	onConvertLead?: (id: string) => void
}

export function CustomerDetailModal({ customerId, onClose, initialData, leadStatus, onConvertLead }: Props) {
	// If initialData is provided (e.g. for Leads), skip the API fetch
	const { data: fetched, isLoading, isError } = useCustomer((!initialData && customerId) ? customerId : '')
	const customer = initialData ?? fetched
	const updateCustomer = useUpdateCustomer()
	const [isEditing, setIsEditing] = useState(false)
	const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', customerType: '' })
	const [localLeadStatus, setLocalLeadStatus] = useState(leadStatus ?? '')
	const [converting, setConverting] = useState(false)

	useEffect(() => {
		if (customer && isEditing) {
			setEditForm({
				name: customer.name ?? '',
				email: customer.email ?? '',
				phone: customer.phone ?? '',
				customerType: customer.customerType ?? 'Individual',
			})
		}
	}, [customer, isEditing])

	function handleSaveEdit() {
		if (!customer) return
		updateCustomer.mutate(
			{ id: customer.id, body: { name: editForm.name, email: editForm.email || undefined, phone: editForm.phone || undefined, customerType: editForm.customerType } },
			{ onSuccess: () => setIsEditing(false) },
		)
	}

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
	if (!customerId && !initialData) return null

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

				{/* Loading state — only shown when fetching from API (not when initialData supplied) */}
				{!initialData && isLoading && (
					<div className="overflow-y-auto flex-1">
						<ModalSkeleton />
					</div>
				)}

				{/* Error state */}
				{!initialData && isError && (
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

								{/* Name + tag + Edit button */}
								<div className="min-w-0 flex-1">
									<div className="flex items-center gap-2">
										<h2 className="truncate text-xl font-bold text-t1">{customer.name}</h2>
										{!isEditing && (
											<button
												type="button"
												onClick={() => setIsEditing(true)}
												className="shrink-0 rounded-md p-1.5 text-t3 hover:bg-bg-hover hover:text-primary transition-colors"
												title="Edit customer"
											>
												<Pencil className="h-4 w-4" />
											</button>
										)}
									</div>
									<div className="mt-1 flex flex-wrap items-center gap-2">
										<span
											className={cn(
												'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
												customer.customerType === 'Organization'
													? 'bg-purple-100 text-purple-700'
													: customer.customerType === 'Lead'
													? 'bg-amber-100 text-amber-700'
													: 'bg-bg-input text-t3',
											)}
										>
											{customer.customerType === 'Lead' ? '🎯 ผู้สนใจ' : customer.customerType}
										</span>
										{/* Lead status badge */}
										{customer.customerType === 'Lead' && localLeadStatus && (() => {
											const cfg = LEAD_STATUS_CONFIG[localLeadStatus] ?? LEAD_STATUS_CONFIG['New']
											return (
												<span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium', cfg.color)}>
													<span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
													{cfg.label}
												</span>
											)
										})()}
										{topTag && <SegmentTag tag={topTag} />}
										{customer.isAtRisk && (
											<span className="inline-flex rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700">
												At-risk
											</span>
										)}
									</div>
								</div>
							</div>

							{/* Edit form */}
							{isEditing && (
								<div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
									<div className="grid grid-cols-2 gap-3">
										<div>
											<label className="text-xs font-medium text-t2">Name</label>
											<input
												value={editForm.name}
												onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
												className="mt-1 w-full rounded-md border border-border bg-bg-input px-3 py-1.5 text-sm"
											/>
										</div>
										<div>
											<label className="text-xs font-medium text-t2">Type</label>
											<select
												value={editForm.customerType}
												onChange={(e) => setEditForm({ ...editForm, customerType: e.target.value })}
												className="mt-1 w-full rounded-md border border-border bg-bg-input px-3 py-1.5 text-sm"
											>
												<option value="Individual">Individual</option>
												<option value="Organization">Organization</option>
											</select>
										</div>
									</div>
									<div className="grid grid-cols-2 gap-3">
										<div>
											<label className="text-xs font-medium text-t2">Email</label>
											<input
												value={editForm.email}
												onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
												placeholder="customer@example.com"
												className="mt-1 w-full rounded-md border border-border bg-bg-input px-3 py-1.5 text-sm"
											/>
										</div>
										<div>
											<label className="text-xs font-medium text-t2">Phone</label>
											<input
												value={editForm.phone}
												onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
												placeholder="08x-xxx-xxxx"
												className="mt-1 w-full rounded-md border border-border bg-bg-input px-3 py-1.5 text-sm"
											/>
										</div>
									</div>
									<div className="flex gap-2 justify-end">
										<button
											type="button"
											onClick={() => setIsEditing(false)}
											className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-t2 hover:bg-bg-hover"
										>
											Cancel
										</button>
										<button
											type="button"
											onClick={handleSaveEdit}
											disabled={!editForm.name.trim() || updateCustomer.isPending}
											className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-50"
										>
											{updateCustomer.isPending ? 'Saving...' : 'Save'}
										</button>
									</div>
								</div>
							)}

							{/* Lead actions — only shown for Lead type */}
							{customer.customerType === 'Lead' && (
								<div className="mt-4 space-y-3">
									{/* Status chips */}
									<div>
										<div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-t3">สถานะผู้สนใจ</div>
										<div className="flex flex-wrap gap-1.5">
											{Object.keys(LEAD_STATUS_CONFIG).map((s) => (
												<button
													key={s}
													type="button"
													onClick={() => setLocalLeadStatus(s)}
													className={cn(
														'rounded-full px-2.5 py-1 text-xs font-medium border transition-colors',
														localLeadStatus === s
															? 'bg-primary text-white border-primary'
															: 'border-border text-t2 hover:border-primary hover:text-primary bg-bg-input',
													)}
												>
													{s}
												</button>
											))}
										</div>
									</div>
									{/* Convert button */}
									<button
										type="button"
										disabled={converting}
										onClick={() => {
											if (!confirm(`ย้าย "${customer.name}" เป็นลูกค้า (Convert)?`)) return
											setConverting(true)
											setTimeout(() => {
												setConverting(false)
												onConvertLead?.(customer.id)
												onClose()
											}, 800)
										}}
										className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary bg-primary/5 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
									>
										{converting ? '⏳ กำลังย้าย...' : '✅ Convert เป็นลูกค้า'}
									</button>
								</div>
							)}

							{/* CRM Stats */}
							<div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
								{[
									{ label: 'LTV', value: fmtCurrency(customer.ltv) },
									{ label: 'AOV', value: fmtCurrency(customer.aov) },
									{ label: 'คำสั่งซื้อ', value: String(customer.orderCount) },
									{ label: 'ซื้อครั้งแรก', value: fmtDate(null) },
									{ label: 'ซื้อล่าสุด', value: fmtDate(customer.lastOrderTimestamp) },
									{ label: 'สมัครเมื่อ', value: fmtDate(customer.createdTimestamp) },
								].map((stat) => (
									<div
										key={stat.label}
										className="rounded-lg border border-border bg-bg-page px-2 py-2.5 text-center"
									>
										<p className="text-[10px] font-medium text-t3 truncate">{stat.label}</p>
										<p className="mt-0.5 text-sm font-bold text-t1 truncate">{stat.value}</p>
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
