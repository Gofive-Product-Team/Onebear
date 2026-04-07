const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL as string
const CLIENT_ID = import.meta.env.VITE_KEYCLOAK_CLIENT_ID as string
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI as string
const POST_LOGOUT_REDIRECT_URI = import.meta.env.VITE_POST_LOGOUT_REDIRECT_URI as string

function generateRandomString(length: number): string {
	const array = new Uint8Array(length)
	crypto.getRandomValues(array)
	return Array.from(array, (b) => b.toString(36).padStart(2, '0'))
		.join('')
		.slice(0, length)
}

async function sha256(plain: string): Promise<ArrayBuffer> {
	const encoder = new TextEncoder()
	return crypto.subtle.digest('SHA-256', encoder.encode(plain))
}

function base64UrlEncode(buffer: ArrayBuffer): string {
	return btoa(String.fromCharCode(...new Uint8Array(buffer)))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/, '')
}

export async function generatePKCE(): Promise<{ verifier: string; challenge: string }> {
	const verifier = generateRandomString(64)
	const hash = await sha256(verifier)
	const challenge = base64UrlEncode(hash)
	return { verifier, challenge }
}

export function getLoginUrl(codeChallenge: string, state: string): string {
	const params = new URLSearchParams({
		client_id: CLIENT_ID,
		response_type: 'code',
		scope: 'openid email profile',
		redirect_uri: REDIRECT_URI,
		code_challenge: codeChallenge,
		code_challenge_method: 'S256',
		state,
	})
	return `${KEYCLOAK_URL}/protocol/openid-connect/auth?${params}`
}

export function getLogoutUrl(): string {
	const params = new URLSearchParams({
		client_id: CLIENT_ID,
		post_logout_redirect_uri: POST_LOGOUT_REDIRECT_URI,
	})
	return `${KEYCLOAK_URL}/protocol/openid-connect/logout?${params}`
}

export async function exchangeCodeForTokens(
	code: string,
	codeVerifier: string,
): Promise<{ access_token: string; refresh_token: string; expires_in: number; id_token: string }> {
	const response = await fetch(`${KEYCLOAK_URL}/protocol/openid-connect/token`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			grant_type: 'authorization_code',
			client_id: CLIENT_ID,
			code,
			redirect_uri: REDIRECT_URI,
			code_verifier: codeVerifier,
		}),
	})
	if (!response.ok) {
		const error = await response.text()
		throw new Error(`Token exchange failed: ${response.status} ${error}`)
	}
	return response.json()
}

export async function refreshAccessToken(
	refreshToken: string,
): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
	const response = await fetch(`${KEYCLOAK_URL}/protocol/openid-connect/token`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			grant_type: 'refresh_token',
			client_id: CLIENT_ID,
			refresh_token: refreshToken,
		}),
	})
	if (!response.ok) throw new Error('Token refresh failed')
	return response.json()
}

export function parseJwt(token: string): Record<string, unknown> {
	const base64Url = token.split('.')[1]
	const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
	return JSON.parse(atob(base64))
}
