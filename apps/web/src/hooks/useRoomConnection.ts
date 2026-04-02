import { useEffect, useRef } from 'react'
import type { HubConnection } from '@microsoft/signalr'
import { HubConnectionState } from '@microsoft/signalr'

/**
 * Manages joining/leaving SignalR room groups when the active room changes.
 * Must be called after useSignalR() provides a connected HubConnection.
 */
export function useRoomConnection(connection: HubConnection | null, roomId: string | null) {
	const currentRoomRef = useRef<string | null>(null)

	useEffect(() => {
		if (!connection || connection.state !== HubConnectionState.Connected) return

		const prevRoom = currentRoomRef.current

		// Leave previous room
		if (prevRoom && prevRoom !== roomId) {
			connection.invoke('LeaveRoom', prevRoom).catch((err) => {
				console.warn('[useRoomConnection] Failed to leave room:', prevRoom, err)
			})
		}

		// Join new room
		if (roomId && roomId !== prevRoom) {
			connection.invoke('JoinRooms', [roomId]).catch((err) => {
				console.warn('[useRoomConnection] Failed to join room:', roomId, err)
			})
		}

		currentRoomRef.current = roomId

		// Cleanup: leave room on unmount
		return () => {
			if (roomId && connection.state === HubConnectionState.Connected) {
				connection.invoke('LeaveRoom', roomId).catch(() => {})
			}
			currentRoomRef.current = null
		}
	}, [connection, roomId])
}
