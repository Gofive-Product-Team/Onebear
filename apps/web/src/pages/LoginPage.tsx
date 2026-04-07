import { useState } from 'react'
import { generatePKCE, getLoginUrl } from '@/lib/keycloak'

export function LoginPage() {
	const [loading, setLoading] = useState(false)

	const handleLogin = async () => {
		setLoading(true)
		const { verifier, challenge } = await generatePKCE()
		const state = crypto.randomUUID()
		sessionStorage.setItem('pkce_verifier', verifier)
		sessionStorage.setItem('oauth_state', state)
		window.location.href = getLoginUrl(challenge, state)
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50">
			<div className="w-full max-w-sm space-y-6 rounded-xl bg-white p-8 shadow-lg">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-t1">One Bear</h1>
					<p className="mt-1 text-sm text-t3">Multi-platform messaging for your business</p>
				</div>
				<button
					onClick={handleLogin}
					disabled={loading}
					className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
				>
					{loading ? 'Redirecting...' : 'เข้าสู่ระบบ'}
				</button>
				<div className="text-center">
					<a href="/register" className="text-sm text-primary hover:underline">
						สมัครใช้งาน — สร้างร้านค้าใหม่
					</a>
				</div>
			</div>
		</div>
	)
}
