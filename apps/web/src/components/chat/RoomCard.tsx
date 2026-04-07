import { useState, useCallback } from 'react'
import { cn } from '@one-bear/ui'
import { Pin, ArrowLeftRight, AlertTriangle } from 'lucide-react'
import type { ChatRoom, ChatState } from '@one-bear/shared-types'
import { Avatar } from '@/components/ui/Avatar'
import { Tooltip } from '@/components/ui/Tooltip'
import { PlatformIcon } from './PlatformIcon'
import { TimerDisplay } from './TimerDisplay'
import { PresenceAvatarStack } from './PresenceAvatarStack'
import { formatSmartTimestamp, formatFullThaiDatetime } from '@/lib/date'
import { usePinRoom, useUnpinRoom } from '@/api/useRooms'
import { useAuthStore } from '@/stores/auth-store'
import { useTypingStore } from '@/stores/typing-store'

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

function TimestampWithTooltip({ timestamp }: { timestamp: number }) {
	return (
		<Tooltip content={formatFullThaiDatetime(timestamp)} side="top">
			<span className="shrink-0 text-xs text-t3 cursor-default">{formatSmartTimestamp(timestamp)}</span>
		</Tooltip>
	)
}

export function RoomCard({ room, isActive, onClick }: Props) {
	const user = useAuthStore((s) => s.user)
	const companyId = user?.companyId ?? ''
	const currentUserId = user?.userId ?? ''

	const typingEntry = useTypingStore((s) => s.typingRooms.get(room.id))
	const isTyping = typingEntry !== undefined && Date.now() - typingEntry.timestamp < 5_000

	const customerName = room.customerName ?? 'Unknown Customer'
	const fallbackInitial = customerName.charAt(0).toUpperCase()
	const stateColor = stateColors[room.state as ChatState] ?? 'bg-t3'

	const unread = room.unreadCount ?? 0
	const showBadge = unread >= 2
	const showBoldPreview = unread === 1
	const isBold = unread >= 2

	const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null)

	const pinRoom = usePinRoom(companyId)
	const unpinRoom = useUnpinRoom(companyId)

	const handleContextMenu = useCallback((e: React.MouseEvent) => {
		e.preventDefault()
		setContextMenuPos({ x: e.clientX, y: e.clientY })
	}, [])

	const handlePinToggle = useCallback(() => {
		setContextMenuPos(null)
		if (room.isPinned) {
			unpinRoom.mutate(room.id)
		} else {
			pinRoom.mutate(room.id)
		}
	}, [room.isPinned, room.id, pinRoom, unpinRoom])

	const handleCloseMenu = useCallback(() => {
		setContextMenuPos(null)
	}, [])

	return (
		<>
			<button
				type="button"
				onClick={onClick}
				onContextMenu={handleContextMenu}
				className={cn(
					'relative w-full flex items-start gap-3 px-4 py-3 text-left transition-colors rounded-2xl mx-1.5 my-0.5',
					'hover:bg-bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary',
					isActive && 'bg-bg-active hover:bg-bg-active',
					room.assignToUserId ? 'bg-white' : 'bg-gray-50',
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
					{/* Row 1: name + pin icon + timestamp */}
					<div className="flex items-center justify-between gap-2">
						<div className="flex items-center gap-1.5 min-w-0">
							<span className={cn('h-2 w-2 shrink-0 rounded-full', stateColor)} />
							<span className={cn('truncate text-sm', isBold ? 'font-bold text-gray-900' : 'font-medium text-gray-700')}>
								{customerName}
							</span>
							{room.isPinned && (
								<Pin className="h-3.5 w-3.5 shrink-0 text-t3" aria-label="Pinned" />
							)}
						</div>
						{room.lastMessageTimestamp ? (
							<TimestampWithTooltip timestamp={room.lastMessageTimestamp} />
						) : (
							<span className="shrink-0 text-xs text-t3" />
						)}
					</div>

					{/* Row 2: preview + unread badge + presence avatars */}
					<div className="flex items-center justify-between gap-2 mt-0.5">
						<p className={cn('truncate text-xs', showBoldPreview ? 'font-semibold text-gray-900' : 'text-gray-500')}>
							{room.lastMessage ?? 'No messages yet'}
						</p>
						<div className="flex items-center gap-1.5 shrink-0">
							{room.attendedUserIds && room.attendedUserIds.length > 0 && (
								<PresenceAvatarStack
									userIds={room.attendedUserIds}
									currentUserId={currentUserId}
								/>
							)}
							{showBadge && (
								<span className="shrink-0 rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
									{unread > 99 ? '99+' : unread}
								</span>
							)}
						</div>
					</div>

					{/* Row 2b: typing indicator */}
					{isTyping && (
						<p className="mt-0.5 text-xs italic text-blue-500">Admin is typing...</p>
					)}

					{/* Spam suspect indicator */}
					{!room.isSpam && room.spamScore != null && room.spamScore > 0.5 && (
						<div className="flex items-center gap-1.5 mt-1">
							<span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-[10px] font-medium text-red-700">
								<AlertTriangle className="h-3 w-3" /> May be spam
							</span>
						</div>
					)}

					{/* Row 3: handoff badge */}
					{room.handoffSource && (
						<div className="flex items-center gap-1.5 mt-1">
							<span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
								<ArrowLeftRight className="h-3 w-3" />{' '}
								{room.handoffSource === 'ai'
									? 'Handed off from AI'
									: `Handed off from ${room.handoffSourceName ?? room.handoffSource}`}
								{room.handoffTimestamp && (
									<span className="text-amber-600">· {formatSmartTimestamp(room.handoffTimestamp)}</span>
								)}
							</span>
						</div>
					)}

					{/* Row 4: FRT/RT timer */}
					{room.frtStartTimestamp && !room.isResolved && (
						<div className="flex items-center justify-end mt-1">
							{!room.isFrtStopped ? (
								<TimerDisplay
									startTimestamp={room.frtStartTimestamp}
									label="FRT"
								/>
							) : (
								<TimerDisplay
									startTimestamp={room.frtStartTimestamp}
									stoppedAt={room.frtEndTimestamp}
									label="RT"
								/>
							)}
						</div>
					)}
				</div>
			</button>

			{/* Context menu */}
			{contextMenuPos && (
				<>
					<div className="fixed inset-0 z-40" onClick={handleCloseMenu} onContextMenu={handleCloseMenu} />
					<div
						className="fixed z-50 min-w-[140px] rounded-lg border border-border bg-bg-card py-1 shadow-md"
						style={{ top: contextMenuPos.y, left: contextMenuPos.x }}
					>
						<button
							type="button"
							onClick={handlePinToggle}
							className="flex w-full items-center gap-2 px-3 py-2 text-sm text-t1 hover:bg-bg-hover"
						>
							<span className="inline-flex items-center gap-1.5"><Pin className="h-3.5 w-3.5" /> {room.isPinned ? 'Unpin' : 'Pin'}</span>
						</button>
					</div>
				</>
			)}
		</>
	)
}
