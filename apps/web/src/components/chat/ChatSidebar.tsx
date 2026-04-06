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
	return <h3 className="text-xs font-semibold text-t3 uppercase tracking-[0.06em] mb-2">{children}</h3>
}

export function ChatSidebar({ room, connection }: Props) {
	const user = useAuthStore((s) => s.user)
	const companyId = user?.companyId ?? ''

	const { attendingUsers } = usePresence(connection, room.id)
	const resolveRoom = useResolveRoom(companyId)
	const closeRoom = useCloseRoom(companyId)

	const state = room.state as ChatState
	const stateInfo = stateLabels[state] ?? stateLabels.New
	const customerName = room.customerName ?? 'Unknown Customer'
	const isOpen = state === 'New' || state === 'InProgress'

	return (
		<div className="flex flex-col h-full bg-bg-page border-l border-border animate-slide-in overflow-y-auto">
			{/* Customer info */}
			<div className="px-[18px] py-5 border-b border-border">
				<div className="flex flex-col items-center text-center">
					<Avatar
						src={room.customerAvatar ?? undefined}
						fallback={customerName.charAt(0)}
						size="lg"
						className="mb-2"
					/>
					<h2 className="text-sm font-semibold text-t1">{customerName}</h2>
					<div className="flex items-center gap-1.5 mt-1">
						<PlatformIcon platform={room.platform} size="sm" />
						<Badge platform={room.platform} className="text-[10px]">
							{room.platform}
						</Badge>
					</div>
				</div>
			</div>

			{/* Room state + actions */}
			<div className="p-4 border-b border-border">
				<SectionTitle>Status</SectionTitle>
				<div className="flex items-center gap-2 mb-3">
					<span className={cn('h-2.5 w-2.5 rounded-full', stateInfo.color)} />
					<span className="text-sm font-medium text-t2">{stateInfo.label}</span>
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
			<div className="p-4 border-b border-border">
				<SectionTitle>Assigned To</SectionTitle>
				{room.assignToUserId ? (
					<div className="flex items-center gap-2">
						<Avatar fallback={room.assignToUserId.charAt(0).toUpperCase()} size="sm" />
						<span className="text-sm text-t2">{room.assignToUserId}</span>
					</div>
				) : (
					<p className="text-sm text-t3 italic">Unassigned</p>
				)}
				{/* Reassign dropdown placeholder */}
				<button
					type="button"
					className="mt-2 text-xs text-primary hover:text-primary-light font-medium"
				>
					Reassign
				</button>
			</div>

			{/* Participants / Attending */}
			<div className="p-4 border-b border-border">
				<SectionTitle>Currently Viewing</SectionTitle>
				{attendingUsers.length > 0 ? (
					<div className="flex flex-col gap-2">
						{attendingUsers.map((u) => (
							<div key={u.userId} className="flex items-center gap-2">
								<span className="h-2 w-2 rounded-full bg-green-500" />
								<span className="text-sm text-t2">{u.displayName}</span>
							</div>
						))}
					</div>
				) : (
					<p className="text-sm text-t3 italic">No one else is viewing</p>
				)}
			</div>

			{/* Tags placeholder */}
			<div className="p-4 border-b border-border">
				<SectionTitle>Tags</SectionTitle>
				<p className="text-sm text-t3 italic">No tags</p>
			</div>

			{/* Follow-up placeholder */}
			<div className="p-4 border-b border-border">
				<SectionTitle>Follow-up</SectionTitle>
				<button
					type="button"
					className="text-xs text-primary hover:text-primary-light font-medium"
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
						'w-full resize-none rounded-lg border border-border-input bg-bg-input px-3 py-2 text-sm',
						'placeholder:text-t3',
						'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
					)}
				/>
			</div>
		</div>
	)
}
