import { useState, useCallback } from 'react'
import { Bell, Calendar, X } from 'lucide-react'
import { cn } from '@one-bear/ui'
import type { ChatRoom, ChatState } from '@one-bear/shared-types'
import { useResolveRoom, useCloseRoom, useUpdateFollowUp } from '@/api/useRooms'
import { usePresence } from '@/hooks/usePresence'
import { useAuthStore } from '@/stores/auth-store'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PlatformIcon } from './PlatformIcon'
import { TimerDisplay } from './TimerDisplay'
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

function formatMs(ms: number): string {
	const totalSeconds = Math.floor(ms / 1000)
	if (totalSeconds < 60) return `${totalSeconds}s`
	const minutes = Math.floor(totalSeconds / 60)
	const seconds = totalSeconds % 60
	if (minutes < 60) return `${minutes}m ${seconds}s`
	const hours = Math.floor(minutes / 60)
	const mins = minutes % 60
	return `${hours}h ${mins}m`
}

function formatFollowUpDate(timestamp: number): string {
	const d = new Date(timestamp)
	return d.toLocaleString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	})
}

function toDatetimeLocalValue(timestamp: number): string {
	const d = new Date(timestamp)
	const offset = d.getTimezoneOffset()
	const local = new Date(d.getTime() - offset * 60_000)
	return local.toISOString().slice(0, 16)
}

