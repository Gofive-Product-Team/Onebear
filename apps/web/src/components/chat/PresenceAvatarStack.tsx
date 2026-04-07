import { cn } from '@one-bear/ui'
import { Tooltip } from '@/components/ui/Tooltip'

interface Props {
	userIds: string[]
	currentUserId: string
	maxShow?: number
}

// Deterministic color per userId so the same user always gets the same color
const AVATAR_COLORS = [
	'bg-blue-500',
	'bg-green-500',
	'bg-purple-500',
	'bg-orange-500',
	'bg-pink-500',
	'bg-teal-500',
	'bg-red-500',
	'bg-indigo-500',
]

function getColorForId(userId: string): string {
	let hash = 0
	for (let i = 0; i < userId.length; i++) {
		hash = userId.charCodeAt(i) + ((hash << 5) - hash)
	}
	return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length] ?? 'bg-blue-500'
}

function getInitials(userId: string): string {
	// userId may be a display name or an id; take first 2 chars and uppercase
	return userId.slice(0, 2).toUpperCase()
}

export function PresenceAvatarStack({ userIds, currentUserId, maxShow = 3 }: Props) {
	const others = userIds.filter((id) => id !== currentUserId)

	if (others.length === 0) return null

	const visible = others.slice(0, maxShow)
	const overflow = others.length - maxShow

	const tooltipContent = (
		<div className="flex flex-col gap-0.5">
			{others.map((id) => (
				<span key={id}>{id}</span>
			))}
		</div>
	)

	return (
		<Tooltip content={tooltipContent} side="top">
			<div className="flex items-center">
				{visible.map((id, idx) => (
					<span
						key={id}
						className={cn(
							'inline-flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-semibold text-white ring-2 ring-bg-card shrink-0',
							getColorForId(id),
						)}
						style={{ marginLeft: idx === 0 ? 0 : '-8px' }}
						aria-label={id}
					>
						{getInitials(id)}
					</span>
				))}
				{overflow > 0 && (
					<span
						className="inline-flex h-5 items-center justify-center rounded-full bg-gray-400 px-1 text-[9px] font-semibold text-white ring-2 ring-bg-card shrink-0"
						style={{ marginLeft: '-8px' }}
					>
						+{overflow}
					</span>
				)}
			</div>
		</Tooltip>
	)
}
