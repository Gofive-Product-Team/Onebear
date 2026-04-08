import { useState, useCallback } from 'react'
import { cn } from '@one-bear/ui'
import { Pin, ArrowLeftRight } from 'lucide-react'
import type { ChatRoom, ChatState } from '@one-bear/shared-types'
import { Avatar } from '@/components/ui/Avatar'
import { Tooltip } from '@/components/ui/Tooltip'
import { PlatformIcon } from './PlatformIcon'
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

const stateConfig: Record<string, { color: string; label: string }> = {
	New: { color: 'bg-yellow-400', label: 'New' },
	InProgress: { color: 'bg-green-500', label: '' },
	Closed: { color: 'bg-gray-400', label: 'Closed' },
	Resolved: { color: 'bg-gray-400', label: 'Resolved' },
	Spam: { color: 'bg-red-400', label: 'Spam' },
}

export function RoomCard({ room, isActive, onClick }: Props) {
	const user = useAuthStore((s) => s.user)
	const companyId = user?.companyId ?? ''
	const currentUserId = user?.userId ?? ''

	const typingEntry = useTypingStore((s) => s.typingRooms.get(room.id))
	const isTyping = typingEntry !== undefined && Date.now() - typingEntry.timestamp < 5_000

	const customerName = room.customerName ?? 'Unknown'
	const fallbackInitial = customerName.charAt(0).toUpperCase()
	const state = stateConfig[room.state] ?? stateConfig.New

	const unread = room.unreadCount ?? 0

	const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null)
	const pinRoom = usePinRoom(companyId)
	const unpinRoom = useUnpinRoom(companyId)

	const handleContextMenu = useCallback((e: React.MouseEvent) => {
		e.preventDefault()
		setContextMenuPos({ x: e.clientX, y: e.clientY })
	}, [])

	const handlePinToggle = useCallback(() => {
		setContextMenuPos(null)
		if (room.isPinned) unpinRoom.mutate(room.id)
		else pinRoom.mutate(room.id)
	}, [room.isPinned, room.id, pinRoom, unpinRoom])

	return (
		<>
			<button
				type="button"
				onClick={onClick}
				onContextMenu={handleContextMenu}
				className={cn(
					'relative w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors rounded-xl mx-1 my-px',
					'hover:bg-bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary',
					isActive && 'bg-bg-active hover:bg-bg-active',
				)}
			>
				{/* Active indicator */}
				{isActive && (
					<span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-primary" />
				)}

				{/* Avatar + platform */}
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
					{/* Row 1: name + state + timestamp */}
					<div className="flex items-center justify-between gap-1">
						<div className="flex items-center gap-1.5 min-w-0">
							<span className={cn(
								'truncate text-[13px]',
								unread > 0 ? 'font-bold text-t1' : 'font-medium text-t1',
							)}>
								{customerName}
							</span>
							{state.label && (
								<span className={cn(
									'shrink-0 rounded-full px-1.5 py-px text-[9px] font-semibold text-white',
									state.color,
								)}>
									{state.label}
								</span>
							)}
							{!state.label && (
								<span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', state.color)} />
							)}
							{room.isPinned && <Pin className="h-3 w-3 shrink-0 text-amber-400" />}
						</div>
						<div className="flex items-center gap-1.5 shrink-0">
							{room.lastMessageTimestamp && (
								<Tooltip content={formatFullThaiDatetime(room.lastMessageTimestamp)} side="top">
									<span className="text-[11px] text-t3 cursor-default">
										{formatSmartTimestamp(room.lastMessageTimestamp)}
									</span>
								</Tooltip>
							)}
						</div>
					</div>

					{/* Row 2: preview + badges */}
					<div className="flex items-center justify-between gap-1.5 mt-0.5">
						<div className="min-w-0 flex-1">
							{isTyping ? (
								<p className="text-[11px] italic text-primary truncate">typing...</p>
							) : room.handoffSource ? (
								<p className="flex items-center gap-1 text-[11px] text-amber-600 truncate">
									<ArrowLeftRight className="h-3 w-3 shrink-0" />
									{room.handoffSource === 'ai' ? 'From AI' : `From ${room.handoffSourceName ?? '?'}`}
								</p>
							) : (
								<p className={cn(
									'truncate text-[11px]',
									unread > 0 ? 'font-medium text-t2' : 'text-t3',
								)}>
									{room.lastMessage ?? 'No messages yet'}
								</p>
							)}
						</div>

						{/* Right side: presence + unread */}
						<div className="flex items-center gap-1 shrink-0">
							{room.attendedUserIds && room.attendedUserIds.length > 0 && (
								<PresenceAvatarStack
									userIds={room.attendedUserIds}
									currentUserId={currentUserId}
									maxShow={2}
								/>
							)}
							{unread > 0 && (
								<span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
									{unread > 99 ? '99+' : unread}
								</span>
							)}
						</div>
					</div>
				</div>
			</button>

			{/* Context menu */}
			{contextMenuPos && (
				<>
					<div className="fixed inset-0 z-40" onClick={() => setContextMenuPos(null)} onContextMenu={() => setContextMenuPos(null)} />
					<div
						className="fixed z-50 min-w-[120px] rounded-lg border border-border bg-bg-card py-1 shadow-md"
						style={{ top: contextMenuPos.y, left: contextMenuPos.x }}
					>
						<button
							type="button"
							onClick={handlePinToggle}
							className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-t1 hover:bg-bg-hover"
						>
							<Pin className="h-3.5 w-3.5" />
							{room.isPinned ? 'Unpin' : 'Pin'}
						</button>
					</div>
				</>
			)}
		</>
	)
}
