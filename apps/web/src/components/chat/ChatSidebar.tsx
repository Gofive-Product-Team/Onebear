import { cn } from '@one-bear/ui'
import type { ChatRoom, ChatState } from '@one-bear/shared-types'
import { useResolveRoom, useCloseRoom } from '@/api/useRooms'
import { usePresence } from '@/hooks/usePresence'
import { useAuthStore } from '@/stores/auth-store'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PlatformIcon } from './PlatformIcon'
import type { HubConnection } from '@microsoft/signalr'

interface Props {
	room: ChatRoom
	connection: HubConnection | null
}

const stateLabels: Record<ChatState, { label: string; color: string }> = {
	New: { label: 'New', color: 'bg-yellow-400' },
	InProgress: { label: 'In Progress', color: 'bg-green-500' },
	Closed: { label: 'Closed', color: 'bg-gray-400' },
	Resolved: { label: 'Resolved', color: 'bg-gray-400' },
}

function SectionTitle({ children }: { children: React.ReactNode }) {
	return <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{children}</h3>
}

export function ChatSidebar({ room, connection }: Props) {
	const user = useAuthStore((s) => s.user)
	const companyId = user?.companyId ?? ''

	const { attendingUsers } = usePresence(connection, room.id)
	const resolveRoom = useResolveRoom(companyId)
	const closeRoom = useCloseRoom(companyId)

	const state = room.state as ChatState
	const stateInfo = stateLabels[state] ?? stateLabels.New
	const customerName = room.customer?.name ?? 'Unknown Customer'
	const isOpen = state === 'New' || state === 'InProgress'

	return (
		<div className="flex flex-col h-full bg-white border-l border-gray-200 overflow-y-auto">
			{/* Customer info */}
			<div className="p-4 border-b border-gray-100">
				<div className="flex flex-col items-center text-center">
					<Avatar
						src={room.customer?.avatar}
						fallback={customerName.charAt(0)}
						size="lg"
						className="mb-2"
					/>
					<h2 className="text-sm font-semibold text-gray-900">{customerName}</h2>
					<div className="flex items-center gap-1.5 mt-1">
						<PlatformIcon platform={room.platform} size="sm" />
						<Badge platform={room.platform} className="text-[10px]">
							{room.platform}
						</Badge>
					</div>
				</div>
			</div>

			{/* Room state + actions */}
			<div className="p-4 border-b border-gray-100">
				<SectionTitle>Status</SectionTitle>
				<div className="flex items-center gap-2 mb-3">
					<span className={cn('h-2.5 w-2.5 rounded-full', stateInfo.color)} />
					<span className="text-sm font-medium text-gray-700">{stateInfo.label}</span>
				</div>
				{isOpen && (
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							className="flex-1"
							onClick={() => resolveRoom.mutate(room.id)}
							loading={resolveRoom.isPending}
						>
							Resolve
						</Button>
						<Button
							variant="ghost"
							size="sm"
							className="flex-1"
							onClick={() => closeRoom.mutate(room.id)}
							loading={closeRoom.isPending}
						>
							Close
						</Button>
					</div>
				)}
			</div>

			{/* Assigned agent */}
			<div className="p-4 border-b border-gray-100">
				<SectionTitle>Assigned To</SectionTitle>
				{room.assignedTo ? (
					<div className="flex items-center gap-2">
						<Avatar fallback={room.assignedTo.displayName.charAt(0)} size="sm" />
						<span className="text-sm text-gray-700">{room.assignedTo.displayName}</span>
					</div>
				) : (
					<p className="text-sm text-gray-400 italic">Unassigned</p>
				)}
				{/* Reassign dropdown placeholder */}
				<button
					type="button"
					className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
				>
					Reassign
				</button>
			</div>

			{/* Participants / Attending */}
			<div className="p-4 border-b border-gray-100">
				<SectionTitle>Currently Viewing</SectionTitle>
				{attendingUsers.length > 0 ? (
					<div className="flex flex-col gap-2">
						{attendingUsers.map((u) => (
							<div key={u.userId} className="flex items-center gap-2">
								<span className="h-2 w-2 rounded-full bg-green-500" />
								<span className="text-sm text-gray-700">{u.displayName}</span>
							</div>
						))}
					</div>
				) : (
					<p className="text-sm text-gray-400 italic">No one else is viewing</p>
				)}
			</div>

			{/* Tags placeholder */}
			<div className="p-4 border-b border-gray-100">
				<SectionTitle>Tags</SectionTitle>
				<p className="text-sm text-gray-400 italic">No tags</p>
			</div>

			{/* Follow-up placeholder */}
			<div className="p-4 border-b border-gray-100">
				<SectionTitle>Follow-up</SectionTitle>
				<button
					type="button"
					className="text-xs text-blue-600 hover:text-blue-700 font-medium"
				>
					Set follow-up reminder
				</button>
			</div>

			{/* Notes placeholder */}
			<div className="p-4">
				<SectionTitle>Notes</SectionTitle>
				<textarea
					placeholder="Add a note..."
					rows={3}
					className={cn(
						'w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm',
						'placeholder:text-gray-400',
						'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1',
					)}
				/>
			</div>
		</div>
	)
}
