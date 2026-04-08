import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { HubConnection } from '@microsoft/signalr'
import { useTypingStore } from '@/stores/typing-store'
import { useUIStore } from '@/stores/ui-store'
import { useAuthStore } from '@/stores/auth-store'
import { useNotificationStore } from '@/stores/notification-store'
import { playNotificationSound } from '@/lib/notification-sound'

const TYPING_CLEAR_DELAY_MS = 5_000

interface MessageDto {
	roomId: string
	content?: string | null
	senderName?: string | null
	senderType?: string | null
	senderId?: string | null
	platform?: string
	[key: string]: unknown
}

interface RoomDto {
	id: string
	[key: string]: unknown
}

interface BadgeDto {
	unreadCount: number
}

interface RoomUpdateDto {
	roomId: string
	changes: Record<string, unknown>
}

export function useSignalREvents(connection: HubConnection | null) {
	const queryClient = useQueryClient()
	const setTyping = useTypingStore((s) => s.setTyping)
	const clearTyping = useTypingStore((s) => s.clearTyping)
	// Map of roomId -> auto-clear timer
	const typingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

	// Request browser notification permission on first load
	useEffect(() => {
		if ('Notification' in window && Notification.permission === 'default') {
			Notification.requestPermission()
		}
	}, [])

	useEffect(() => {
		if (!connection) return

		connection.on('ReceiveMessage', (message: MessageDto) => {
			console.log('[SignalR Event] ReceiveMessage:', message.roomId)
			// Invalidate all message queries that contain this roomId (partial match)
			queryClient.invalidateQueries({ queryKey: ['messages'], refetchType: 'active' })
			queryClient.invalidateQueries({ queryKey: ['rooms'] })

			// Notification logic: only for inbound messages (not from current user)
			const currentUserId = useAuthStore.getState().user?.userId
			const isFromCustomer = message.senderType !== 'Agent' && message.senderId !== currentUserId
			const selectedRoomId = useUIStore.getState().selectedRoomId
			const isActiveRoom = message.roomId === selectedRoomId

			if (isFromCustomer) {
				// Play notification sound (unless viewing the same room and tab is active)
				if (!isActiveRoom || document.hidden) {
					playNotificationSound()
				}

				// Show in-app toast notification
				useNotificationStore.getState().addNotification({
					title: message.senderName ?? 'Customer',
					message: message.content?.slice(0, 100) ?? 'New message',
					roomId: message.roomId,
					platform: message.platform,
				})

				// Browser notification (only when tab is not active)
				if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
					new Notification(message.senderName ?? 'New message', {
						body: message.content?.slice(0, 100) ?? 'New message',
						icon: '/favicon.ico',
						tag: message.roomId, // Prevents duplicate notifications for same room
					})
				}
			}
		})

		connection.on('RoomAssigned', (_room: RoomDto) => {
			queryClient.invalidateQueries({ queryKey: ['rooms'] })
		})

		connection.on('BadgeUpdated', (badge: BadgeDto) => {
			queryClient.setQueryData(['badge-count'], badge)
		})

		connection.on('RoomUpdated', (update: RoomUpdateDto) => {
			console.log('[SignalR Event] RoomUpdated:', update)
			// Invalidate both singular room and room list queries
			queryClient.invalidateQueries({ queryKey: ['room'] })
			queryClient.invalidateQueries({ queryKey: ['rooms'] })
		})

		connection.on('MessageStatusUpdated', (_status: { messageId: string; roomId: string }) => {
			queryClient.invalidateQueries({ queryKey: ['messages'], refetchType: 'active' })
		})

		connection.on('TypingIndicator', (data: { userId: string; displayName: string; roomId: string; isTyping: boolean }) => {
			const { roomId, userId, isTyping } = data
			const timers = typingTimers.current

			// Clear any existing auto-clear timer for this room
			const existingTimer = timers.get(roomId)
			if (existingTimer !== undefined) {
				clearTimeout(existingTimer)
				timers.delete(roomId)
			}

			if (isTyping) {
				setTyping(roomId, userId)
				// Auto-clear after 5 seconds
				const timer = setTimeout(() => {
					clearTyping(roomId)
					timers.delete(roomId)
				}, TYPING_CLEAR_DELAY_MS)
				timers.set(roomId, timer)
			} else {
				clearTyping(roomId)
			}
		})

		return () => {
			connection.off('ReceiveMessage')
			connection.off('RoomAssigned')
			connection.off('BadgeUpdated')
			connection.off('RoomUpdated')
			connection.off('MessageStatusUpdated')
			connection.off('TypingIndicator')
			// Clear all pending timers
			typingTimers.current.forEach((timer) => clearTimeout(timer))
			typingTimers.current.clear()
		}
	}, [connection, queryClient, setTyping, clearTyping])
}
