import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTyping } from './useTyping'

function makeMockConnection() {
	return {
		on: vi.fn(),
		off: vi.fn(),
		invoke: vi.fn().mockResolvedValue(undefined),
	}
}

describe('useTyping', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('should return empty typingUsers initially', () => {
		const { result } = renderHook(() => useTyping(null, null))
		expect(result.current.typingUsers).toEqual([])
	})

	it('should not register event handlers when connection is null', () => {
		renderHook(() => useTyping(null, 'room-1'))
		// No connection, nothing to assert — just ensure no crash
	})

	it('should not register event handlers when roomId is null', () => {
		const conn = makeMockConnection()
		renderHook(() => useTyping(conn as never, null))
		expect(conn.on).not.toHaveBeenCalled()
	})

	it('should register TypingIndicator event handler when connection and roomId are provided', () => {
		const conn = makeMockConnection()
		renderHook(() => useTyping(conn as never, 'room-1'))
		expect(conn.on).toHaveBeenCalledWith('TypingIndicator', expect.any(Function))
	})

	it('should add user to typingUsers when isTyping is true', () => {
		const conn = makeMockConnection()
		const { result } = renderHook(() => useTyping(conn as never, 'room-1'))

		const handler = (conn.on as Mock).mock.calls[0][1] as (data: unknown) => void

		act(() => {
			handler({ userId: 'user-1', displayName: 'Alice', roomId: 'room-1', isTyping: true })
		})

		expect(result.current.typingUsers).toEqual([{ userId: 'user-1', displayName: 'Alice' }])
	})

	it('should remove user from typingUsers when isTyping is false', () => {
		const conn = makeMockConnection()
		const { result } = renderHook(() => useTyping(conn as never, 'room-1'))

		const handler = (conn.on as Mock).mock.calls[0][1] as (data: unknown) => void

		act(() => {
			handler({ userId: 'user-1', displayName: 'Alice', roomId: 'room-1', isTyping: true })
		})
		expect(result.current.typingUsers).toHaveLength(1)

		act(() => {
			handler({ userId: 'user-1', displayName: 'Alice', roomId: 'room-1', isTyping: false })
		})
		expect(result.current.typingUsers).toHaveLength(0)
	})

	it('should not add duplicate users to typingUsers', () => {
		const conn = makeMockConnection()
		const { result } = renderHook(() => useTyping(conn as never, 'room-1'))

		const handler = (conn.on as Mock).mock.calls[0][1] as (data: unknown) => void

		act(() => {
			handler({ userId: 'user-1', displayName: 'Alice', roomId: 'room-1', isTyping: true })
			handler({ userId: 'user-1', displayName: 'Alice', roomId: 'room-1', isTyping: true })
		})

		expect(result.current.typingUsers).toHaveLength(1)
	})

	it('should ignore events for a different roomId', () => {
		const conn = makeMockConnection()
		const { result } = renderHook(() => useTyping(conn as never, 'room-1'))

		const handler = (conn.on as Mock).mock.calls[0][1] as (data: unknown) => void

		act(() => {
			handler({ userId: 'user-1', displayName: 'Alice', roomId: 'room-2', isTyping: true })
		})

		expect(result.current.typingUsers).toHaveLength(0)
	})

	it('should unregister TypingIndicator and clear typingUsers on unmount', () => {
		const conn = makeMockConnection()
		const { result, unmount } = renderHook(() => useTyping(conn as never, 'room-1'))

		const handler = (conn.on as Mock).mock.calls[0][1] as (data: unknown) => void
		act(() => {
			handler({ userId: 'user-1', displayName: 'Alice', roomId: 'room-1', isTyping: true })
		})
		expect(result.current.typingUsers).toHaveLength(1)

		unmount()

		expect(conn.off).toHaveBeenCalledWith('TypingIndicator')
	})

	describe('sendTyping', () => {
		it('should call connection.invoke with SendTyping when connection and roomId exist', () => {
			const conn = makeMockConnection()
			const { result } = renderHook(() => useTyping(conn as never, 'room-1'))

			act(() => {
				result.current.sendTyping(true)
			})

			expect(conn.invoke).toHaveBeenCalledWith('SendTyping', 'room-1', true)
		})

		it('should call connection.invoke with false when stopping typing', () => {
			const conn = makeMockConnection()
			const { result } = renderHook(() => useTyping(conn as never, 'room-1'))

			act(() => {
				result.current.sendTyping(false)
			})

			expect(conn.invoke).toHaveBeenCalledWith('SendTyping', 'room-1', false)
		})

		it('should not call invoke when connection is null', () => {
			const { result } = renderHook(() => useTyping(null, 'room-1'))

			act(() => {
				result.current.sendTyping(true)
			})

			// No crash — just a no-op
		})

		it('should not call invoke when roomId is null', () => {
			const conn = makeMockConnection()
			const { result } = renderHook(() => useTyping(conn as never, null))

			act(() => {
				result.current.sendTyping(true)
			})

			expect(conn.invoke).not.toHaveBeenCalled()
		})

		it('should catch and log errors from connection.invoke', async () => {
			const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
			const conn = makeMockConnection()
			;(conn.invoke as Mock).mockRejectedValue(new Error('invoke failed'))

			const { result } = renderHook(() => useTyping(conn as never, 'room-1'))

			act(() => {
				result.current.sendTyping(true)
			})

			// Give the promise rejection time to settle
			await vi.waitFor(() => {
				expect(consoleErrorSpy).toHaveBeenCalled()
			})

			consoleErrorSpy.mockRestore()
		})
	})
})
