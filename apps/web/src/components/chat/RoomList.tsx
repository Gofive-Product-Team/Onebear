import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { cn } from '@one-bear/ui'
import { useRooms, useBadgeCount } from '@/api/useRooms'
import { useAuthStore } from '@/stores/auth-store'
import { RoomCard } from './RoomCard'
import { Input } from '@/components/ui/Input'
import type { ChatRoom } from '@one-bear/shared-types'

interface Props {
	activeRoomId?: string
}

function SkeletonRoomCard() {
	return (
		<div className="flex items-center gap-3 px-3 py-3 animate-pulse">
			<div className="h-10 w-10 rounded-full bg-gray-200 shrink-0" />
			<div className="flex-1 space-y-2">
				<div className="h-3 w-24 rounded bg-gray-200" />
				<div className="h-2 w-40 rounded bg-gray-200" />
			</div>
			<div className="h-2 w-8 rounded bg-gray-100" />
		</div>
	)
}

function SectionHeader({ label }: { label: string }) {
	return (
		<h3 className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</h3>
	)
}

function groupRooms(rooms: ChatRoom[], currentUserId: string | undefined) {
	const pinnedRooms = rooms
		.filter((r) => r.isPinned)
		.sort((a, b) => (b.pinnedTimestamp ?? 0) - (a.pinnedTimestamp ?? 0))

	const assignedToMe = rooms
		.filter((r) => !r.isPinned && r.assignToUserId === currentUserId && !!r.handoffSource)
		.sort((a, b) => (b.handoffTimestamp ?? 0) - (a.handoffTimestamp ?? 0))

	const allChats = rooms
		.filter((r) => !r.isPinned && !(r.assignToUserId === currentUserId && r.handoffSource))
		.sort((a, b) => (b.lastMessageTimestamp ?? 0) - (a.lastMessageTimestamp ?? 0))

	return { pinnedRooms, assignedToMe, allChats }
}

export function RoomList({ activeRoomId }: Props) {
	const navigate = useNavigate()
	const user = useAuthStore((s) => s.user)
	const companyId = user?.companyId ?? ''

	const [searchQuery, setSearchQuery] = useState('')

	const filters = useMemo(() => {
		if (searchQuery.trim()) return { search: searchQuery.trim() }
		return {}
	}, [searchQuery])

	const { data, isLoading, isError } = useRooms(companyId, filters)
	const { data: badgeData } = useBadgeCount(companyId)

	const rooms = useMemo<ChatRoom[]>(() => {
		if (!data?.data) return []
		return data.data
	}, [data])

	const { pinnedRooms, assignedToMe, allChats } = useMemo(
		() => groupRooms(rooms, user?.userId),
		[rooms, user?.userId],
	)

	const handleRoomClick = useCallback(
		(roomId: string) => {
			navigate({ to: '/chat/$roomId', params: { roomId } })
		},
		[navigate],
	)

	return (
		<div className="flex flex-col h-full bg-bg-page border-r border-border">
			{/* Header with badge count */}
			<div className="shrink-0 px-4 pt-4 pb-2">
				<div className="flex items-center justify-between mb-3">
					<h2 className="text-[1.1rem] font-[800] tracking-[-0.5px] text-t1">Chats</h2>
					{badgeData && badgeData.total > 0 && (
						<span className="inline-flex items-center justify-center h-5 min-w-5 rounded-full bg-primary px-1.5 text-[10px] font-medium text-white">
							{badgeData.total > 99 ? '99+' : badgeData.total}
						</span>
					)}
				</div>
				<Input
					placeholder="Search conversations..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className="h-8 text-sm"
				/>
			</div>

			{/* Room list */}
			<div className="flex-1 overflow-y-auto">
				{isLoading && (
					<div className="flex flex-col gap-1 p-2">
						{Array.from({ length: 8 }).map((_, i) => (
							<SkeletonRoomCard key={i} />
						))}
					</div>
				)}

				{isError && (
					<div className="p-6 text-center">
						<p className="text-sm text-error">Failed to load conversations.</p>
						<p className="text-xs text-t3 mt-1">Please try again later.</p>
					</div>
				)}

				{!isLoading && !isError && rooms.length === 0 && (
					<div className="p-6 text-center">
						<p className="text-sm text-t3">No conversations found.</p>
					</div>
				)}

				{!isLoading && !isError && (
					<>
						{/* Pinned section */}
						{pinnedRooms.length > 0 && (
							<div>
								<SectionHeader label="📌 Pinned" />
								{pinnedRooms.map((room) => (
									<RoomCard
										key={room.id}
										room={room}
										isActive={room.id === activeRoomId}
										onClick={() => handleRoomClick(room.id)}
									/>
								))}
							</div>
						)}

						{/* Assigned to Me section */}
						{assignedToMe.length > 0 && (
							<div className={cn(pinnedRooms.length > 0 && 'mt-1')}>
								<SectionHeader label="🔀 Assigned to Me" />
								{assignedToMe.map((room) => (
									<RoomCard
										key={room.id}
										room={room}
										isActive={room.id === activeRoomId}
										onClick={() => handleRoomClick(room.id)}
									/>
								))}
							</div>
						)}

						{/* All Chats section */}
						<div className={cn((pinnedRooms.length > 0 || assignedToMe.length > 0) && 'mt-1')}>
							<SectionHeader label="💬 All Chats" />
							{allChats.length === 0 && (
								<p className="px-3 py-2 text-xs text-t3">No conversations.</p>
							)}
							{allChats.map((room) => (
								<RoomCard
									key={room.id}
									room={room}
									isActive={room.id === activeRoomId}
									onClick={() => handleRoomClick(room.id)}
								/>
							))}
						</div>
					</>
				)}
			</div>
		</div>
	)
}
