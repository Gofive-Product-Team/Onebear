import { HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr'
import type { HubConnection } from '@microsoft/signalr'
import { useAuthStore } from '../stores/auth-store'

let connection: HubConnection | null = null
let starting: Promise<HubConnection> | null = null

function createConnection(): HubConnection {
	return new HubConnectionBuilder()
		.withUrl('/hubs/chat', {
			accessTokenFactory: () => useAuthStore.getState().token ?? '',
		})
		.withAutomaticReconnect([0, 1000, 2000, 5000, 10000, 30000])
		.configureLogging(LogLevel.Information)
		.build()
}

export async function startSignalR(): Promise<HubConnection> {
	// If already starting, return the same promise (dedup)
	if (starting) return starting

	// Reuse existing connection if still alive
	if (connection && connection.state === HubConnectionState.Connected) {
		return connection
	}

	// If connection exists but disconnected, start it again
	if (connection && connection.state === HubConnectionState.Disconnected) {
		starting = connection.start().then(() => {
			console.info('[SignalR] Reconnected (same object):', connection!.connectionId)
			starting = null
			return connection!
		}).catch((err) => {
			starting = null
			throw err
		})
		return starting
	}

	// Create new connection
	connection = createConnection()
	starting = connection.start().then(() => {
		console.info('[SignalR] Connected:', connection!.connectionId)
		starting = null
		return connection!
	}).catch((err) => {
		starting = null
		connection = null
		throw err
	})

	return starting
}

export async function stopSignalR(): Promise<void> {
	starting = null
	if (connection) {
		const conn = connection
		connection = null
		try { await conn.stop() } catch { /* ignore */ }
	}
}

export function getConnectionState(): HubConnectionState {
	return connection?.state ?? HubConnectionState.Disconnected
}
