import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ApiError, api } from './api-client'
import { ApiError as ApiErrorFromErrors } from './errors'
import { useAuthStore } from '../stores/auth-store'
import type { UserProfile } from '../stores/auth-store'

const mockUser: UserProfile = {
	userId: 'user-1',
	companyId: 'company-1',
	displayName: 'Test User',
	email: 'test@example.com',
	permissions: [3001],
}

describe('api-client', () => {
	beforeEach(() => {
		useAuthStore.getState().logout()
		vi.restoreAllMocks()
	})

	describe('ApiError', () => {
		it('should be re-exported from api-client (same reference as errors.ts)', () => {
			expect(ApiError).toBe(ApiErrorFromErrors)
		})

		it('should create an error with status and statusText', () => {
			const error = new ApiError(404, 'Not Found', null, 'corr-123')
			expect(error).toBeInstanceOf(Error)
			expect(error.name).toBe('ApiError')
			expect(error.status).toBe(404)
			expect(error.statusText).toBe('Not Found')
			expect(error.correlationId).toBe('corr-123')
			expect(error.message).toBe('API 404: Not Found')
		})
	})

	describe('fetchApi', () => {
		it('should set Authorization header when token exists', async () => {
			useAuthStore.getState().login('my-token', 3600, mockUser)

			const mockResponse = new Response(JSON.stringify({ data: 'test' }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			})
			vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(mockResponse)

			await api.users.me('company-1')

			const fetchCall = vi.mocked(globalThis.fetch).mock.calls[0]
			expect(fetchCall).toBeDefined()
			const [url, options] = fetchCall!
			expect(url).toBe('/api/v1/companies/company-1/users/me')
			expect((options?.headers as Record<string, string>)['Authorization']).toBe('Bearer my-token')
		})

		it('should not set Authorization header when no token exists', async () => {
			const mockResponse = new Response(JSON.stringify({ data: 'test' }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			})
			vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(mockResponse)

			await api.companies.featureSettings('company-1')

			const fetchCall = vi.mocked(globalThis.fetch).mock.calls[0]
			expect(fetchCall).toBeDefined()
			const [, options] = fetchCall!
			expect((options?.headers as Record<string, string>)['Authorization']).toBeUndefined()
		})

		it('should throw ApiError on non-ok response', async () => {
			useAuthStore.getState().login('my-token', 3600, mockUser)

			const mockResponse = new Response(JSON.stringify({ error: 'Not found' }), {
				status: 404,
				statusText: 'Not Found',
				headers: { 'Content-Type': 'application/json' },
			})
			vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(mockResponse)

			await expect(api.rooms.get('company-1', 'room-1')).rejects.toThrow(ApiError)

			try {
				const mockResponse2 = new Response(JSON.stringify({ error: 'Not found' }), {
					status: 404,
					statusText: 'Not Found',
					headers: { 'Content-Type': 'application/json' },
				})
				vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(mockResponse2)
				await api.rooms.get('company-1', 'room-1')
			} catch (err) {
				expect(err).toBeInstanceOf(ApiError)
				const apiError = err as ApiError
				expect(apiError.status).toBe(404)
				expect(apiError.body).toEqual({ error: 'Not found' })
			}
		})

		it('should trigger logout on 401 response', async () => {
			useAuthStore.getState().login('my-token', 3600, mockUser)
			expect(useAuthStore.getState().isAuthenticated).toBe(true)

			const mockResponse = new Response(null, {
				status: 401,
				statusText: 'Unauthorized',
			})
			vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(mockResponse)

			try {
				await api.users.me('company-1')
			} catch {
				// Expected to throw
			}

			expect(useAuthStore.getState().isAuthenticated).toBe(false)
			expect(useAuthStore.getState().token).toBeNull()
		})

		it('should throw ApiError with Token expired when token is expired', async () => {
			// Login with already-expired token
			useAuthStore.getState().login('expired-token', -120, mockUser)

			await expect(api.users.me('company-1')).rejects.toThrow('API 401: Token expired')
			expect(useAuthStore.getState().isAuthenticated).toBe(false)
		})

		it('should include X-Correlation-Id header', async () => {
			useAuthStore.getState().login('my-token', 3600, mockUser)

			const mockResponse = new Response(JSON.stringify({}), { status: 200 })
			vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(mockResponse)

			await api.users.me('company-1')

			const fetchCall = vi.mocked(globalThis.fetch).mock.calls[0]
			expect(fetchCall).toBeDefined()
			const [, options] = fetchCall!
			const correlationId = (options?.headers as Record<string, string>)['X-Correlation-Id']
			expect(correlationId).toBeDefined()
			expect(correlationId).toMatch(
				/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
			)
		})

		it('should handle empty response body', async () => {
			useAuthStore.getState().login('my-token', 3600, mockUser)

			const mockResponse = new Response('', { status: 200 })
			vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(mockResponse)

			const result = await api.rooms.resolve('company-1', 'room-1')
			expect(result).toEqual({})
		})

		it('should retry once on 5xx response and succeed on second attempt', async () => {
			vi.useFakeTimers()
			useAuthStore.getState().login('my-token', 3600, mockUser)

			const errorResponse = new Response(JSON.stringify({ detail: 'Server Error' }), {
				status: 500,
				statusText: 'Internal Server Error',
				headers: { 'Content-Type': 'application/json' },
			})
			const successResponse = new Response(JSON.stringify({ id: 'room-1' }), { status: 200 })

			const fetchSpy = vi.spyOn(globalThis, 'fetch')
			fetchSpy.mockResolvedValueOnce(errorResponse).mockResolvedValueOnce(successResponse)

			const promise = api.rooms.get('company-1', 'room-1')
			// Advance the 1s retry delay
			await vi.advanceTimersByTimeAsync(1000)
			const result = await promise

			expect(fetchSpy).toHaveBeenCalledTimes(2)
			expect(result).toEqual({ id: 'room-1' })
			vi.useRealTimers()
		})

		it('should throw ApiError after exhausting retries on persistent 5xx', async () => {
			vi.useFakeTimers()
			useAuthStore.getState().login('my-token', 3600, mockUser)

			const errorResponse1 = new Response(null, { status: 500, statusText: 'Internal Server Error' })
			const errorResponse2 = new Response(null, { status: 500, statusText: 'Internal Server Error' })

			const fetchSpy = vi.spyOn(globalThis, 'fetch')
			fetchSpy.mockResolvedValueOnce(errorResponse1).mockResolvedValueOnce(errorResponse2)

			// Collect the result via allSettled so the rejection is always handled,
			// then advance timers so the 1 s retry delay fires.
			const settled = Promise.allSettled([api.rooms.get('company-1', 'room-1')])
			await vi.advanceTimersByTimeAsync(1000)
			const [result] = await settled

			expect(result.status).toBe('rejected')
			expect((result as PromiseRejectedResult).reason).toBeInstanceOf(ApiError)
			expect(fetchSpy).toHaveBeenCalledTimes(2)
			vi.useRealTimers()
		})

		it('should not retry on 4xx errors', async () => {
			useAuthStore.getState().login('my-token', 3600, mockUser)

			const errorResponse = new Response(JSON.stringify({ detail: 'Not Found' }), {
				status: 404,
				statusText: 'Not Found',
				headers: { 'Content-Type': 'application/json' },
			})

			const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(errorResponse)

			await expect(api.rooms.get('company-1', 'room-1')).rejects.toThrow(ApiError)
			expect(fetchSpy).toHaveBeenCalledTimes(1)
		})
	})
})
