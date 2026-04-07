import { cn } from '@one-bear/ui'
import { Tooltip } from '@/components/ui/Tooltip'
import { SegmentTag } from './SegmentTag'
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
			<span className="mr-1.5" aria-hidden="true">
				{actionType === 'chat' ? '💬' : actionType === 'followup' ? '📋' : '👋'}
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
}

export function CustomerCard({ customer, onClick, onNavigateToProfile }: Props) {
	const initials = customer.name.slice(0, 2).toUpperCase()
	const avatarBg = generateAvatarColor(customer.name)
	const sortedTags = sortTags(customer.tags).slice(0, 2)

	const hasHotTag = customer.tags.some((t) => t.name.toLowerCase() === 'hot')
	const hasAtRisk = customer.tags.some(
		(t) => t.name.toLowerCase() === 'at-risk' || t.name.toLowerCase() === 'atrisk',
	)

	function handleSuggestedAction(type: SuggestedActionType) {
		if (type === 'chat') {
			// Navigate to chat — if handler provided, use it, otherwise let parent handle
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
				'relative flex cursor-pointer flex-col gap-3 rounded-xl border border-border bg-bg-card p-4 shadow-sm',
				'transition-all hover:border-blue-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
			)}
		>
			{/* Top row: avatar + name + channels + pinned note icon */}
			<div className="flex items-start gap-3">
				{/* Avatar */}
				<div
					className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
					style={{ backgroundColor: customer.avatar ? undefined : avatarBg }}
					aria-hidden="true"
				>
					{customer.avatar ? (
						<img src={customer.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
					) : (
						initials
					)}
				</div>

				{/* Name + channels */}
				<div className="min-w-0 flex-1">
					<p className="truncate text-sm font-semibold text-t1">{customer.name}</p>
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

			{/* At-risk banner */}
			{customer.isAtRisk && customer.daysSinceLastPurchase !== null && (
				<div className="rounded-md bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700">
					No purchase for {customer.daysSinceLastPurchase} days
				</div>
			)}

			{/* Quick actions */}
			<div className="flex gap-2">
				<button
					type="button"
					onClick={(e) => e.stopPropagation()}
					className="min-h-[28px] min-w-[44px] flex-1 rounded-md bg-bg-input px-2 py-1 text-xs font-medium text-t2 transition-colors hover:bg-bg-hover"
				>
					Chat
				</button>
				<button
					type="button"
					onClick={(e) => e.stopPropagation()}
					className="min-h-[28px] min-w-[44px] flex-1 rounded-md bg-bg-input px-2 py-1 text-xs font-medium text-t2 transition-colors hover:bg-bg-hover"
				>
					Orders
				</button>
				<button
					type="button"
					onClick={(e) => e.stopPropagation()}
					className={cn(
						'min-h-[28px] min-w-[44px] flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors',
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
