import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { exchangeCodeForTokens, parseJwt } from '@/lib/keycloak'
import { useAuthStore } from '@/stores/auth-store'

const API_BASE = '/api/v1'

export function AuthCallbackPage() {
	const [error, setError] = useState<string | null>(null)
	const navigate = useNavigate()
	const login = useAuthStore((s) => s.login)

	useEffect(() => {
		const params = new URLSearchParams(window.location.search)
		const code = params.get('code')
		const state = params.get('state')
		const errorParam = params.get('error')

		if (errorParam) {
			setError(`Authentication failed: ${errorParam}`)
			return
		}
		if (!code) {
			setError('No authorization code received.')
			return
		}

		const savedState = sessionStorage.getItem('oauth_state')
		if (state !== savedState) {
			setError('Invalid state parameter.')
			return
		}

		const verifier = sessionStorage.getItem('pkce_verifier')
		if (!verifier) {
			setError('Missing PKCE verifier. Please login again.')
			return
		}

		exchangeCodeForTokens(code, verifier)
			.then(async (tokens) => {
				sessionStorage.removeItem('pkce_verifier')
				sessionStorage.removeItem('oauth_state')

				const idClaims = parseJwt(tokens.id_token)

				// Fetch user profile from One Bear API
				const profileResponse = await fetch(`${API_BASE}/auth/me`, {
					headers: { Authorization: `Bearer ${tokens.access_token}` },
				})

				if (profileResponse.status === 403) {
					setError('ไม่พบบัญชีในระบบ กรุณาติดต่อ Admin ของบริษัท')
					return
				}
				if (!profileResponse.ok) {
					setError('Failed to fetch user profile.')
					return
				}

				const profile = await profileResponse.json()

				login(tokens.access_token, tokens.refresh_token, tokens.expires_in, {
					userId: (idClaims.sub as string) ?? '',
					companyId: profile.companyId,
					displayName: profile.displayName ?? (idClaims.preferred_username as string) ?? '',
					email: (idClaims.email as string) ?? '',
					permissions: profile.permissions ?? [],
				})

				navigate({ to: '/chat' })
			})
			.catch((err) => {
				setError(`Token exchange failed: ${err.message}`)
			})
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	if (error) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-gray-50">
				<div className="max-w-sm space-y-4 rounded-xl bg-white p-8 text-center shadow-lg">
					<p className="text-sm text-error">{error}</p>
					<a href="/" className="text-sm text-primary hover:underline">
						กลับไปหน้า Login
					</a>
				</div>
			</div>
		)
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50">
			<p className="text-t2">กำลังเข้าสู่ระบบ...</p>
		</div>
	)
}
