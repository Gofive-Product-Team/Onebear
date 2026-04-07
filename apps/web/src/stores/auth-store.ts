import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { refreshAccessToken } from '@/lib/keycloak'

export interface UserProfile {
	userId: string
	companyId: string
	displayName: string
	email: string
	permissions: number[]
}

interface AuthState {
	token: string | null
	refreshToken: string | null
	tokenExpiry: number | null
	user: UserProfile | null
	isAuthenticated: boolean
	isLoading: boolean
	login: (token: string, refreshToken: string, expiresIn: number, user: UserProfile) => void
	logout: () => void
	setLoading: (loading: boolean) => void
	isTokenExpired: () => boolean
	hasPermission: (permissionId: number) => boolean
	tryRefreshToken: () => Promise<boolean>
}

export const useAuthStore = create<AuthState>()(
	persist(
		(set, get) => ({
			token: null,
			refreshToken: null,
			tokenExpiry: null,
			user: null,
			isAuthenticated: false,
			isLoading: false,

			login: (token, refreshToken, expiresIn, user) =>
				set({
					token,
					refreshToken,
					tokenExpiry: Date.now() + expiresIn * 1000,
					user,
					isAuthenticated: true,
					isLoading: false,
				}),

			logout: () =>
				set({
					token: null,
					refreshToken: null,
					tokenExpiry: null,
					user: null,
					isAuthenticated: false,
					isLoading: false,
				}),

			setLoading: (isLoading) => set({ isLoading }),

			isTokenExpired: () => {
				const { tokenExpiry } = get()
				if (!tokenExpiry) return true
				return Date.now() > tokenExpiry - 60_000 // 1 minute buffer
			},

			hasPermission: (permissionId) => {
				const { user } = get()
				return user?.permissions?.includes(permissionId) ?? false
			},

			tryRefreshToken: async () => {
				const { refreshToken, user } = get()
				if (!refreshToken || !user) return false
				try {
					const result = await refreshAccessToken(refreshToken)
					set({
						token: result.access_token,
						refreshToken: result.refresh_token,
						tokenExpiry: Date.now() + result.expires_in * 1000,
					})
					return true
				} catch {
					get().logout()
					return false
				}
			},
		}),
		{ name: 'one-bear-auth' },
	),
)

export { Permission } from '@one-bear/shared-types'
