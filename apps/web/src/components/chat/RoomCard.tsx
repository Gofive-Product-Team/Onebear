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
	Closed: 'bg-gray-400',
	Resolved: 'bg-gray-400',
}

export function RoomCard({ room, isActive, onClick }: Props) {
	const customerName = room.customer?.name ?? 'Unknown Customer'
	const fallbackInitial = customerName.charAt(0).toUpperCase()
	const stateColor = stateColors[room.state as ChatState] ?? 'bg-gray-400'

	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				'w-full flex items-start gap-3 px-4 py-3 text-left transition-colors border-b border-gray-100',
				'hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500',
				isActive && 'bg-blue-50 hover:bg-blue-50',
			)}
		>
			{/* Avatar with platform overlay */}
			<div className="relative shrink-0">
				<Avatar src={room.customer?.avatar} fallback={fallbackInitial} size="md" />
				<PlatformIcon
					platform={room.platform}
					size="sm"
					className="absolute -bottom-0.5 -right-0.5 ring-2 ring-white"
				/>
			</div>

			{/* Content */}
			<div className="min-w-0 flex-1">
				<div className="flex items-center justify-between gap-2">
					<div className="flex items-center gap-1.5 min-w-0">
						{/* State indicator dot */}
						<span className={cn('h-2 w-2 shrink-0 rounded-full', stateColor)} />
						<span className="truncate text-sm font-medium text-gray-900">{customerName}</span>
					</div>
					<span className="shrink-0 text-xs text-gray-400">
						{room.lastMessage?.sentAt ? formatRelativeTime(room.lastMessage.sentAt) : ''}
					</span>
				</div>

				{/* Assigned agent */}
				{room.assignedTo && (
					<p className="text-xs text-gray-400 truncate">{room.assignedTo.displayName}</p>
				)}

				{/* Last message + unread badge */}
				<div className="flex items-center justify-between gap-2 mt-0.5">
					<p className="truncate text-sm text-gray-500">
						{room.lastMessage?.content ?? 'No messages yet'}
					</p>
					{room.unreadCount > 0 && (
						<span className="shrink-0 inline-flex items-center justify-center h-5 min-w-5 rounded-full bg-blue-600 px-1.5 text-[10px] font-medium text-white">
							{room.unreadCount > 99 ? '99+' : room.unreadCount}
						</span>
					)}
				</div>
			</div>
		</button>
	)
}
