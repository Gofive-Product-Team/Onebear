import { useEffect, useRef, useState } from 'react'
import { HubConnectionState } from '@microsoft/signalr'
import type { HubConnection } from '@microsoft/signalr'
import { startSignalR, stopSignalR, getSignalRConnection } from '../lib/signalr'
import { useAuthStore } from '../stores/auth-store'

/**
 * Manages SignalR connection lifecycle tied to auth state.
 * Connection is a singleton — survives component re-mounts and StrictMode.
 * Only disconnects when user logs out.
 */
export function useSignalR() {
	const [state, setState] = useState<HubConnectionState>(HubConnectionState.Disconnected)
	const [connection, setConnection] = useState<HubConnection | null>(null)
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
	const connectingRef = useRef(false)

	useEffect(() => {
		// Logout → disconnect
		if (!isAuthenticated) {
			stopSignalR().then(() => {
				setState(HubConnectionState.Disconnected)
				setConnection(null)
			})
			return
		}

		// Already connecting or connected → just sync state
		if (connectingRef.current) return

		async function connect() {
			connectingRef.current = true
			try {
				const conn = await startSignalR()
				setConnection(conn)
				setState(conn.state)

				conn.onreconnecting(() => setState(HubConnectionState.Reconnecting))
				conn.onreconnected(() => setState(HubConnectionState.Connected))
				conn.onclose(() => {
					setState(HubConnectionState.Disconnected)
					setConnection(null)
					connectingRef.current = false
				})
			} catch (err) {
				console.error('[useSignalR] Failed to connect:', err)
				setState(HubConnectionState.Disconnected)
				connectingRef.current = false
			}
		}

		connect()

		// Do NOT stop connection on cleanup — it's a singleton.
		// Only stop when isAuthenticated becomes false (above).
	}, [isAuthenticated])

	return { state, connection, isConnected: state === HubConnectionState.Connected }
}
