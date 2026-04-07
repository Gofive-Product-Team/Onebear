import { useEffect, useRef, useState } from 'react'
import { HubConnectionState } from '@microsoft/signalr'
import type { HubConnection } from '@microsoft/signalr'
import { startSignalR, stopSignalR } from '../lib/signalr'
import { useAuthStore } from '../stores/auth-store'

/**
 * Singleton SignalR connection manager.
 * Connection survives component re-mounts / StrictMode / route changes.
 * Only stops on logout.
 */
export function useSignalR() {
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
	const [connection, setConnection] = useState<HubConnection | null>(null)
	const [state, setState] = useState<HubConnectionState>(HubConnectionState.Disconnected)
	const mountedRef = useRef(true)

	useEffect(() => {
		mountedRef.current = true
		return () => { mountedRef.current = false }
	}, [])

	useEffect(() => {
		if (!isAuthenticated) {
			stopSignalR().then(() => {
				if (mountedRef.current) {
					setConnection(null)
					setState(HubConnectionState.Disconnected)
				}
			})
			return
		}

		startSignalR()
			.then((conn) => {
				if (!mountedRef.current) return
				setConnection(conn)
				setState(conn.state)

				// Poll state every 500ms to sync React state with SignalR state
				// (SignalR state changes are not observable via callbacks in all cases)
				const interval = setInterval(() => {
					if (mountedRef.current && conn) {
						setState(conn.state)
					}
				}, 500)

				conn.onreconnecting(() => { if (mountedRef.current) setState(HubConnectionState.Reconnecting) })
				conn.onreconnected(() => { if (mountedRef.current) setState(HubConnectionState.Connected) })
				conn.onclose(() => { if (mountedRef.current) setState(HubConnectionState.Disconnected) })

				// Clean up interval (NOT the connection)
				return () => clearInterval(interval)
			})
			.catch((err) => {
				if (mountedRef.current) {
					console.error('[useSignalR] Failed:', err)
					setState(HubConnectionState.Disconnected)
				}
			})
	}, [isAuthenticated])

	return { state, connection, isConnected: state === HubConnectionState.Connected }
}
