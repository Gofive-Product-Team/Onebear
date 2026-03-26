import { HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr'
import type { HubConnection } from '@microsoft/signalr'
import { useAuthStore } from '../stores/auth-store'

let connection: HubConnection | null = null

export function getSignalRConnection(): HubConnection {
	if (connection && connection.state !== HubConnectionState.Disconnected) {
		return connection
	}

	const { token } = useAuthStore.getState()
	if (!token) throw new Error('Cannot create SignalR connection without auth token')

	connection = new HubConnectionBuilder()
		.withUrl('/hubs/chat', {
			accessTokenFactory: () => {
				// Always get fresh token from store
				return useAuthStore.getState().token ?? ''
			},
		})
		.withAutomaticReconnect({
			nextRetryDelayInMilliseconds: (retryContext) => {
				// Exponential backoff: 0, 1s, 2s, 5s, 10s, 30s max
				const delays = [0, 1000, 2000, 5000, 10000, 30000]
				return delays[Math.min(retryContext.previousRetryCount, delays.length - 1)] ?? 30000
			},
		})
		.configureLogging(LogLevel.Information)
		.build()

	// Connection lifecycle logging
	connection.onreconnecting((error) => {
		console.warn('[SignalR] Reconnecting...', error?.message)
	})

	connection.onreconnected((connectionId) => {
		console.info('[SignalR] Reconnected:', connectionId)
	})

	connection.onclose((error) => {
		console.warn('[SignalR] Connection closed:', error?.message)
		connection = null
	})

	return connection
}

export async function startSignalR(): Promise<HubConnection> {
	const conn = getSignalRConnection()
	if (conn.state === HubConnectionState.Disconnected) {
		await conn.start()
		console.info('[SignalR] Connected:', conn.connectionId)
	}
	return conn
}

export async function stopSignalR(): Promise<void> {
	if (connection) {
		await connection.stop()
		connection = null
	}
}

export function getConnectionState(): HubConnectionState {
	return connection?.state ?? HubConnectionState.Disconnected
}
