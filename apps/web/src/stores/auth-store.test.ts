import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAuthStore, Permission, type UserProfile } from './auth-store'

const mockUser: UserProfile = {
	userId: 'user-1',
	companyId: 'company-1',
	displayName: 'Test User',
	email: 'test@example.com',
	permissions: [3001, 3002, 3003],
}

describe('useAuthStore', () => {
	beforeEach(() => {
		useAuthStore.getState().logout()
	})

	it('should start unauthenticated', () => {
		const state = useAuthStore.getState()
		expect(state.isAuthenticated).toBe(false)
		expect(state.token).toBeNull()
		expect(state.tokenExpiry).toBeNull()
		expect(state.user).toBeNull()
		expect(state.isLoading).toBe(false)
	})

	it('should login with token, expiry, and user profile', () => {
		useAuthStore.getState().login('test-token', 'test-refresh-token', 3600, mockUser)
		const state = useAuthStore.getState()

		expect(state.isAuthenticated).toBe(true)
		expect(state.token).toBe('test-token')
		expect(state.tokenExpiry).toBeGreaterThan(Date.now())
		expect(state.user).toEqual(mockUser)
		expect(state.isLoading).toBe(false)
	})

	it('should set tokenExpiry based on expiresIn seconds', () => {
		const before = Date.now()
		useAuthStore.getState().login('test-token', 'test-refresh-token', 3600, mockUser)
		const after = Date.now()
		const state = useAuthStore.getState()

		// tokenExpiry should be roughly Date.now() + 3600 * 1000
		expect(state.tokenExpiry).toBeGreaterThanOrEqual(before + 3600 * 1000)
		expect(state.tokenExpiry).toBeLessThanOrEqual(after + 3600 * 1000)
	})

	it('should logout and clear all state', () => {
		useAuthStore.getState().login('test-token', 'test-refresh-token', 3600, mockUser)
		useAuthStore.getState().logout()
		const state = useAuthStore.getState()

		expect(state.isAuthenticated).toBe(false)
		expect(state.token).toBeNull()
		expect(state.tokenExpiry).toBeNull()
		expect(state.user).toBeNull()
		expect(state.isLoading).toBe(false)
	})

	it('should set loading state', () => {
		useAuthStore.getState().setLoading(true)
		expect(useAuthStore.getState().isLoading).toBe(true)

		useAuthStore.getState().setLoading(false)
		expect(useAuthStore.getState().isLoading).toBe(false)
	})

	describe('isTokenExpired', () => {
		it('should return true when no token expiry is set', () => {
			expect(useAuthStore.getState().isTokenExpired()).toBe(true)
		})

		it('should return false when token is still valid', () => {
			useAuthStore.getState().login('test-token', 'test-refresh-token', 3600, mockUser)
			expect(useAuthStore.getState().isTokenExpired()).toBe(false)
		})

		it('should return true when token is expired', () => {
			// Login with a negative expiresIn to simulate an expired token
			useAuthStore.getState().login('test-token', 'test-refresh-token', -120, mockUser)
			expect(useAuthStore.getState().isTokenExpired()).toBe(true)
		})

		it('should return true within the 1-minute buffer before expiry', () => {
			// expiresIn of 30 seconds means expiry is 30s from now,
			// but with 60s buffer, it should be considered expired
			useAuthStore.getState().login('test-token', 'test-refresh-token', 30, mockUser)
			expect(useAuthStore.getState().isTokenExpired()).toBe(true)
		})

		it('should return false when token expires well beyond the buffer', () => {
			// expiresIn of 300 seconds (5 min) - well beyond the 60s buffer
			useAuthStore.getState().login('test-token', 'test-refresh-token', 300, mockUser)
			expect(useAuthStore.getState().isTokenExpired()).toBe(false)
		})
	})

	describe('hasPermission', () => {
		it('should return false when user is not logged in', () => {
			expect(useAuthStore.getState().hasPermission(Permission.ChatView)).toBe(false)
		})

		it('should return true when user has the permission', () => {
			useAuthStore.getState().login('test-token', 'test-refresh-token', 3600, mockUser)
			expect(useAuthStore.getState().hasPermission(Permission.ChatView)).toBe(true)
			expect(useAuthStore.getState().hasPermission(Permission.ChatResolved)).toBe(true)
			expect(useAuthStore.getState().hasPermission(Permission.ChatMention)).toBe(true)
		})

		it('should return false when user does not have the permission', () => {
			useAuthStore.getState().login('test-token', 'test-refresh-token', 3600, mockUser)
			expect(useAuthStore.getState().hasPermission(Permission.ChatAssignAllCompany)).toBe(false)
			expect(useAuthStore.getState().hasPermission(Permission.ChatAccessAllData)).toBe(false)
		})

		it('should return false for a permission id not in the list', () => {
			useAuthStore.getState().login('test-token', 'test-refresh-token', 3600, mockUser)
			expect(useAuthStore.getState().hasPermission(9999)).toBe(false)
		})
	})

	describe('Permission constants', () => {
		it('should have the correct permission values', () => {
			expect(Permission.ChatView).toBe(3001)
			expect(Permission.ChatResolved).toBe(3002)
			expect(Permission.ChatMention).toBe(3003)
			expect(Permission.ChatAssignAllCompany).toBe(3004)
			expect(Permission.ChatAccessAllData).toBe(3005)
		})
	})
})
