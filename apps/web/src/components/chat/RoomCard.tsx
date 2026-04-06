import { cn } from '@one-bear/ui'
import type { ChatRoom, ChatState } from '@one-bear/shared-types'
import { Avatar } from '@/components/ui/Avatar'
import { PlatformIcon } from './PlatformIcon'
import { formatRelativeTime } from '@/lib/date'

interface Props {
	room: ChatRoom
	isActive: boolean
	onClick: () => void
}

const stateColors: Record<ChatState, string> = {
	New: 'bg-yellow-400',
	InProgress: 'bg-green-500',
	Closed: 'bg-t3',
	Resolved: 'bg-t3',
}

function formatUnixMs(ts: number | null): string {
	if (!ts) return ''
	return formatRelativeTime(new Date(ts).toISOString())
}

export function RoomCard({ room, isActive, onClick }: Props) {
	const customerName = room.customerName ?? 'Unknown Customer'
	const fallbackInitial = customerName.charAt(0).toUpperCase()
	const stateColor = stateColors[room.state as ChatState] ?? 'bg-t3'

	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				'relative w-full flex items-start gap-3 px-4 py-3 text-left transition-colors rounded-2xl mx-1.5 my-0.5',
				'hover:bg-bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary',
				isActive && 'bg-bg-active hover:bg-bg-active',
			)}
		>
			{isActive && (
				<span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-7 rounded-r-[3px] bg-primary" />
			)}
			{/* Avatar with platform overlay */}
			<div className="relative shrink-0">
				<Avatar src={room.customerAvatar ?? undefined} fallback={fallbackInitial} size="md" />
				<PlatformIcon
					platform={room.platform}
					size="sm"
					className="absolute -bottom-0.5 -right-0.5 ring-2 ring-bg-page"
				/>
			</div>

			{/* Content */}
			<div className="min-w-0 flex-1">
				<div className="flex items-center justify-between gap-2">
					<div className="flex items-center gap-1.5 min-w-0">
						<span className={cn('h-2 w-2 shrink-0 rounded-full', stateColor)} />
						<span className="truncate text-sm font-medium text-t1">{customerName}</span>
					</div>
					<span className="shrink-0 text-xs text-t3">
						{formatUnixMs(room.lastMessageTimestamp)}
					</span>
				</div>

				{/* State label */}
				<p className="text-xs text-t3 truncate mt-0.5">
					{room.state}{room.assignToUserId ? ` · ${room.assignToUserId}` : ''}
				</p>

				{/* Unread badge */}
				<div className="flex items-center justify-between gap-2 mt-0.5">
					<p className="truncate text-sm text-t2">
						{room.platform}
					</p>
					{room.unreadCount > 0 && (
						<span className="shrink-0 inline-flex items-center justify-center h-5 min-w-5 rounded-full bg-primary px-1.5 text-[10px] font-medium text-white">
							{room.unreadCount > 99 ? '99+' : room.unreadCount}
						</span>
					)}
				</div>
			</div>
		</button>
	)
}
