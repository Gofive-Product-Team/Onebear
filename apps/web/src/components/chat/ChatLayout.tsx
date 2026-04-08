import { useState, useCallback } from 'react'
import { cn } from '@one-bear/ui'
import { useNavigate } from '@tanstack/react-router'
import { useSignalRContext } from '@/routes/__root'
import { useRoomConnection } from '@/hooks/useRoomConnection'
import { useTyping } from '@/hooks/useTyping'
import { useRoom } from '@/api/useRooms'
import { useMemberName } from '@/api/useMembers'
import { useAuthStore } from '@/stores/auth-store'
import { RoomList } from './RoomList'
import { MessageList } from './MessageList'
import { Composer } from './Composer'
import { DoneButtonBar } from './DoneButtonBar'
import { ChatSidebar } from './ChatSidebar'
import { AiHandoffBanner } from './AiHandoffBanner'
import { SlaWarningBanner } from './SlaWarningBanner'
import { SwipeableMessageArea } from './SwipeableMessageArea'

function AssignedToLabel({ userId }: { userId: string }) {
	const name = useMemberName(userId)
	return (
		<p className="text-xs text-t3">
			Assigned to {name}
		</p>
	)
}

interface Props {
	roomId?: string
}

export function ChatLayout({ roomId }: Props) {
	const navigate = useNavigate()
	const user = useAuthStore((s) => s.user)
	const companyId = user?.companyId ?? ''

	const { connection, isConnected } = useSignalRContext()
	useRoomConnection(connection, roomId ?? null, isConnected)

	// Debug: log SignalR state
	console.log('[ChatLayout] SignalR connected:', isConnected, 'roomId:', roomId)

	const { typingUsers, sendTyping } = useTyping(connection, roomId ?? null)
	const { data: activeRoom } = useRoom(companyId, roomId ?? null)

	const [sidebarOpen, setSidebarOpen] = useState(true)

	const toggleSidebar = useCallback(() => {
		setSidebarOpen((prev) => !prev)
	}, [])

	// Mobile swipe handlers
	const handleMobileBack = useCallback(() => {
		navigate({ to: '/chat' })
	}, [navigate])

	const handleOpenInfo = useCallback(() => {
		setSidebarOpen(true)
	}, [])

	// Determine mobile view based on roomId
	const effectiveMobileView = roomId ? 'chat' : 'list'

	return (
		<div className="flex h-full overflow-hidden">
			{/* Room list panel - always visible on desktop, conditional on mobile */}
			<div
				className={cn(
					'w-[300px] shrink-0 border-r border-border',
					'hidden md:flex md:flex-col',
					effectiveMobileView === 'list' && 'flex flex-col md:flex md:flex-col',
					effectiveMobileView === 'chat' && 'hidden md:flex md:flex-col',
				)}
			>
				<RoomList activeRoomId={roomId} />
			</div>

			{/* Main chat area */}
			<div
				className={cn(
					'flex-1 flex flex-col min-w-0',
					effectiveMobileView === 'list' && 'hidden md:flex',
					effectiveMobileView === 'chat' && 'flex',
				)}
			>
				{roomId ? (
					<>
						{/* Chat header */}
						<div className="shrink-0 flex items-center justify-between border-b border-border bg-bg-card px-4 py-3">
							<div className="flex items-center gap-3">
								{/* SignalR status */}
								<span
									className={cn(
										'h-2 w-2 rounded-full shrink-0',
										isConnected ? 'bg-green-500' : 'bg-red-500',
									)}
									title={`SignalR: ${isConnected ? 'Connected' : 'Disconnected'}`}
								/>
								{/* Mobile back button */}
								<button
									type="button"
									onClick={handleMobileBack}
									className="md:hidden text-t3 hover:text-t1"
									aria-label="Back to inbox"
								>
									<svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
										<path
											fillRule="evenodd"
											d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
											clipRule="evenodd"
										/>
									</svg>
								</button>
								<div>
									<h2 className="text-sm font-semibold text-t1">
										{activeRoom?.customerName ?? 'Loading...'}
									</h2>
									{activeRoom?.assignToUserId && (
										<AssignedToLabel userId={activeRoom.assignToUserId} />
									)}
								</div>
							</div>
							<button
								type="button"
								onClick={toggleSidebar}
								className={cn(
									'hidden md:inline-flex items-center justify-center h-8 w-8 rounded-md transition-colors',
									'text-t3 hover:text-t1 hover:bg-bg-hover',
									sidebarOpen && 'bg-bg-hover text-t1',
								)}
								title={sidebarOpen ? 'Hide details' : 'Show details'}
							>
								<svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
									<rect x="1" y="2" width="14" height="12" rx="1.5" />
									<line x1="10" y1="2" x2="10" y2="14" />
								</svg>
							</button>
						</div>

						{/* AI Handoff banner */}
						{activeRoom && <AiHandoffBanner room={activeRoom} />}

						{/* SLA Warning banner */}
						{activeRoom && (
							<SlaWarningBanner
								frtStartTimestamp={activeRoom.frtStartTimestamp ?? null}
								isFrtStopped={activeRoom.isFrtStopped ?? false}
							/>
						)}

						{/* Messages + Done bar + Composer — wrapped in SwipeableMessageArea on mobile */}
						<SwipeableMessageArea
							onBack={handleMobileBack}
							onOpenInfo={handleOpenInfo}
							enabled={effectiveMobileView === 'chat'}
						>
							<MessageList companyId={companyId} roomId={roomId} typingUsers={typingUsers} viewingUserIds={activeRoom?.attendedUserIds ?? []} />
							{activeRoom && <DoneButtonBar room={activeRoom} />}
							<Composer companyId={companyId} roomId={roomId} platform={activeRoom?.platform ?? ''} sendTyping={sendTyping} />
						</SwipeableMessageArea>
					</>
				) : (
					/* No room selected state */
					<div className="hidden md:flex flex-1 items-center justify-center bg-bg-card">
						<div className="text-center">
							<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-bg-input">
								<svg className="h-8 w-8 text-t3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
									<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
								</svg>
							</div>
							<h3 className="text-lg font-medium text-t1">Select a conversation</h3>
							<p className="mt-1 text-sm text-t2">
								Choose a room from the list to start chatting.
							</p>
						</div>
					</div>
				)}
			</div>

			{/* Right sidebar - details panel */}
			{roomId && activeRoom && sidebarOpen && (
				<div className="hidden md:block w-[320px] shrink-0">
					<ChatSidebar room={activeRoom} connection={connection} />
				</div>
			)}
		</div>
	)
}
