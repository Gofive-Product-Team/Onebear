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
			queryClient.invalidateQueries({ queryKey: ['messages', message.roomId] })
			queryClient.invalidateQueries({ queryKey: ['rooms'] })
		})

		connection.on('RoomAssigned', (_room: RoomDto) => {
			queryClient.invalidateQueries({ queryKey: ['rooms'] })
		})

		connection.on('BadgeUpdated', (badge: BadgeDto) => {
			queryClient.setQueryData(['badge-count'], badge)
		})

		connection.on('RoomUpdated', (update: RoomUpdateDto) => {
			queryClient.invalidateQueries({ queryKey: ['room', update.roomId] })
			queryClient.invalidateQueries({ queryKey: ['rooms'] })
		})

		connection.on('MessageStatusUpdated', (status: { messageId: string; roomId: string }) => {
			queryClient.invalidateQueries({ queryKey: ['messages', status.roomId] })
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
