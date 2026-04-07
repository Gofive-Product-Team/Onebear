import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { HubConnection } from '@microsoft/signalr'
import { useTypingStore } from '@/stores/typing-store'

const TYPING_CLEAR_DELAY_MS = 5_000

interface MessageDto {
	roomId: string
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

	useEffect(() => {
		if (!connection) return

		connection.on('ReceiveMessage', (message: MessageDto) => {
			console.log('[SignalR Event] ReceiveMessage:', message.roomId)
			// Invalidate all message queries that contain this roomId (partial match)
			queryClient.invalidateQueries({ queryKey: ['messages'], refetchType: 'active' })
			queryClient.invalidateQueries({ queryKey: ['rooms'] })
		})

		connection.on('RoomAssigned', (_room: RoomDto) => {
			queryClient.invalidateQueries({ queryKey: ['rooms'] })
		})

		connection.on('BadgeUpdated', (badge: BadgeDto) => {
			queryClient.setQueryData(['badge-count'], badge)
		})

		connection.on('RoomUpdated', (update: RoomUpdateDto) => {
			console.log('[SignalR Event] RoomUpdated:', update)
			queryClient.invalidateQueries({ queryKey: ['room', update.roomId] })
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
