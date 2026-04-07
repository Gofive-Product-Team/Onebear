import { useState } from 'react'
import { cn } from '@one-bear/ui'
import { MessageCircle, ClipboardList, Hand } from 'lucide-react'
import { Tooltip } from '@/components/ui/Tooltip'
import { SegmentTag, getHighestPriorityTag } from './SegmentTag'
import { OrganizationCard } from './OrganizationCard'
import { ChatDraftModal } from './ChatDraftModal'
import type { CustomerListItem, CustomerTag, SuggestedActionType } from '@/api/useCustomers'

// ─── Avatar colour helper ─────────────────────────────────────────────────────

export function generateAvatarColor(name: string): string {
	let hash = 0
	for (let i = 0; i < name.length; i++) {
		hash = name.charCodeAt(i) + ((hash << 5) - hash)
		hash |= 0
	}
	const h = Math.abs(hash) % 360
	return `hsl(${h}, 55%, 45%)`
}

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

// ─── Platform icon dots ───────────────────────────────────────────────────────

const PLATFORM_COLORS: Record<string, string> = {
	line: 'bg-[#06C755]',
	facebook: 'bg-[#1877F2]',
	instagram: 'bg-pink-500',
	whatsapp: 'bg-emerald-500',
	email: 'bg-gray-400',
	tiktok: 'bg-black',
	lazada: 'bg-orange-500',
	shopee: 'bg-red-500',
}

function PlatformDot({ platform }: { platform: string }) {
	const color = PLATFORM_COLORS[platform.toLowerCase()] ?? 'bg-gray-400'
	return (
		<Tooltip content={platform} side="top">
			<span className={cn('h-2.5 w-2.5 rounded-full', color)} aria-label={platform} />
		</Tooltip>
	)
}

// ─── Currency / number formatters ─────────────────────────────────────────────

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

// ─── Suggested action chip ────────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
	customer: CustomerListItem
	onClick: () => void
	onNavigateToProfile?: (id: string) => void
	isSelectionMode?: boolean
	isSelected?: boolean
	onToggleSelect?: (id: string) => void
}

