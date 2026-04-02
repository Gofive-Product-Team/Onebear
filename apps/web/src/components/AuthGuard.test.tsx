import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AuthGuard } from './AuthGuard'
import { useAuthStore } from '../stores/auth-store'

// Mock useAuthStore
vi.mock('../stores/auth-store', () => ({
	useAuthStore: vi.fn(),
}))

const mockUseAuthStore = vi.mocked(useAuthStore)

describe('AuthGuard', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('should render children when authenticated', () => {
		mockUseAuthStore.mockImplementation((selector: any) => {
			const state = {
				isAuthenticated: true,
				user: { permissions: [3001, 3002] },
				hasPermission: (id: number) => [3001, 3002].includes(id),
			}
			return selector(state)
		})

		render(
			<AuthGuard>
				<div>Protected Content</div>
			</AuthGuard>,
		)

		expect(screen.getByText('Protected Content')).toBeDefined()
	})

	it('should show login redirect when not authenticated', () => {
		mockUseAuthStore.mockImplementation((selector: any) => {
			const state = {
				isAuthenticated: false,
				user: null,
				hasPermission: () => false,
			}
			return selector(state)
		})

		render(
			<AuthGuard>
				<div>Protected Content</div>
			</AuthGuard>,
		)

		expect(screen.queryByText('Protected Content')).toBeNull()
		expect(screen.getByText(/sign in/i)).toBeDefined()
	})

	it('should show 403 when missing required permission', () => {
		mockUseAuthStore.mockImplementation((selector: any) => {
			const state = {
				isAuthenticated: true,
				user: { permissions: [3001] },
				hasPermission: (id: number) => [3001].includes(id),
			}
			return selector(state)
		})

		render(
			<AuthGuard requiredPermission={3005}>
				<div>Admin Content</div>
			</AuthGuard>,
		)

		expect(screen.queryByText('Admin Content')).toBeNull()
		expect(screen.getByText(/insufficient permissions/i)).toBeDefined()
	})

	it('should render children when has required permission', () => {
		mockUseAuthStore.mockImplementation((selector: any) => {
			const state = {
				isAuthenticated: true,
				user: { permissions: [3001, 3005] },
				hasPermission: (id: number) => [3001, 3005].includes(id),
			}
			return selector(state)
		})

		render(
			<AuthGuard requiredPermission={3005}>
				<div>Admin Content</div>
			</AuthGuard>,
		)

		expect(screen.getByText('Admin Content')).toBeDefined()
	})
})
