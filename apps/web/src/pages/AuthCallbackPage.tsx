import { useEffect, useState } from 'react'
import { useAuthStore } from '../stores/auth-store'

/**
 * OAuth2 PKCE callback handler.
 * In production, this receives the authorization code from GoFive IdP
 * and exchanges it for tokens. Currently a placeholder for the dev environment.
 */
export function AuthCallbackPage({ onSuccess }: { onSuccess: () => void }) {
	const login = useAuthStore((s) => s.login)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		const params = new URLSearchParams(window.location.search)
		const code = params.get('code')
		const errorParam = params.get('error')

		if (errorParam) {
			setError(`Authentication failed: ${errorParam}`)
			return
		}

		if (!code) {
			setError('Missing authorization code')
			return
		}

		// TODO: Exchange authorization code for tokens via GoFive IdP token endpoint
		// This will be implemented when production OAuth2 integration is built.
		// For now, redirect back to login.
		setError('OAuth2 callback not yet implemented. Use dev login.')
	}, [login, onSuccess])

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50">
			<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center max-w-md">
				{error ? (
					<>
						<h2 className="text-xl font-semibold text-red-600 mb-2">Authentication Error</h2>
						<p className="text-gray-500 text-sm">{error}</p>
						<a
							href="/"
							className="inline-block mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
						>
							Back to Login
						</a>
					</>
				) : (
					<>
						<h2 className="text-xl font-semibold text-gray-900 mb-2">Authenticating...</h2>
						<p className="text-gray-500 text-sm">Please wait while we complete sign-in.</p>
					</>
				)}
			</div>
		</div>
	)
}
