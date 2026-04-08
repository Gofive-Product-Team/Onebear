import { useEffect, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { X, MessageSquare } from 'lucide-react'
import { cn } from '@one-bear/ui'
import { useNotificationStore } from '@/stores/notification-store'
import { PlatformIcon } from '@/components/chat/PlatformIcon'

const AUTO_DISMISS_MS = 5_000

function NotificationCard({
	id,
	title,
	message,
	roomId,
	platform,
}: {
	id: string
	title: string
	message: string
	roomId?: string
	platform?: string
}) {
	const removeNotification = useNotificationStore((s) => s.removeNotification)
	const navigate = useNavigate()
	const timerRef = useRef<ReturnType<typeof setTimeout>>()

	useEffect(() => {
		timerRef.current = setTimeout(() => {
			removeNotification(id)
		}, AUTO_DISMISS_MS)
		return () => {
			if (timerRef.current) clearTimeout(timerRef.current)
		}
	}, [id, removeNotification])

	const handleClick = () => {
		if (roomId) {
			navigate({ to: '/chat/$roomId', params: { roomId } })
		}
		removeNotification(id)
	}

	return (
		<div
			onClick={handleClick}
			className={cn(
				'relative flex items-start gap-3 rounded-xl border border-border bg-bg-app p-3 pr-8 shadow-lg',
				'cursor-pointer transition-all duration-200 hover:bg-bg-hover',
				'animate-in slide-in-from-right-5 fade-in duration-300',
				'min-w-[280px] max-w-[360px]',
			)}
		>
			{/* Platform icon or generic message icon */}
			<div className="shrink-0 mt-0.5">
				{platform ? (
					<PlatformIcon platform={platform} size="md" />
				) : (
					<span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-primary">
						<MessageSquare className="h-3 w-3" />
					</span>
				)}
			</div>

			{/* Content */}
			<div className="min-w-0 flex-1">
				<p className="text-sm font-semibold text-t1 truncate">{title}</p>
				<p className="text-xs text-t3 truncate mt-0.5">{message}</p>
			</div>

			{/* Dismiss button */}
			<button
				onClick={(e) => {
					e.stopPropagation()
					removeNotification(id)
				}}
				className="absolute top-2 right-2 rounded-md p-0.5 text-t3 hover:text-t1 hover:bg-bg-hover transition-colors"
			>
				<X className="h-3.5 w-3.5" />
			</button>
		</div>
	)
}

export function NotificationToast() {
	const notifications = useNotificationStore((s) => s.notifications)

	if (notifications.length === 0) return null

	return (
		<div className="fixed bottom-4 right-4 z-50 flex flex-col-reverse gap-2">
			{notifications.map((n) => (
				<NotificationCard
					key={n.id}
					id={n.id}
					title={n.title}
					message={n.message}
					roomId={n.roomId}
					platform={n.platform}
				/>
			))}
		</div>
	)
}
