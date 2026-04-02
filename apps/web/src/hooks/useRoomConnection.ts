import { useEffect, useRef } from 'react'
import type { HubConnection } from '@microsoft/signalr'
import { HubConnectionState } from '@microsoft/signalr'

/**
 * Manages joining/leaving SignalR room groups.
 * Takes `isConnected` boolean so React re-runs the effect when connection state changes.
 */
export function useRoomConnection(
	connection: HubConnection | null,
	roomId: string | null,
	isConnected: boolean,
) {
	const currentRoomRef = useRef<string | null>(null)

	useEffect(() => {
		if (!connection || !roomId || !isConnected) return
		if (connection.state !== HubConnectionState.Connected) return

		const prevRoom = currentRoomRef.current

		// Leave previous room if switching
		if (prevRoom && prevRoom !== roomId) {
			connection.invoke('LeaveRoom', prevRoom).catch((err) => {
				console.warn('[useRoomConnection] Failed to leave room:', prevRoom, err)
			})
		}

		// Join new room
		if (roomId !== prevRoom) {
			connection.invoke('JoinRooms', [roomId]).then(() => {
				console.log('[useRoomConnection] ✅ Joined room:', roomId)
				currentRoomRef.current = roomId
			}).catch((err) => {
				console.warn('[useRoomConnection] Failed to join room:', roomId, err)
			})
		}

		return () => {
			if (currentRoomRef.current && connection.state === HubConnectionState.Connected) {
				connection.invoke('LeaveRoom', currentRoomRef.current).catch(() => {})
				currentRoomRef.current = null
			}
		}
	}, [connection, roomId, isConnected]) // isConnected triggers re-run when state changes!

	// Re-join on reconnect
	useEffect(() => {
		if (!connection) return

		const onReconnected = () => {
			const room = currentRoomRef.current
			if (room && connection.state === HubConnectionState.Connected) {
				console.log('[useRoomConnection] Reconnected, re-joining:', room)
				connection.invoke('JoinRooms', [room]).catch(() => {})
			}
		}

		connection.onreconnected(onReconnected)
	}, [connection])
}
