import type { ChatRoom } from '@one-bear/shared-types'
import { useReturnToAi } from '@/api/useRooms'
import { useAuthStore } from '@/stores/auth-store'

interface Props {
	room: ChatRoom
}

export function AiHandoffBanner({ room }: Props) {
	const user = useAuthStore((s) => s.user)
	const companyId = user?.companyId ?? ''

	const returnToAi = useReturnToAi(companyId)

	// Only show when handoffSource is set (implies AI handed off)
	if (!room.handoffSource) return null

	const isAiHandoff = room.handoffSource === 'ai'

	const handleReturnToAi = () => {
		returnToAi.mutate(room.id)
	}

	return (
		<div className="flex items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2">
			<div className="flex items-center gap-2 min-w-0">
				<span className="shrink-0 text-base" aria-hidden="true">
					🤖
				</span>
				<p className="truncate text-xs font-medium text-amber-800">
					{isAiHandoff
						? 'This conversation was handed off from AI'
						: `Handed off from ${room.handoffSourceName ?? room.handoffSource}`}
				</p>
			</div>
			{isAiHandoff && room.isAiMuted && (
				<button
					type="button"
					onClick={handleReturnToAi}
					disabled={returnToAi.isPending}
					className="shrink-0 rounded-md border border-blue-400 bg-white px-3 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{returnToAi.isPending ? 'Returning...' : 'Return to AI'}
				</button>
			)}
		</div>
	)
}
