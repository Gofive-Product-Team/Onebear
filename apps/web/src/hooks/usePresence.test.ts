import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePresence } from './usePresence'

function makeMockConnection() {
	return {
		on: vi.fn(),
		off: vi.fn(),
		invoke: vi.fn().mockResolvedValue(undefined),
	}
}

describe('usePresence', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('should return empty attendingUsers initially', () => {
		const { result } = renderHook(() => usePresence(null, null))
		expect(result.current.attendingUsers).toEqual([])
	})

	it('should not invoke or register handlers when connection is null', () => {
		renderHook(() => usePresence(null, 'room-1'))
		// No crash — just a no-op
	})

	it('should not invoke or register handlers when roomId is null', () => {
		const conn = makeMockConnection()
		renderHook(() => usePresence(conn as never, null))
		expect(conn.invoke).not.toHaveBeenCalled()
		expect(conn.on).not.toHaveBeenCalled()
	})

	it('should call AttendRoom on mount when connection and roomId are provided', () => {
		const conn = makeMockConnection()
		renderHook(() => usePresence(conn as never, 'room-1'))
		expect(conn.invoke).toHaveBeenCalledWith('AttendRoom', 'room-1')
	})

	it('should register AttendanceChanged event handler', () => {
		const conn = makeMockConnection()
		renderHook(() => usePresence(conn as never, 'room-1'))
		expect(conn.on).toHaveBeenCalledWith('AttendanceChanged', expect.any(Function))
	})

	it('should add user to attendingUsers when isAttending is true', () => {
		const conn = makeMockConnection()
		const { result } = renderHook(() => usePresence(conn as never, 'room-1'))

		const handler = (conn.on as Mock).mock.calls[0][1] as (data: unknown) => void

		act(() => {
			handler({ userId: 'user-1', displayName: 'Alice', roomId: 'room-1', isAttending: true })
		})

		expect(result.current.attendingUsers).toEqual([{ userId: 'user-1', displayName: 'Alice' }])
	})

	it('should remove user from attendingUsers when isAttending is false', () => {
		const conn = makeMockConnection()
		const { result } = renderHook(() => usePresence(conn as never, 'room-1'))

		const handler = (conn.on as Mock).mock.calls[0][1] as (data: unknown) => void

		act(() => {
			handler({ userId: 'user-1', displayName: 'Alice', roomId: 'room-1', isAttending: true })
		})
		expect(result.current.attendingUsers).toHaveLength(1)

		act(() => {
			handler({ userId: 'user-1', displayName: 'Alice', roomId: 'room-1', isAttending: false })
		})
		expect(result.current.attendingUsers).toHaveLength(0)
	})

	it('should not add duplicate users to attendingUsers', () => {
		const conn = makeMockConnection()
		const { result } = renderHook(() => usePresence(conn as never, 'room-1'))

		const handler = (conn.on as Mock).mock.calls[0][1] as (data: unknown) => void

		act(() => {
			handler({ userId: 'user-1', displayName: 'Alice', roomId: 'room-1', isAttending: true })
			handler({ userId: 'user-1', displayName: 'Alice', roomId: 'room-1', isAttending: true })
		})

		expect(result.current.attendingUsers).toHaveLength(1)
	})

	it('should ignore events for a different roomId', () => {
		const conn = makeMockConnection()
		const { result } = renderHook(() => usePresence(conn as never, 'room-1'))

		const handler = (conn.on as Mock).mock.calls[0][1] as (data: unknown) => void

		act(() => {
			handler({ userId: 'user-1', displayName: 'Alice', roomId: 'room-2', isAttending: true })
		})

		expect(result.current.attendingUsers).toHaveLength(0)
	})

	it('should call ExitRoom on unmount', () => {
		const conn = makeMockConnection()
		const { unmount } = renderHook(() => usePresence(conn as never, 'room-1'))

		unmount()

		expect(conn.invoke).toHaveBeenCalledWith('ExitRoom', 'room-1')
	})

	it('should unregister AttendanceChanged and clear attendingUsers on unmount', () => {
		const conn = makeMockConnection()
		const { result, unmount } = renderHook(() => usePresence(conn as never, 'room-1'))

		const handler = (conn.on as Mock).mock.calls[0][1] as (data: unknown) => void
		act(() => {
			handler({ userId: 'user-1', displayName: 'Alice', roomId: 'room-1', isAttending: true })
		})
		expect(result.current.attendingUsers).toHaveLength(1)

		unmount()

		expect(conn.off).toHaveBeenCalledWith('AttendanceChanged')
	})

	it('should handle multiple attending users', () => {
		const conn = makeMockConnection()
		const { result } = renderHook(() => usePresence(conn as never, 'room-1'))

		const handler = (conn.on as Mock).mock.calls[0][1] as (data: unknown) => void

		act(() => {
			handler({ userId: 'user-1', displayName: 'Alice', roomId: 'room-1', isAttending: true })
			handler({ userId: 'user-2', displayName: 'Bob', roomId: 'room-1', isAttending: true })
		})

		expect(result.current.attendingUsers).toHaveLength(2)
		expect(result.current.attendingUsers).toContainEqual({ userId: 'user-1', displayName: 'Alice' })
		expect(result.current.attendingUsers).toContainEqual({ userId: 'user-2', displayName: 'Bob' })
	})

	it('should catch and log ExitRoom errors on unmount', async () => {
		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
		const conn = makeMockConnection()
		// AttendRoom resolves, ExitRoom rejects
		;(conn.invoke as Mock)
			.mockResolvedValueOnce(undefined) // AttendRoom
			.mockRejectedValueOnce(new Error('ExitRoom failed')) // ExitRoom

		const { unmount } = renderHook(() => usePresence(conn as never, 'room-1'))

		unmount()

		await vi.waitFor(() => {
			expect(consoleErrorSpy).toHaveBeenCalled()
		})

		consoleErrorSpy.mockRestore()
	})
})
