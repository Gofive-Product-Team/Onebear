import { useState } from 'react'
import { cn } from '@one-bear/ui'
import { MessageCircle, ClipboardList, Hand } from 'lucide-react'
import { Tooltip } from '@/components/ui/Tooltip'
import { SegmentTag } from './SegmentTag'
import { ContactAvatarStack } from './ContactAvatarStack'
import { generateAvatarColor } from './CustomerCard'
import { useCustomerContacts } from '@/api/useCustomers'
import type { CustomerListItem, CustomerTag, SuggestedActionType } from '@/api/useCustomers'

// ─── Priority sort for tags ───────────────────────────────────────────────────

const TAG_PRIORITY: Record<string, number> = {
	hot: 0,
	'at-risk': 1,
	atrisk: 1,
	vip: 2,
	loyal: 3,
	cold: 4,
	new: 5,
}

function sortTags(tags: CustomerTag[]): CustomerTag[] {
	return [...tags].sort((a, b) => {
		const pa = TAG_PRIORITY[a.name.toLowerCase().replace(/\s+/g, '')] ?? 99
		const pb = TAG_PRIORITY[b.name.toLowerCase().replace(/\s+/g, '')] ?? 99
		return pa - pb
	})
}

// ─── Currency formatter ───────────────────────────────────────────────────────

function formatCurrency(value: number): string {
	if (value >= 1_000_000) return `฿${(value / 1_000_000).toFixed(1)}M`
	if (value >= 1_000) return `฿${(value / 1_000).toFixed(1)}K`
	return `฿${value.toFixed(0)}`
}

function formatLastPurchase(timestamp: number | null): string {
	if (timestamp === null) return '—'
	const diffMs = Date.now() - timestamp
	const days = Math.floor(diffMs / 86_400_000)
	if (days === 0) return 'Today'
	if (days === 1) return 'Yesterday'
	if (days < 30) return `${days}d ago`
	const months = Math.floor(days / 30)
	return `${months}mo ago`
}

// ─── Suggested action styles ──────────────────────────────────────────────────

const SUGGESTED_ACTION_STYLES: Record<SuggestedActionType, string> = {
	chat: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200',
	followup: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200',
	welcome: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200',
}

interface SuggestedActionChipProps {
	action: string
	actionType: SuggestedActionType
	onAction: (type: SuggestedActionType) => void
}

function SuggestedActionChip({ action, actionType, onAction }: SuggestedActionChipProps) {
	const style = SUGGESTED_ACTION_STYLES[actionType]
	return (
		<button
			type="button"
			onClick={(e) => {
				e.stopPropagation()
				onAction(actionType)
			}}
			className={cn(
				'w-full rounded-md border px-3 py-1.5 text-left text-xs font-medium transition-colors',
				style,
			)}
		>
			<span className="mr-1.5 inline-flex" aria-hidden="true">
				{actionType === 'chat' ? <MessageCircle className="h-3.5 w-3.5" /> : actionType === 'followup' ? <ClipboardList className="h-3.5 w-3.5" /> : <Hand className="h-3.5 w-3.5" />}
			</span>
			{action}
		</button>
	)
}

// ─── Contacts dropdown ────────────────────────────────────────────────────────

interface ContactsDropdownProps {
	customerId: string
	onClose: () => void
}

function ContactsDropdown({ customerId, onClose }: ContactsDropdownProps) {
	const { data: contacts = [], isLoading } = useCustomerContacts(customerId)

	return (
		<div
			className={cn(
				'absolute right-0 top-full z-20 mt-1 w-56 rounded-xl border border-border bg-bg-card shadow-lg',
				'animate-in fade-in-0 zoom-in-95',
			)}
			onClick={(e) => e.stopPropagation()}
		>
			<div className="border-b border-border px-3 py-2">
				<p className="text-xs font-semibold text-t3">Contacts ({contacts.length})</p>
			</div>
			<div className="max-h-48 overflow-y-auto py-1">
				{isLoading ? (
					<p className="px-3 py-2 text-xs text-t3">Loading…</p>
				) : contacts.length === 0 ? (
					<p className="px-3 py-2 text-xs text-t3">No contacts linked</p>
				) : (
					contacts.map((c) => (
						<div key={c.id} className="flex items-center gap-2 px-3 py-2 hover:bg-bg-hover">
							<div
								className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-white"
								style={{ backgroundColor: generateAvatarColor(c.name) }}
								aria-hidden="true"
							>
								{c.avatar ? (
									<img src={c.avatar} alt={c.name} className="h-6 w-6 rounded-full object-cover" />
								) : (
									c.name.slice(0, 2).toUpperCase()
								)}
							</div>
							<div className="min-w-0">
								<p className="truncate text-xs font-medium text-t1">{c.name}</p>
								{c.email && <p className="truncate text-[10px] text-t3">{c.email}</p>}
							</div>
						</div>
					))
				)}
			</div>
			<div className="border-t border-border px-3 py-2">
				<button
					type="button"
					onClick={onClose}
					className="w-full text-center text-xs text-t3 hover:text-t2"
				>
					Close
				</button>
			</div>
		</div>
	)
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
	customer: CustomerListItem
	onClick: () => void
	onNavigateToProfile?: (id: string) => void
	onSuggestedAction?: (type: SuggestedActionType) => void
}

