import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { HubConnectionState } from '@microsoft/signalr'
import { useSignalR } from './useSignalR'
import { useAuthStore } from '../stores/auth-store'
import type { UserProfile } from '../stores/auth-store'

// Mock the signalr lib module
vi.mock('../lib/signalr', () => ({
	startSignalR: vi.fn(),
	stopSignalR: vi.fn(),
	getConnectionState: vi.fn(),
	getSignalRConnection: vi.fn(),
}))

import { startSignalR, stopSignalR } from '../lib/signalr'

const mockUser: UserProfile = {
	userId: 'user-1',
	companyId: 'company-1',
	displayName: 'Test User',
	email: 'test@example.com',
	permissions: [3001],
}

function makeMockConnection(state: HubConnectionState = HubConnectionState.Connected) {
	return {
		state,
		onreconnecting: vi.fn(),
		onreconnected: vi.fn(),
		onclose: vi.fn(),
	}
}

describe('useSignalR', () => {
	beforeEach(() => {
		useAuthStore.getState().logout()
		vi.clearAllMocks()
		;(stopSignalR as Mock).mockResolvedValue(undefined)
	})

	it('should have initial state of Disconnected', () => {
		const { result } = renderHook(() => useSignalR())

		expect(result.current.state).toBe(HubConnectionState.Disconnected)
		expect(result.current.connection).toBeNull()
		expect(result.current.isConnected).toBe(false)
	})

	it('should not start connection when not authenticated', () => {
		renderHook(() => useSignalR())

		expect(startSignalR).not.toHaveBeenCalled()
	})

	it('should call stopSignalR when not authenticated', () => {
		renderHook(() => useSignalR())

		expect(stopSignalR).toHaveBeenCalled()
	})

	it('should start connection when authenticated', async () => {
		const mockConn = makeMockConnection()
		;(startSignalR as Mock).mockResolvedValue(mockConn)

		useAuthStore.getState().login('test-token', 3600, mockUser)

		const { result } = renderHook(() => useSignalR())

		await waitFor(() => {
			expect(result.current.connection).toBe(mockConn)
		})

		expect(startSignalR).toHaveBeenCalledTimes(1)
		expect(result.current.state).toBe(HubConnectionState.Connected)
		expect(result.current.isConnected).toBe(true)
	})

	it('should register lifecycle callbacks on connection', async () => {
		const mockConn = makeMockConnection()
		;(startSignalR as Mock).mockResolvedValue(mockConn)

		useAuthStore.getState().login('test-token', 3600, mockUser)

		const { result } = renderHook(() => useSignalR())

		await waitFor(() => {
			expect(result.current.connection).toBe(mockConn)
		})

		expect(mockConn.onreconnecting).toHaveBeenCalledTimes(1)
		expect(mockConn.onreconnected).toHaveBeenCalledTimes(1)
		expect(mockConn.onclose).toHaveBeenCalledTimes(1)
	})

	it('should update state to Reconnecting when onreconnecting fires', async () => {
		const mockConn = makeMockConnection()
		;(startSignalR as Mock).mockResolvedValue(mockConn)

		useAuthStore.getState().login('test-token', 3600, mockUser)

		const { result } = renderHook(() => useSignalR())

		await waitFor(() => {
			expect(result.current.connection).toBe(mockConn)
		})

		// Extract and call the onreconnecting callback
		const onReconnectingCb = (mockConn.onreconnecting as Mock).mock.calls[0][0] as () => void
		act(() => {
			onReconnectingCb()
		})

		expect(result.current.state).toBe(HubConnectionState.Reconnecting)
	})

	it('should update state to Connected when onreconnected fires', async () => {
		const mockConn = makeMockConnection(HubConnectionState.Reconnecting)
		;(startSignalR as Mock).mockResolvedValue(mockConn)

		useAuthStore.getState().login('test-token', 3600, mockUser)

		const { result } = renderHook(() => useSignalR())

		await waitFor(() => {
			expect(result.current.connection).toBe(mockConn)
		})

		const onReconnectedCb = (mockConn.onreconnected as Mock).mock.calls[0][0] as () => void
		act(() => {
			onReconnectedCb()
		})

		expect(result.current.state).toBe(HubConnectionState.Connected)
	})

	it('should clear connection and set Disconnected when onclose fires', async () => {
		const mockConn = makeMockConnection()
		;(startSignalR as Mock).mockResolvedValue(mockConn)

		useAuthStore.getState().login('test-token', 3600, mockUser)

		const { result } = renderHook(() => useSignalR())

		await waitFor(() => {
			expect(result.current.connection).toBe(mockConn)
		})

		const onCloseCb = (mockConn.onclose as Mock).mock.calls[0][0] as () => void
		act(() => {
			onCloseCb()
		})

		expect(result.current.state).toBe(HubConnectionState.Disconnected)
		expect(result.current.connection).toBeNull()
	})

	it('should handle startSignalR failure gracefully', async () => {
		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
		;(startSignalR as Mock).mockRejectedValue(new Error('Connection failed'))

		useAuthStore.getState().login('test-token', 3600, mockUser)

		const { result } = renderHook(() => useSignalR())

		await waitFor(() => {
			expect(consoleErrorSpy).toHaveBeenCalled()
		})

		expect(result.current.state).toBe(HubConnectionState.Disconnected)
		expect(result.current.connection).toBeNull()
		consoleErrorSpy.mockRestore()
	})

	it('should stop connection on unmount when authenticated', async () => {
		const mockConn = makeMockConnection()
		;(startSignalR as Mock).mockResolvedValue(mockConn)

		useAuthStore.getState().login('test-token', 3600, mockUser)

		const { unmount } = renderHook(() => useSignalR())

		await waitFor(() => {
			expect(startSignalR).toHaveBeenCalled()
		})

		unmount()

		expect(stopSignalR).toHaveBeenCalled()
	})

	it('should stop connection when isAuthenticated transitions to false', async () => {
		const mockConn = makeMockConnection()
		;(startSignalR as Mock).mockResolvedValue(mockConn)

		useAuthStore.getState().login('test-token', 3600, mockUser)

		const { result } = renderHook(() => useSignalR())

		await waitFor(() => {
			expect(result.current.connection).toBe(mockConn)
		})

		act(() => {
			useAuthStore.getState().logout()
		})

		await waitFor(() => {
			expect(result.current.state).toBe(HubConnectionState.Disconnected)
			expect(result.current.connection).toBeNull()
		})
	})
})
