import { useState } from 'react'
import { useAuthStore } from '../stores/auth-store'

export function LoginPage({ onSuccess }: { onSuccess: () => void }) {
	const login = useAuthStore((s) => s.login)
	const [userId, setUserId] = useState('dev-user-001')
	const [companyId, setCompanyId] = useState('dev-company-001')
	const [displayName, setDisplayName] = useState('Dev User')
	const [error, setError] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)

	const handleLogin = async () => {
		setError(null)
		setLoading(true)
		try {
			const response = await fetch('/api/v1/dev/token', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					userId,
					companyId,
					displayName,
					permissions: [3001, 3002, 3003, 3004, 3005],
				}),
			})

			if (!response.ok) {
				throw new Error(`Token request failed: ${response.status}`)
			}

			const data = await response.json()
			login(data.accessToken, data.expiresIn, {
				userId: data.userId,
				companyId: data.companyId,
				displayName,
				email: 'dev@onebear.local',
				permissions: data.permissions,
			})
			onSuccess()
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Login failed')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50">
			<div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 w-full max-w-md">
				<h1 className="text-2xl font-bold text-gray-900 mb-1">One Bear</h1>
				<p className="text-sm text-gray-500 mb-6">Development Login</p>

				{error && (
					<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">{error}</div>
				)}

				<div className="space-y-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
						<input
							type="text"
							value={userId}
							onChange={(e) => setUserId(e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Company ID</label>
						<input
							type="text"
							value={companyId}
							onChange={(e) => setCompanyId(e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
						<input
							type="text"
							value={displayName}
							onChange={(e) => setDisplayName(e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					<button
						onClick={handleLogin}
						disabled={loading}
						className="w-full bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{loading ? 'Signing in...' : 'Sign In (Dev Mode)'}
					</button>
				</div>

				<p className="text-xs text-gray-400 mt-4 text-center">
					This login is for development only. Production uses GoFive IdP (OAuth2 PKCE).
				</p>
			</div>
		</div>
	)
}
