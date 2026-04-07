import { cn } from '@one-bear/ui'
import type { ChatRoom } from '@one-bear/shared-types'
import { TimerDisplay } from './TimerDisplay'
import { useMarkDone } from '@/api/useRooms'
import { useAuthStore } from '@/stores/auth-store'

interface Props {
	room: ChatRoom
	className?: string
}

export function DoneButtonBar({ room, className }: Props) {
	const user = useAuthStore((s) => s.user)
	const companyId = user?.companyId ?? ''
	const markDone = useMarkDone(companyId)

	// Only visible when room has an active FRT/RT session and is not resolved
	if (!room.frtStartTimestamp || room.isResolved) return null

	const isFrtRunning = !room.isFrtStopped
	const timerLabel = isFrtRunning ? 'First Response Time' : 'Resolved Time'

	const handleDone = () => {
		markDone.mutate(room.id)
	}

	return (
		<div
			className={cn(
				'shrink-0 flex items-center justify-between gap-3 px-4 py-2',
				'border-t border-border bg-bg-card',
				className,
			)}
		>
			<div className="flex items-center gap-2 min-w-0">
				<span className="text-xs text-t3 truncate">{timerLabel}</span>
				{isFrtRunning ? (
					<TimerDisplay startTimestamp={room.frtStartTimestamp} />
				) : (
					<TimerDisplay
						startTimestamp={room.frtStartTimestamp}
						stoppedAt={room.frtEndTimestamp}
					/>
				)}
			</div>

			<button
				type="button"
				onClick={handleDone}
				disabled={markDone.isPending}
				className={cn(
					'shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
					'bg-green-600 text-white hover:bg-green-700',
					'disabled:opacity-50 disabled:cursor-not-allowed',
				)}
			>
				{markDone.isPending ? 'Saving...' : 'Done'}
			</button>
		</div>
	)
}
