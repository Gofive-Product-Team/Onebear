import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { cn } from '@one-bear/ui'
import { useRooms, useBadgeCount, type RoomFilters } from '@/api/useRooms'
import { useAuthStore } from '@/stores/auth-store'
import { RoomCard } from './RoomCard'
import { Input } from '@/components/ui/Input'

type FilterTab = 'all' | 'mine' | 'unassigned' | 'followup'

const tabs: { key: FilterTab; label: string }[] = [
	{ key: 'all', label: 'All' },
	{ key: 'mine', label: 'Mine' },
	{ key: 'unassigned', label: 'Unassigned' },
	{ key: 'followup', label: 'Follow-up' },
]

interface Props {
	activeRoomId?: string
}

export function RoomList({ activeRoomId }: Props) {
	const navigate = useNavigate()
	const user = useAuthStore((s) => s.user)
	const companyId = user?.companyId ?? ''

	const [activeTab, setActiveTab] = useState<FilterTab>('all')
	const [searchQuery, setSearchQuery] = useState('')

	const filters = useMemo((): RoomFilters => {
		const f: RoomFilters = {}
		if (searchQuery.trim()) f.search = searchQuery.trim()
		if (activeTab === 'mine' && user) f.assignedTo = user.userId
		if (activeTab === 'unassigned') f.assignedTo = 'unassigned'
		if (activeTab === 'followup') f.state = 'followup'
		return f
	}, [activeTab, searchQuery, user])

	const { data, isLoading, isError } = useRooms(companyId, filters)
	const { data: badgeData } = useBadgeCount(companyId)

	const rooms = useMemo(() => {
		if (!data?.data) return []
		return [...data.data].sort((a, b) => {
			const aTime = a.lastMessage?.sentAt ?? a.createdAt
			const bTime = b.lastMessage?.sentAt ?? b.createdAt
			return new Date(bTime).getTime() - new Date(aTime).getTime()
		})
	}, [data])

	const handleRoomClick = useCallback(
		(roomId: string) => {
			navigate({ to: '/chat/$roomId', params: { roomId } })
		},
		[navigate],
	)

	return (
		<div className="flex flex-col h-full bg-white border-r border-gray-200">
			{/* Header with badge count */}
			<div className="shrink-0 px-4 pt-4 pb-2">
				<div className="flex items-center justify-between mb-3">
					<h2 className="text-lg font-semibold text-gray-900">Chats</h2>
					{badgeData && badgeData.unreadCount > 0 && (
						<span className="inline-flex items-center justify-center h-5 min-w-5 rounded-full bg-blue-600 px-1.5 text-[10px] font-medium text-white">
							{badgeData.unreadCount > 99 ? '99+' : badgeData.unreadCount}
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

			{/* Filter tabs */}
			<div className="shrink-0 flex border-b border-gray-200">
				{tabs.map((tab) => (
					<button
						key={tab.key}
						type="button"
						onClick={() => setActiveTab(tab.key)}
						className={cn(
							'flex-1 px-2 py-2 text-xs font-medium transition-colors',
							'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500',
							activeTab === tab.key
								? 'text-blue-600 border-b-2 border-blue-600'
								: 'text-gray-500 hover:text-gray-700',
						)}
					>
						{tab.label}
					</button>
				))}
			</div>

			{/* Room list */}
			<div className="flex-1 overflow-y-auto">
				{isLoading && (
					<div className="flex flex-col gap-1 p-2">
						{Array.from({ length: 8 }).map((_, i) => (
							<div key={i} className="flex items-start gap-3 px-4 py-3 animate-pulse">
								<div className="h-10 w-10 rounded-full bg-gray-200 shrink-0" />
								<div className="flex-1 space-y-2">
									<div className="h-3.5 w-3/4 rounded bg-gray-200" />
									<div className="h-3 w-1/2 rounded bg-gray-200" />
								</div>
							</div>
						))}
					</div>
				)}

				{isError && (
					<div className="p-6 text-center">
						<p className="text-sm text-red-600">Failed to load conversations.</p>
						<p className="text-xs text-gray-400 mt-1">Please try again later.</p>
					</div>
				)}

				{!isLoading && !isError && rooms.length === 0 && (
					<div className="p-6 text-center">
						<p className="text-sm text-gray-500">No conversations found.</p>
					</div>
				)}

				{!isLoading &&
					rooms.map((room) => (
						<RoomCard
							key={room.id}
							room={room}
							isActive={room.id === activeRoomId}
							onClick={() => handleRoomClick(room.id)}
						/>
					))}
			</div>
		</div>
	)
}
