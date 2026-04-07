import { useState, useCallback } from 'react'
import { cn } from '@one-bear/ui'
import { AlertTriangle } from 'lucide-react'
import type { ChatRoom } from '@one-bear/shared-types'
import { useSpamRooms, useMarkNotSpam } from '@/api/useRooms'
import { useAuthStore } from '@/stores/auth-store'
import { Avatar } from '@/components/ui/Avatar'
import { PlatformIcon } from './PlatformIcon'
import { formatSmartTimestamp } from '@/lib/date'

interface ToastState {
	id: number
	message: string
}

let toastCounter = 0

function Toast({ toast, onDismiss }: { toast: ToastState; onDismiss: (id: number) => void }) {
	return (
		<div
			className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg bg-t1 px-4 py-3 text-sm text-bg-card shadow-lg animate-in fade-in slide-in-from-bottom-2"
			role="status"
			aria-live="polite"
		>
			<span>{toast.message}</span>
			<button
				type="button"
				onClick={() => onDismiss(toast.id)}
				className="ml-1 text-bg-card/70 hover:text-bg-card"
				aria-label="Dismiss"
			>
				<svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
					<path d="M4 4l8 8M12 4l-8 8" />
				</svg>
			</button>
		</div>
	)
}

function SpamRoomCard({ room, onMarkNotSpam }: { room: ChatRoom; onMarkNotSpam: (id: string) => void }) {
	const customerName = room.customerName ?? 'Unknown Customer'
	const fallbackInitial = customerName.charAt(0).toUpperCase()

	return (
		<div className="flex items-start gap-3 px-4 py-3 border-b border-border last:border-0 bg-bg-card hover:bg-bg-hover transition-colors">
			{/* Avatar with platform overlay */}
			<div className="relative shrink-0">
				<Avatar src={room.customerAvatar ?? undefined} fallback={fallbackInitial} size="md" />
				<PlatformIcon
					platform={room.platform}
					size="sm"
					className="absolute -bottom-0.5 -right-0.5 ring-2 ring-bg-page"
				/>
			</div>

			{/* Content */}
			<div className="flex-1 min-w-0">
				<div className="flex items-center justify-between gap-2">
					<span className="truncate text-sm font-medium text-t1">{customerName}</span>
					{room.lastMessageTimestamp && (
						<span className="shrink-0 text-xs text-t3">
							{formatSmartTimestamp(room.lastMessageTimestamp)}
						</span>
					)}
				</div>
				<p className="mt-0.5 text-xs text-t3 truncate">{room.lastMessage ?? 'No messages'}</p>

				{/* Spam score indicator */}
				{room.spamScore != null && (
					<span className="mt-1 inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">
						<AlertTriangle className="h-3 w-3" /> Spam score: {Math.round(room.spamScore * 100)}%
					</span>
				)}
			</div>

			{/* Mark as not spam button */}
			<button
				type="button"
				onClick={() => onMarkNotSpam(room.id)}
				className={cn(
					'shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
					'bg-bg-input text-t1 hover:bg-primary hover:text-white',
				)}
			>
				Not Spam
			</button>
		</div>
	)
}

interface Props {
	onClose: () => void
}

export function SpamFolder({ onClose }: Props) {
	const user = useAuthStore((s) => s.user)
	const companyId = user?.companyId ?? ''

	const { data: spamRooms = [], isLoading } = useSpamRooms(companyId)
	const markNotSpam = useMarkNotSpam(companyId)

	const [toasts, setToasts] = useState<ToastState[]>([])

	const dismissToast = useCallback((id: number) => {
		setToasts((prev) => prev.filter((t) => t.id !== id))
	}, [])

	const handleMarkNotSpam = useCallback(
		(roomId: string) => {
			markNotSpam.mutate(roomId, {
				onSuccess: () => {
					const id = ++toastCounter
					setToasts((prev) => [...prev, { id, message: 'Moved back to inbox' }])
					setTimeout(() => dismissToast(id), 3000)
				},
			})
		},
		[markNotSpam, dismissToast],
	)

	return (
		<>
			<div className="flex flex-col h-full bg-bg-page">
				{/* Header */}
				<div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-border bg-bg-card">
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={onClose}
							className="text-t3 hover:text-t1 transition-colors"
							aria-label="Close spam folder"
						>
							<svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
								<path
									fillRule="evenodd"
									d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
									clipRule="evenodd"
								/>
							</svg>
						</button>
						<h2 className="text-[1rem] font-bold text-t1">Spam Folder</h2>
						{spamRooms.length > 0 && (
							<span className="inline-flex items-center justify-center h-5 min-w-5 rounded-full bg-red-500 px-1.5 text-[10px] font-medium text-white">
								{spamRooms.length}
							</span>
						)}
					</div>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-y-auto">
					{isLoading && (
						<div className="flex flex-col gap-1 p-4 animate-pulse">
							{Array.from({ length: 4 }).map((_, i) => (
								<div key={i} className="h-16 rounded-lg bg-bg-input" />
							))}
						</div>
					)}

					{!isLoading && spamRooms.length === 0 && (
						<div className="flex flex-col items-center justify-center h-full gap-3 p-8 text-center">
							<div className="flex h-16 w-16 items-center justify-center rounded-full bg-bg-input">
								<svg className="h-8 w-8 text-t3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
									<path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
								</svg>
							</div>
							<p className="text-sm font-medium text-t1">No spam messages</p>
							<p className="text-xs text-t3">Suspicious conversations will appear here.</p>
						</div>
					)}

					{!isLoading && spamRooms.length > 0 && (
						<div className="divide-y divide-border">
							{spamRooms.map((room) => (
								<SpamRoomCard key={room.id} room={room} onMarkNotSpam={handleMarkNotSpam} />
							))}
						</div>
					)}
				</div>

				{/* Footer note */}
				{!isLoading && spamRooms.length > 0 && (
					<div className="shrink-0 px-4 py-2 border-t border-border">
						<p className="text-[10px] text-t3 text-center">
							Spam conversations are automatically deleted after 30 days.
						</p>
					</div>
				)}
			</div>

			{/* Toasts */}
			{toasts.map((toast) => (
				<Toast key={toast.id} toast={toast} onDismiss={dismissToast} />
			))}
		</>
	)
}
