import { cn } from '@one-bear/ui'
import { Tooltip } from '@/components/ui/Tooltip'
import { useMembers } from '@/api/useMembers'

interface Props {
	userIds: string[]
	currentUserId: string
	maxShow?: number
}

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

export function PresenceAvatarStack({ userIds, currentUserId, maxShow = 3 }: Props) {
	const { data: members } = useMembers()
	// Show all users including self
	if (userIds.length === 0) return null

	// Resolve userId → display name
	function resolveName(userId: string): string {
		const member = members?.find((m) => m.keycloakUserId === userId)
		return member?.displayName ?? member?.email ?? userId
	}

	function getInitials(userId: string): string {
		const name = resolveName(userId)
		const parts = name.trim().split(/\s+/)
		if (parts.length >= 2) {
			return (parts[0][0] + parts[1][0]).toUpperCase()
		}
		return name.slice(0, 2).toUpperCase()
	}

	const visible = userIds.slice(0, maxShow)
	const overflow = userIds.length - maxShow

	const tooltipContent = (
		<div className="flex flex-col gap-0.5">
			{userIds.map((id) => (
				<span key={id}>{resolveName(id)}</span>
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
						aria-label={resolveName(id)}
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
