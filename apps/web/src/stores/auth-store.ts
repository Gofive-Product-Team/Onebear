import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface UserProfile {
	userId: string
	companyId: string
	displayName: string
	email: string
	permissions: number[]
}

interface AuthState {
	token: string | null
	tokenExpiry: number | null
	user: UserProfile | null
	isAuthenticated: boolean
	isLoading: boolean
	login: (token: string, expiresIn: number, user: UserProfile) => void
	logout: () => void
	setLoading: (loading: boolean) => void
	isTokenExpired: () => boolean
	hasPermission: (permissionId: number) => boolean
}

export const useAuthStore = create<AuthState>()(
	persist(
		(set, get) => ({
			token: null,
			tokenExpiry: null,
			user: null,
			isAuthenticated: false,
			isLoading: false,
			login: (token, expiresIn, user) =>
				set({
					token,
					tokenExpiry: Date.now() + expiresIn * 1000,
					user,
					isAuthenticated: true,
					isLoading: false,
				}),
			logout: () =>
				set({
					token: null,
					tokenExpiry: null,
					user: null,
					isAuthenticated: false,
					isLoading: false,
				}),
			setLoading: (loading) => set({ isLoading: loading }),
			isTokenExpired: () => {
				const { tokenExpiry } = get()
				if (!tokenExpiry) return true
				return Date.now() > tokenExpiry - 60_000 // 1 minute buffer
			},
			hasPermission: (permissionId) => {
				const { user } = get()
				return user?.permissions.includes(permissionId) ?? false
			},
		}),
		{ name: 'one-bear-auth' },
	),
)

export { Permission } from '@one-bear/shared-types'
