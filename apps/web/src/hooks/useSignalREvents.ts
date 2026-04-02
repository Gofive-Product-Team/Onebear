import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { HubConnection } from '@microsoft/signalr'

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

		return () => {
			connection.off('ReceiveMessage')
			connection.off('RoomAssigned')
			connection.off('BadgeUpdated')
			connection.off('RoomUpdated')
			connection.off('MessageStatusUpdated')
		}
	}, [connection, queryClient])
}
