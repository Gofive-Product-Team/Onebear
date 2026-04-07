import { describe, it, expect } from 'vitest'
import { ApiError, type ProblemDetails } from './errors'

describe('ApiError', () => {
	describe('constructor with ProblemDetails body', () => {
		it('should use body.detail as the error message when present', () => {
			const body: ProblemDetails = {
				type: 'https://tools.ietf.org/html/rfc9110#section-15.5.5',
				title: 'Not Found',
				status: 404,
				detail: 'Room with id "abc" was not found.',
				instance: '/api/v1/companies/c1/rooms/abc',
			}
			const error = new ApiError(404, 'Not Found', body, 'corr-001')
			expect(error.message).toBe('Room with id "abc" was not found.')
		})

		it('should store all constructor arguments as readonly properties', () => {
			const body: ProblemDetails = {
				status: 400,
				detail: 'Validation failed',
				errors: { name: ['Name is required'] },
			}
			const error = new ApiError(400, 'Bad Request', body, 'corr-002')
			expect(error.status).toBe(400)
			expect(error.statusText).toBe('Bad Request')
			expect(error.body).toBe(body)
			expect(error.correlationId).toBe('corr-002')
		})

		it('should set name to "ApiError"', () => {
			const error = new ApiError(500, 'Internal Server Error', null)
			expect(error.name).toBe('ApiError')
		})
	})

	describe('constructor with null body', () => {
		it('should fall back to "API {status}: {statusText}" message when body is null', () => {
			const error = new ApiError(503, 'Service Unavailable', null)
			expect(error.message).toBe('API 503: Service Unavailable')
		})

		it('should fall back to "API {status}: {statusText}" when body has no detail', () => {
			const body: ProblemDetails = { title: 'Internal Server Error', status: 500 }
			const error = new ApiError(500, 'Internal Server Error', body)
			expect(error.message).toBe('API 500: Internal Server Error')
		})

		it('should allow correlationId to be undefined', () => {
			const error = new ApiError(404, 'Not Found', null)
			expect(error.correlationId).toBeUndefined()
		})
	})

	describe('instanceof', () => {
		it('should be an instance of Error', () => {
			const error = new ApiError(400, 'Bad Request', null)
			expect(error).toBeInstanceOf(Error)
		})

		it('should be an instance of ApiError', () => {
			const error = new ApiError(400, 'Bad Request', null)
			expect(error).toBeInstanceOf(ApiError)
		})
	})

	describe('helper getters', () => {
		it('isNotFound returns true for 404', () => {
			expect(new ApiError(404, 'Not Found', null).isNotFound).toBe(true)
		})

		it('isNotFound returns false for other statuses', () => {
			expect(new ApiError(400, 'Bad Request', null).isNotFound).toBe(false)
		})

		it('isValidation returns true for 400', () => {
			expect(new ApiError(400, 'Bad Request', null).isValidation).toBe(true)
		})

		it('isValidation returns false for other statuses', () => {
			expect(new ApiError(404, 'Not Found', null).isValidation).toBe(false)
		})

		it('isConflict returns true for 409', () => {
			expect(new ApiError(409, 'Conflict', null).isConflict).toBe(true)
		})

		it('isConflict returns false for other statuses', () => {
			expect(new ApiError(400, 'Bad Request', null).isConflict).toBe(false)
		})

		it('isRateLimited returns true for 429', () => {
			expect(new ApiError(429, 'Too Many Requests', null).isRateLimited).toBe(true)
		})

		it('isRateLimited returns false for other statuses', () => {
			expect(new ApiError(400, 'Bad Request', null).isRateLimited).toBe(false)
		})

		it('isForbidden returns true for 403', () => {
			expect(new ApiError(403, 'Forbidden', null).isForbidden).toBe(true)
		})

		it('isForbidden returns false for other statuses', () => {
			expect(new ApiError(404, 'Not Found', null).isForbidden).toBe(false)
		})

		it('isUnauthorized returns true for 401', () => {
			expect(new ApiError(401, 'Unauthorized', null).isUnauthorized).toBe(true)
		})

		it('isUnauthorized returns false for other statuses', () => {
			expect(new ApiError(403, 'Forbidden', null).isUnauthorized).toBe(false)
		})
	})
})