export function ChatSidebar({ room, connection }: Props) {
	const user = useAuthStore((s) => s.user)
	const companyId = user?.companyId ?? ''

	const { attendingUsers } = usePresence(connection, room.id)
	const resolveRoom = useResolveRoom(companyId)
	const closeRoom = useCloseRoom(companyId)
	const updateFollowUp = useUpdateFollowUp(companyId, room.id)

	const [isFollowUpEditing, setIsFollowUpEditing] = useState(false)
	const [followUpDate, setFollowUpDate] = useState('')
	const [followUpNote, setFollowUpNote] = useState('')

	const hasFollowUp = room.followupTimestamp != null && room.followupTimestamp > 0
	const isFollowUpPast = hasFollowUp && room.followupTimestamp! < Date.now()

	const handleStartEditFollowUp = useCallback(() => {
		if (hasFollowUp) {
			setFollowUpDate(toDatetimeLocalValue(room.followupTimestamp!))
			setFollowUpNote(room.followupContent ?? '')
		} else {
			setFollowUpDate('')
			setFollowUpNote('')
		}
		setIsFollowUpEditing(true)
	}, [hasFollowUp, room.followupTimestamp, room.followupContent])

	const handleSaveFollowUp = useCallback(() => {
		if (!followUpDate) return
		const timestamp = new Date(followUpDate).getTime()
		updateFollowUp.mutate(
			{ followupTimestamp: timestamp, content: followUpNote || undefined },
			{
				onSuccess: () => setIsFollowUpEditing(false),
			},
		)
	}, [followUpDate, followUpNote, updateFollowUp])

	const handleRemoveFollowUp = useCallback(() => {
		updateFollowUp.mutate(
			{ followupTimestamp: null, content: null },
			{
				onSuccess: () => setIsFollowUpEditing(false),
			},
		)
	}, [updateFollowUp])

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

			{/* Response Times */}
			{room.frtStartTimestamp && (
				<div className="p-4 border-b border-border">
					<SectionTitle>Response Times</SectionTitle>
					{room.isResolved ? (
						/* Resolved: show final FRT + RT summary */
						<div className="flex flex-col gap-2">
							{room.frtDurationMs != null && (
								<div className="flex items-center justify-between text-sm">
									<span className="text-t3">Latest FRT</span>
									<span className="font-medium text-t1 tabular-nums">{formatMs(room.frtDurationMs)}</span>
								</div>
							)}
							{room.rtDurationMs != null && (
								<div className="flex items-center justify-between text-sm">
									<span className="text-t3">Latest RT</span>
									<span className="font-medium text-t1 tabular-nums">{formatMs(room.rtDurationMs)}</span>
								</div>
							)}
							{(room.sessionTimings?.length ?? 0) > 1 && (() => {
								const sessions = room.sessionTimings!
								const avgFrt = Math.round(sessions.reduce((acc, s) => acc + s.frtMs, 0) / sessions.length)
								const avgRt = Math.round(sessions.reduce((acc, s) => acc + s.rtMs, 0) / sessions.length)
								return (
									<>
										<div className="mt-1 border-t border-border pt-1">
											<div className="flex items-center justify-between text-sm">
												<span className="text-t3">Avg FRT</span>
												<span className="font-medium text-t1 tabular-nums">{formatMs(avgFrt)}</span>
											</div>
											<div className="flex items-center justify-between text-sm mt-1">
												<span className="text-t3">Avg RT</span>
												<span className="font-medium text-t1 tabular-nums">{formatMs(avgRt)}</span>
											</div>
										</div>
									</>
								)
							})()}
						</div>
					) : (
						/* Active: show live timer with current label */
						<div className="flex items-center gap-2">
							<span className="text-sm text-t3">
								{!room.isFrtStopped ? 'First Response Time' : 'Resolved Time'}
							</span>
							{!room.isFrtStopped ? (
								<TimerDisplay startTimestamp={room.frtStartTimestamp} />
							) : (
								<TimerDisplay
									startTimestamp={room.frtStartTimestamp}
									stoppedAt={room.frtEndTimestamp}
								/>
							)}
						</div>
					)}
				</div>
			)}

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

			{/* Follow-up */}
			<div className="p-4 border-b border-border">
				<SectionTitle>Follow-up</SectionTitle>

				{isFollowUpEditing ? (
					/* Edit / Create form */
					<div className="flex flex-col gap-2">
						<div>
							<label htmlFor="followup-date" className="text-[11px] font-medium text-t3 mb-0.5 block">
								Date & Time
							</label>
							<input
								id="followup-date"
								type="datetime-local"
								value={followUpDate}
								onChange={(e) => setFollowUpDate(e.target.value)}
								className={cn(
									'w-full rounded-md border border-border-input bg-bg-input px-2.5 py-1.5 text-sm text-t1',
									'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
								)}
							/>
						</div>
						<div>
							<label htmlFor="followup-note" className="text-[11px] font-medium text-t3 mb-0.5 block">
								Note (optional)
							</label>
							<textarea
								id="followup-note"
								value={followUpNote}
								onChange={(e) => setFollowUpNote(e.target.value)}
								placeholder="What to follow up on..."
								rows={2}
								className={cn(
									'w-full resize-none rounded-md border border-border-input bg-bg-input px-2.5 py-1.5 text-sm',
									'placeholder:text-t3',
									'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
								)}
							/>
						</div>
						<div className="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								className="flex-1"
								onClick={handleSaveFollowUp}
								loading={updateFollowUp.isPending}
								disabled={!followUpDate}
							>
								Save
							</Button>
							<Button
								variant="ghost"
								size="sm"
								className="flex-1"
								onClick={() => setIsFollowUpEditing(false)}
							>
								Cancel
							</Button>
						</div>
					</div>
				) : hasFollowUp ? (
					/* Display existing follow-up */
					<div className="flex flex-col gap-1.5">
						<div className={cn(
							'flex items-start gap-2 rounded-lg px-2.5 py-2 text-sm border',
							isFollowUpPast
								? 'bg-red-50 border-red-200'
								: 'bg-amber-50 border-amber-200',
						)}>
							<Bell className={cn(
								'h-4 w-4 mt-0.5 shrink-0',
								isFollowUpPast ? 'text-red-500' : 'text-amber-500',
							)} />
							<div className="flex-1 min-w-0">
								<div className={cn(
									'text-xs font-semibold',
									isFollowUpPast ? 'text-red-700' : 'text-amber-700',
								)}>
									{formatFollowUpDate(room.followupTimestamp!)}
								</div>
								{isFollowUpPast && (
									<span className="text-[10px] font-medium text-red-500">Overdue</span>
								)}
								{room.followupContent && (
									<p className="text-xs text-t2 mt-0.5 break-words">{room.followupContent}</p>
								)}
							</div>
							<button
								type="button"
								onClick={handleRemoveFollowUp}
								disabled={updateFollowUp.isPending}
								className="shrink-0 text-t3 hover:text-error transition-colors"
								aria-label="Remove follow-up"
							>
								<X className="h-3.5 w-3.5" />
							</button>
						</div>
						<button
							type="button"
							onClick={handleStartEditFollowUp}
							className="text-xs text-primary hover:text-primary-light font-medium flex items-center gap-1"
						>
							<Calendar className="h-3 w-3" />
							Edit follow-up
						</button>
					</div>
				) : (
					/* No follow-up set */
					<button
						type="button"
						onClick={handleStartEditFollowUp}
						className="text-xs text-primary hover:text-primary-light font-medium flex items-center gap-1"
					>
						<Calendar className="h-3 w-3" />
						Set follow-up reminder
					</button>
				)}
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
