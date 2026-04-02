import { HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr'
import type { HubConnection } from '@microsoft/signalr'
import { useAuthStore } from '../stores/auth-store'

let connection: HubConnection | null = null
let startPromise: Promise<HubConnection> | null = null

export function getSignalRConnection(): HubConnection {
	if (connection && connection.state !== HubConnectionState.Disconnected) {
		return connection
	}

	const { token } = useAuthStore.getState()
	if (!token) throw new Error('Cannot create SignalR connection without auth token')

	connection = new HubConnectionBuilder()
		.withUrl('/hubs/chat', {
			accessTokenFactory: () => {
				return useAuthStore.getState().token ?? ''
			},
		})
		.withAutomaticReconnect({
			nextRetryDelayInMilliseconds: (retryContext) => {
				const delays = [0, 1000, 2000, 5000, 10000, 30000]
				return delays[Math.min(retryContext.previousRetryCount, delays.length - 1)] ?? 30000
			},
		})
		.configureLogging(LogLevel.Information)
		.build()

	connection.onreconnecting((error) => {
		console.warn('[SignalR] Reconnecting...', error?.message)
	})

	connection.onreconnected((connectionId) => {
		console.info('[SignalR] Reconnected:', connectionId)
	})

	connection.onclose((error) => {
		console.warn('[SignalR] Connection closed:', error?.message)
		connection = null
		startPromise = null
	})

	return connection
}

export async function startSignalR(): Promise<HubConnection> {
	// Return existing start promise to prevent double-connect
	if (startPromise) return startPromise

	const conn = getSignalRConnection()
	if (conn.state === HubConnectionState.Connected) {
		return conn
	}

	startPromise = conn.start().then(() => {
		console.info('[SignalR] Connected:', conn.connectionId)
		return conn
	})

	try {
		return await startPromise
	} catch (err) {
		startPromise = null
		throw err
	}
}

export async function stopSignalR(): Promise<void> {
	startPromise = null
	if (connection) {
		const conn = connection
		connection = null
		await conn.stop()
	}
}

export function getConnectionState(): HubConnectionState {
	return connection?.state ?? HubConnectionState.Disconnected
}
