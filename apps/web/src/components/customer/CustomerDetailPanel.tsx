import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { cn } from '@one-bear/ui'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { Tooltip } from '@/components/ui/Tooltip'
import { useCustomer } from '@/api/useCustomers'
import { CustomerEditDialog } from './CustomerEditDialog'
import { PinnedNoteEditor } from './PinnedNoteEditor'
import { SegmentTag } from './SegmentTag'
import { generateAvatarColor } from './CustomerCard'

// ─── Stat tile ────────────────────────────────────────────────────────────────

function StatTile({ label, value }: { label: string; value: string | number }) {
	return (
		<div className="rounded-lg bg-bg-page p-3 text-center">
			<p className="text-xs text-t3">{label}</p>
			<p className="mt-0.5 text-base font-semibold text-t1">{value}</p>
		</div>
	)
}

function formatCurrency(value: number): string {
	if (value >= 1_000_000) return `฿${(value / 1_000_000).toFixed(1)}M`
	if (value >= 1_000) return `฿${(value / 1_000).toFixed(1)}K`
	return `฿${value.toFixed(0)}`
}

function formatTimestamp(ts: number | null): string {
	if (ts === null) return '—'
	return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function DetailSkeleton() {
	return (
		<div className="space-y-4 p-6">
			<div className="flex items-center gap-4">
				<Skeleton className="h-12 w-12 rounded-full" />
				<div className="flex-1 space-y-2">
					<Skeleton className="h-4 w-32" />
					<Skeleton className="h-3 w-48" />
				</div>
			</div>
			<div className="flex gap-2">
				<Skeleton className="h-6 w-16 rounded-full" />
				<Skeleton className="h-6 w-16 rounded-full" />
			</div>
			<div className="grid grid-cols-2 gap-3">
				<Skeleton className="h-16 rounded-lg" />
				<Skeleton className="h-16 rounded-lg" />
				<Skeleton className="h-16 rounded-lg" />
				<Skeleton className="h-16 rounded-lg" />
			</div>
		</div>
	)
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
	customerId: string
	onClose: () => void
}

export function CustomerDetailPanel({ customerId, onClose }: Props) {
	const { data: customer, isLoading, isError } = useCustomer(customerId)
	const [showEdit, setShowEdit] = useState(false)
	const [showNoteEditor, setShowNoteEditor] = useState(false)
	const navigate = useNavigate()

	if (isLoading) return <DetailSkeleton />

	if (isError || !customer) {
		return (
			<div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
				<p className="text-sm text-t2">Could not load customer details.</p>
				<Button variant="outline" size="sm" onClick={onClose}>
					Close
				</Button>
			</div>
		)
	}

	const initials = customer.name.slice(0, 2).toUpperCase()
	const avatarBg = generateAvatarColor(customer.name)

	return (
		<>
			<div className="flex flex-col gap-5 p-6">
				{/* Header: avatar + name + close */}
				<div className="flex items-start justify-between gap-3">
					<div className="flex items-center gap-3">
						<div
							className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-bold text-white"
							style={{ backgroundColor: customer.avatar ? undefined : avatarBg }}
						>
							{customer.avatar ? (
								<img src={customer.avatar} alt="" className="h-12 w-12 rounded-full object-cover" />
							) : (
								initials
							)}
						</div>
						<div className="min-w-0">
							<h3 className="truncate text-base font-semibold text-t1">{customer.name}</h3>
							{customer.email && <p className="truncate text-xs text-t2">{customer.email}</p>}
							{customer.phone && <p className="text-xs text-t2">{customer.phone}</p>}
							<span
								className={cn(
									'mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium',
									customer.customerType === 'Organization'
										? 'bg-purple-100 text-purple-700'
										: 'bg-bg-input text-t3',
								)}
							>
								{customer.customerType}
							</span>
						</div>
					</div>
					<div className="flex items-center gap-1 shrink-0">
						<Tooltip content="Edit customer" side="bottom">
							<button
								type="button"
								onClick={() => setShowEdit(true)}
								className="rounded-md p-1.5 text-t3 hover:bg-bg-hover hover:text-t2"
								aria-label="Edit customer"
							>
								<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
									<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
									<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
								</svg>
							</button>
						</Tooltip>
						<button
							type="button"
							onClick={onClose}
							className="rounded-md p-1.5 text-t3 hover:bg-bg-hover hover:text-t2"
							aria-label="Close"
						>
							<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
								<path d="M18 6 6 18" />
								<path d="m6 6 12 12" />
							</svg>
						</button>
					</div>
				</div>

				{/* Pinned note */}
				{!showNoteEditor && (
					<div
						className={cn(
							'rounded-lg border p-3',
							customer.pinnedNote ? 'border-amber-200 bg-amber-50' : 'border-dashed border-border-input',
						)}
					>
						{customer.pinnedNote ? (
							<div className="flex items-start justify-between gap-2">
								<div className="min-w-0">
									<p className="text-[10px] font-medium uppercase tracking-wide text-t3">Pinned Note</p>
									<p className="mt-0.5 text-sm text-t1">{customer.pinnedNote}</p>
									{customer.pinnedNoteBy && (
										<p className="mt-1 text-[10px] text-t3">by {customer.pinnedNoteBy}</p>
									)}
								</div>
								<button
									type="button"
									onClick={() => setShowNoteEditor(true)}
									className="shrink-0 rounded p-1 text-t3 hover:text-t2"
									aria-label="Edit pinned note"
								>
									<svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
										<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
										<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
									</svg>
								</button>
							</div>
						) : (
							<button
								type="button"
								onClick={() => setShowNoteEditor(true)}
								className="flex w-full items-center gap-2 text-sm text-t3 hover:text-t2"
							>
								<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
									<path d="M12 5v14" />
									<path d="M5 12h14" />
								</svg>
								Add pinned note
							</button>
						)}
					</div>
				)}

				{/* Note editor (inline) */}
				{showNoteEditor && (
					<div className="rounded-lg border border-border bg-bg-card p-4">
						<PinnedNoteEditor
							customerId={customer.id}
							currentNote={customer.pinnedNote}
							onClose={() => setShowNoteEditor(false)}
						/>
					</div>
				)}

				{/* Segment tags */}
				{customer.tags.length > 0 && (
					<div>
						<p className="mb-2 text-xs font-medium text-t2">Segments</p>
						<div className="flex flex-wrap gap-1.5">
							{customer.tags.map((tag) => (
								<SegmentTag key={tag.name} tag={tag} />
							))}
						</div>
					</div>
				)}

				{/* Channels */}
				{customer.channels.length > 0 && (
					<div>
						<p className="mb-2 text-xs font-medium text-t2">Channels</p>
						<div className="flex flex-wrap gap-2">
							{customer.channels.map((ch, i) => (
								<Badge key={`${ch.platform}-${i}`} platform={ch.platform}>
									{ch.displayName ?? ch.platform}
								</Badge>
							))}
						</div>
					</div>
				)}

				{/* Stats */}
				<div>
					<p className="mb-2 text-xs font-medium text-t2">CRM Stats</p>
					<div className="grid grid-cols-2 gap-2">
						<StatTile label="Lifetime Value" value={formatCurrency(customer.ltv)} />
						<StatTile label="Orders" value={customer.orderCount} />
						<StatTile label="Avg Order Value" value={formatCurrency(customer.aov)} />
						<StatTile label="Last Order" value={formatTimestamp(customer.lastOrderTimestamp)} />
					</div>
				</div>

				{/* At-risk banner */}
				{customer.isAtRisk && customer.daysSinceLastPurchase !== null && (
					<div className="rounded-md bg-orange-50 px-4 py-2.5 text-sm font-medium text-orange-700">
						No purchase for {customer.daysSinceLastPurchase} days
					</div>
				)}

				{/* Extra detail fields */}
				<div className="space-y-2 text-sm">
					{customer.email && (
						<div className="flex items-center justify-between">
							<span className="text-t3">Email</span>
							<span className="text-t1">{customer.email}</span>
						</div>
					)}
					{customer.phone && (
						<div className="flex items-center justify-between">
							<span className="text-t3">Phone</span>
							<span className="text-t1">{customer.phone}</span>
						</div>
					)}
					{customer.nationalId && (
						<div className="flex items-center justify-between">
							<span className="text-t3">National ID</span>
							<span className="text-t1">{customer.nationalId}</span>
						</div>
					)}
					{customer.taxId && (
						<div className="flex items-center justify-between">
							<span className="text-t3">Tax ID</span>
							<span className="text-t1">{customer.taxId}</span>
						</div>
					)}
					<div className="flex items-center justify-between">
						<span className="text-t3">Created</span>
						<span className="text-t1">{formatTimestamp(customer.createdTimestamp)}</span>
					</div>
				</div>
			</div>

			{/* View full profile link */}
			<div className="border-t border-border px-6 py-4">
				<Button
					variant="outline"
					className="w-full"
					onClick={() => {
						onClose()
						navigate({ to: '/customer/$customerId', params: { customerId: customer.id } })
					}}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="mr-2 h-4 w-4"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
						<polyline points="15 3 21 3 21 9" />
						<line x1="10" y1="14" x2="21" y2="3" />
					</svg>
					View Full Profile
				</Button>
			</div>

			{/* Edit dialog */}
			{showEdit && <CustomerEditDialog customer={customer} onClose={() => setShowEdit(false)} />}
		</>
	)
}
