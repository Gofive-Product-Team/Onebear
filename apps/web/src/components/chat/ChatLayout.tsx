import { useState, useCallback } from 'react'
import { cn } from '@one-bear/ui'
import { useSignalR } from '@/hooks/useSignalR'
import { useSignalREvents } from '@/hooks/useSignalREvents'
import { useTyping } from '@/hooks/useTyping'
import { useRoom } from '@/api/useRooms'
import { useAuthStore } from '@/stores/auth-store'
import { RoomList } from './RoomList'
import { MessageList } from './MessageList'
import { Composer } from './Composer'
import { ChatSidebar } from './ChatSidebar'

interface Props {
	roomId?: string
}

export function ChatLayout({ roomId }: Props) {
	const user = useAuthStore((s) => s.user)
	const companyId = user?.companyId ?? ''

	const { connection } = useSignalR()
	useSignalREvents(connection)

	const { typingUsers, sendTyping } = useTyping(connection, roomId ?? null)
	const { data: activeRoom } = useRoom(companyId, roomId ?? null)

	const [sidebarOpen, setSidebarOpen] = useState(true)
	const [mobileView, setMobileView] = useState<'list' | 'chat'>('list')

	const toggleSidebar = useCallback(() => {
		setSidebarOpen((prev) => !prev)
	}, [])

	// Determine mobile view based on roomId
	const effectiveMobileView = roomId ? 'chat' : 'list'

	return (
		<div className="flex h-full overflow-hidden">
			{/* Room list panel - always visible on desktop, conditional on mobile */}
			<div
				className={cn(
					'w-80 shrink-0 border-r border-gray-200',
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
						<div className="shrink-0 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
							<div className="flex items-center gap-3">
								{/* Mobile back button */}
								<button
									type="button"
									onClick={() => setMobileView('list')}
									className="md:hidden text-gray-500 hover:text-gray-700"
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
									<h2 className="text-sm font-semibold text-gray-900">
										{activeRoom?.customerName ?? 'Loading...'}
									</h2>
									{activeRoom?.assignToUserId && (
										<p className="text-xs text-gray-400">
											Assigned to {activeRoom.assignToUserId}
										</p>
									)}
								</div>
							</div>
							<button
								type="button"
								onClick={toggleSidebar}
								className={cn(
									'hidden md:inline-flex items-center justify-center h-8 w-8 rounded-md transition-colors',
									'text-gray-500 hover:text-gray-700 hover:bg-gray-100',
									sidebarOpen && 'bg-gray-100 text-gray-700',
								)}
								title={sidebarOpen ? 'Hide details' : 'Show details'}
							>
								<svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
									<rect x="1" y="2" width="14" height="12" rx="1.5" />
									<line x1="10" y1="2" x2="10" y2="14" />
								</svg>
							</button>
						</div>

						{/* Messages + Composer */}
						<MessageList companyId={companyId} roomId={roomId} typingUsers={typingUsers} />
						<Composer companyId={companyId} roomId={roomId} sendTyping={sendTyping} />
					</>
				) : (
					/* No room selected state */
					<div className="hidden md:flex flex-1 items-center justify-center bg-gray-50">
						<div className="text-center">
							<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
								<svg className="h-8 w-8 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
									<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
								</svg>
							</div>
							<h3 className="text-lg font-medium text-gray-900">Select a conversation</h3>
							<p className="mt-1 text-sm text-gray-500">
								Choose a room from the list to start chatting.
							</p>
						</div>
					</div>
				)}
			</div>

			{/* Right sidebar - details panel */}
			{roomId && activeRoom && sidebarOpen && (
				<div className="hidden md:block w-[300px] shrink-0">
					<ChatSidebar room={activeRoom} connection={connection} />
				</div>
			)}
		</div>
	)
}
