import { useEffect, useState } from 'react'
import { HubConnectionState } from '@microsoft/signalr'
import type { HubConnection } from '@microsoft/signalr'
import { startSignalR, stopSignalR, getConnectionState, getSignalRConnection } from '../lib/signalr'
import { useAuthStore } from '../stores/auth-store'

export function useSignalR() {
	const [state, setState] = useState<HubConnectionState>(HubConnectionState.Disconnected)
	const [connection, setConnection] = useState<HubConnection | null>(null)
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

	useEffect(() => {
		if (!isAuthenticated) {
			stopSignalR()
			setState(HubConnectionState.Disconnected)
			setConnection(null)
			return
		}

		let cancelled = false

		startSignalR()
			.then((conn) => {
				if (!cancelled) {
					setConnection(conn)
					setState(conn.state)

					conn.onreconnecting(() => setState(HubConnectionState.Reconnecting))
					conn.onreconnected(() => setState(HubConnectionState.Connected))
					conn.onclose(() => {
						setState(HubConnectionState.Disconnected)
						setConnection(null)
					})
				}
			})
			.catch((err) => {
				if (!cancelled) {
					console.error('[useSignalR] Failed to connect:', err)
					setState(HubConnectionState.Disconnected)
				}
			})

		return () => {
			cancelled = true
			stopSignalR()
		}
	}, [isAuthenticated])

	return { state, connection, isConnected: state === HubConnectionState.Connected }
}