export function CustomerCard({
	customer,
	onClick,
	onNavigateToProfile,
	isSelectionMode = false,
	isSelected = false,
	onToggleSelect,
}: Props) {
	const [showChatDraft, setShowChatDraft] = useState(false)
	const [chatDraftActionType, setChatDraftActionType] = useState<SuggestedActionType>('chat')

	// In selection mode, card click toggles selection instead of opening detail
	function handleCardClick() {
		if (isSelectionMode) {
			onToggleSelect?.(customer.id)
		} else {
			onClick()
		}
	}

	// Route Organization customers to dedicated card
	if (customer.customerType === 'Organization') {
		return (
			<>
				<OrganizationCard
					customer={customer}
					onClick={handleCardClick}
					onNavigateToProfile={onNavigateToProfile}
					onSuggestedAction={(type) => {
						setChatDraftActionType(type)
						setShowChatDraft(true)
					}}
				/>
				{showChatDraft && (
					<ChatDraftModal
						customer={customer}
						actionType={chatDraftActionType}
						onClose={() => setShowChatDraft(false)}
					/>
				)}
			</>
		)
	}

	const initials = customer.name.slice(0, 2).toUpperCase()
	const avatarBg = generateAvatarColor(customer.name)
	const topTag = getHighestPriorityTag(customer.tags)

	const hasHotTag = customer.tags.some((t) => t.name.toLowerCase() === 'hot')
	const hasAtRisk = customer.tags.some(
		(t) => t.name.toLowerCase() === 'at-risk' || t.name.toLowerCase() === 'atrisk',
	)
	const isAtRisk = customer.isAtRisk && customer.daysSinceLastPurchase !== null

	function handleSuggestedAction(type: SuggestedActionType) {
		setChatDraftActionType(type)
		setShowChatDraft(true)
	}

	return (
		<>
		<article
			role="button"
			tabIndex={0}
			onClick={handleCardClick}
			onKeyDown={(e) => e.key === 'Enter' && handleCardClick()}
			aria-selected={isSelectionMode ? isSelected : undefined}
			className={cn(
				'relative flex cursor-pointer flex-col justify-between gap-1.5 md:gap-2 lg:gap-2.5 rounded-xl border bg-bg-card p-4 shadow-sm',
				'h-[140px] md:h-[180px] lg:h-[200px] overflow-hidden',
				'transition-all hover:border-blue-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
				isSelected ? 'border-primary ring-2 ring-primary/30' : 'border-border',
			)}
		>
			{/* Selection checkbox — top-left, visible in selection mode */}
			{isSelectionMode && (
				<span
					className={cn(
						'absolute left-3 top-3 flex h-5 w-5 items-center justify-center rounded border-2 transition-colors',
						isSelected ? 'border-primary bg-primary' : 'border-border-input bg-bg-input',
					)}
					aria-hidden="true"
				>
					{isSelected && (
						<svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
							<path d="m5 12 5 5L20 7" />
						</svg>
					)}
				</span>
			)}
			{/* Top row: avatar + name + tag + channels + pinned note icon */}
			<div className={cn('flex items-start gap-3', isSelectionMode && 'pl-7')}>
				{/* Avatar — responsive sizing */}
				<div
					className="flex h-10 w-10 lg:h-14 lg:w-14 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
					style={{ backgroundColor: customer.avatar ? undefined : avatarBg }}
					aria-hidden="true"
				>
					{customer.avatar ? (
						<img src={customer.avatar} alt="" className="h-10 w-10 lg:h-14 lg:w-14 rounded-full object-cover" />
					) : (
						initials
					)}
				</div>

				{/* Name + tag + channels */}
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-1.5">
						<p className="truncate text-sm font-semibold text-t1">{customer.name}</p>
						{topTag && <SegmentTag tag={topTag} />}
					</div>
					{customer.channels.length > 0 && (
						<div className="mt-1 flex items-center gap-1">
							{customer.channels.slice(0, 5).map((ch, i) => (
								<PlatformDot key={`${ch.platform}-${i}`} platform={ch.platform} />
							))}
						</div>
					)}
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

			{/* Last message preview — desktop only */}
			{customer.lastMessagePreview && (
				<p className="hidden lg:block truncate text-xs text-t3">{customer.lastMessagePreview}</p>
			)}

			{/* Stats row — 2 cols mobile, 4 cols tablet/desktop */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-1 rounded-lg bg-bg-page px-3 py-2 text-center">
				<div>
					<p className="text-[10px] text-t3">LTV</p>
					<p className="text-xs font-semibold text-t1">{formatCurrency(customer.ltv)}</p>
				</div>
				<div className="hidden md:block">
					<p className="text-[10px] text-t3">Orders</p>
					<p className="text-xs font-semibold text-t1">{customer.orderCount}</p>
				</div>
				<div className="hidden md:block">
					<p className="text-[10px] text-t3">AOV</p>
					<p className="text-xs font-semibold text-t1">{formatCurrency(customer.aov)}</p>
				</div>
				<div>
					<p className="text-[10px] text-t3">Last</p>
					<p className="flex items-center justify-center gap-1 text-xs font-semibold text-t1">
						{formatLastPurchase(customer.lastOrderTimestamp)}
						{isAtRisk && (
							<span className="inline-block h-2 w-2 rounded-full bg-red-500" title={`No purchase for ${customer.daysSinceLastPurchase} days`} />
						)}
					</p>
				</div>
			</div>

			{/* Quick actions */}
			<div className="flex gap-2">
				<button
					type="button"
					onClick={(e) => e.stopPropagation()}
					className="min-h-[44px] min-w-[44px] flex-1 rounded-md bg-bg-input px-2 py-1 text-xs font-medium text-t2 transition-colors hover:bg-bg-hover"
				>
					Chat
				</button>
				<button
					type="button"
					onClick={(e) => e.stopPropagation()}
					className="min-h-[44px] min-w-[44px] flex-1 rounded-md bg-bg-input px-2 py-1 text-xs font-medium text-t2 transition-colors hover:bg-bg-hover"
				>
					Orders
				</button>
				<button
					type="button"
					onClick={(e) => e.stopPropagation()}
					className={cn(
						'min-h-[44px] min-w-[44px] flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors',
						hasHotTag
							? 'bg-green-100 text-green-700 hover:bg-green-200'
							: hasAtRisk
								? 'bg-red-100 text-red-700 hover:bg-red-200'
								: 'bg-bg-input text-t2 hover:bg-bg-hover',
					)}
				>
					{hasHotTag ? 'Chat Now' : 'Follow-up'}
				</button>
			</div>

			{/* Suggested action chip — hidden on mobile */}
			{customer.suggestedAction && customer.suggestedActionType && (
				<div className="hidden md:block">
					<SuggestedActionChip
						action={customer.suggestedAction}
						actionType={customer.suggestedActionType}
						onAction={handleSuggestedAction}
					/>
				</div>
			)}
		</article>

		{showChatDraft && (
			<ChatDraftModal
				customer={customer}
				actionType={chatDraftActionType}
				onClose={() => setShowChatDraft(false)}
			/>
		)}
	</>
	)
}
