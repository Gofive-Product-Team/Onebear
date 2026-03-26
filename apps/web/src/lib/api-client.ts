import { useAuthStore } from '../stores/auth-store'

const API_BASE = '/api/v1'

export class ApiError extends Error {
	constructor(
		public status: number,
		public statusText: string,
		public body: unknown,
		public correlationId?: string,
	) {
		super(`API ${status}: ${statusText}`)
		this.name = 'ApiError'
	}
}

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
	const { token, isTokenExpired, logout } = useAuthStore.getState()

	if (token && isTokenExpired()) {
		logout()
		throw new ApiError(401, 'Token expired', null)
	}

	const correlationId = crypto.randomUUID()

	const response = await fetch(`${API_BASE}${path}`, {
		...options,
		headers: {
			'Content-Type': 'application/json',
			'X-Correlation-Id': correlationId,
			...(token ? { Authorization: `Bearer ${token}` } : {}),
			...options?.headers,
		},
	})

	if (!response.ok) {
		if (response.status === 401) {
			logout()
		}

		let body: unknown = null
		try {
			body = await response.json()
		} catch {
			// Response body is not JSON
		}

		throw new ApiError(
			response.status,
			response.statusText,
			body,
			response.headers.get('X-Correlation-Id') ?? correlationId,
		)
	}

	const text = await response.text()
	if (!text) return {} as T
	return JSON.parse(text) as T
}

export const api = {
	rooms: {
		list: (companyId: string, params?: Record<string, string>) =>
			fetchApi(`/companies/${companyId}/rooms${params ? '?' + new URLSearchParams(params) : ''}`),
		get: (companyId: string, roomId: string) => fetchApi(`/companies/${companyId}/rooms/${roomId}`),
		getBadgeCount: (companyId: string) => fetchApi(`/companies/${companyId}/rooms/badge-count`),
		search: (companyId: string, body: object) =>
			fetchApi(`/companies/${companyId}/rooms/search`, { method: 'POST', body: JSON.stringify(body) }),
		resolve: (companyId: string, roomId: string) =>
			fetchApi(`/companies/${companyId}/rooms/${roomId}/resolve`, { method: 'POST' }),
		close: (companyId: string, roomId: string) =>
			fetchApi(`/companies/${companyId}/rooms/${roomId}/close`, { method: 'POST' }),
	},
	messages: {
		list: (companyId: string, roomId: string, params?: Record<string, string>) =>
			fetchApi(`/companies/${companyId}/rooms/${roomId}/messages${params ? '?' + new URLSearchParams(params) : ''}`),
		send: (companyId: string, roomId: string, body: object) =>
			fetchApi(`/companies/${companyId}/rooms/${roomId}/messages`, { method: 'POST', body: JSON.stringify(body) }),
		get: (companyId: string, roomId: string, messageId: string) =>
			fetchApi(`/companies/${companyId}/rooms/${roomId}/messages/${messageId}`),
	},
	integrations: {
		list: (companyId: string) => fetchApi(`/companies/${companyId}/integrations`),
	},
	users: {
		me: (companyId: string) => fetchApi(`/companies/${companyId}/users/me`),
		notifications: (companyId: string) => fetchApi(`/companies/${companyId}/users/me/notifications`),
	},
	companies: {
		featureSettings: (companyId: string) => fetchApi(`/companies/${companyId}/feature-settings`),
	},
	chatbot: {
		configuration: (companyId: string) => fetchApi(`/companies/${companyId}/chatbot/configuration`),
	},
}