export function OrganizationCard({ customer, onClick, onNavigateToProfile, onSuggestedAction }: Props) {
	const [showContacts, setShowContacts] = useState(false)
	const initials = customer.name.slice(0, 2).toUpperCase()
	const avatarBg = generateAvatarColor(customer.name)
	const sortedTags = sortTags(customer.tags).slice(0, 2)
	const { data: contacts = [] } = useCustomerContacts(customer.id)

	function handleSuggestedAction(type: SuggestedActionType) {
		onSuggestedAction?.(type)
		if (type === 'chat') {
			onNavigateToProfile?.(customer.id)
		} else {
			onClick()
		}
	}

	return (
		<article
			role="button"
			tabIndex={0}
			onClick={onClick}
			onKeyDown={(e) => e.key === 'Enter' && onClick()}
			className={cn(
				'relative flex cursor-pointer flex-col justify-between gap-1.5 md:gap-2 lg:gap-2.5 rounded-xl border border-border bg-bg-card p-4 shadow-sm',
				'h-[140px] md:h-[180px] lg:h-[200px] overflow-hidden',
				'transition-all hover:border-purple-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
			)}
		>
			{/* Top row: avatar + name + badge */}
			<div className="flex items-start gap-3">
				{/* Rounded-square avatar (rounded-lg, not rounded-full) */}
				<div
					className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-white"
					style={{ backgroundColor: customer.avatar ? undefined : avatarBg }}
					aria-hidden="true"
				>
					{customer.avatar ? (
						<img src={customer.avatar} alt="" className="h-10 w-10 rounded-lg object-cover" />
					) : (
						initials
					)}
				</div>

				{/* Name + channels */}
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-1.5">
						<p className="truncate text-sm font-semibold text-t1">{customer.name}</p>
						<span className="shrink-0 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
							Organization
						</span>
					</div>
					{/* Contact avatar stack */}
					<div className="mt-1.5 flex items-center gap-2">
						<ContactAvatarStack
							contacts={contacts.map((c) => ({ name: c.name, avatar: c.avatar ?? undefined }))}
							max={3}
						/>
						{contacts.length > 0 && (
							<span className="text-[10px] text-t3">{contacts.length} contact{contacts.length !== 1 ? 's' : ''}</span>
						)}
					</div>
				</div>

				{/* Pinned note icon */}
				{customer.pinnedNote && (
					<Tooltip content={customer.pinnedNote} side="left">
						<span className="shrink-0 text-t3 hover:text-t2" aria-label="Has pinned note">
							<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
								<path d="M12 20h9" />
								<path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
							</svg>
						</span>
					</Tooltip>
				)}
			</div>

			{/* Segment tags */}
			{sortedTags.length > 0 && (
				<div className="flex flex-wrap gap-1.5">
					{sortedTags.map((tag) => (
						<SegmentTag key={tag.name} tag={tag} />
					))}
				</div>
			)}

			{/* Last message preview */}
			{customer.lastMessagePreview && (
				<p className="truncate text-xs text-t3">{customer.lastMessagePreview}</p>
			)}

			{/* Stats row */}
			<div className="grid grid-cols-4 gap-1 rounded-lg bg-bg-page px-3 py-2 text-center">
				<div>
					<p className="text-[10px] text-t3">LTV</p>
					<p className="text-xs font-semibold text-t1">{formatCurrency(customer.ltv)}</p>
				</div>
				<div>
					<p className="text-[10px] text-t3">Orders</p>
					<p className="text-xs font-semibold text-t1">{customer.orderCount}</p>
				</div>
				<div>
					<p className="text-[10px] text-t3">AOV</p>
					<p className="text-xs font-semibold text-t1">{formatCurrency(customer.aov)}</p>
				</div>
				<div>
					<p className="text-[10px] text-t3">Last</p>
					<p className="text-xs font-semibold text-t1">{formatLastPurchase(customer.lastOrderTimestamp)}</p>
				</div>
			</div>

			{/* Quick actions: Chat | Contacts | Orders */}
			<div className="flex gap-2">
				<button
					type="button"
					onClick={(e) => e.stopPropagation()}
					className="min-h-[44px] min-w-[44px] flex-1 rounded-md bg-bg-input px-2 py-1 text-xs font-medium text-t2 transition-colors hover:bg-bg-hover"
				>
					Chat
				</button>

				{/* Contacts button with dropdown */}
				<div className="relative flex-1">
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation()
							setShowContacts((prev) => !prev)
						}}
						className="min-h-[44px] w-full rounded-md bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700 transition-colors hover:bg-purple-200"
					>
						Contacts
					</button>
					{showContacts && (
						<ContactsDropdown
							customerId={customer.id}
							onClose={() => setShowContacts(false)}
						/>
					)}
				</div>

				<button
					type="button"
					onClick={(e) => e.stopPropagation()}
					className="min-h-[44px] min-w-[44px] flex-1 rounded-md bg-bg-input px-2 py-1 text-xs font-medium text-t2 transition-colors hover:bg-bg-hover"
				>
					Orders
				</button>
			</div>

			{/* Suggested action chip */}
			{customer.suggestedAction && customer.suggestedActionType && (
				<SuggestedActionChip
					action={customer.suggestedAction}
					actionType={customer.suggestedActionType}
					onAction={handleSuggestedAction}
				/>
			)}
		</article>
	)
}
