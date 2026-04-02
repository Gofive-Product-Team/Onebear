import { useAuthStore } from '../stores/auth-store'
import { ApiError, type ProblemDetails } from './errors'

export { ApiError } from './errors'

const API_BASE = '/api/v1'

async function fetchApi<T>(path: string, options?: RequestInit, retryCount = 0): Promise<T> {
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
		// Retry once on 5xx
		if (response.status >= 500 && retryCount < 1) {
			await new Promise((resolve) => setTimeout(resolve, 1000))
			return fetchApi<T>(path, options, retryCount + 1)
		}

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
			body as ProblemDetails | null,
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
		get: (companyId: string, integrationId: string) =>
			fetchApi(`/companies/${companyId}/integrations/${integrationId}`),
		connect: (companyId: string, platform: string, body: object) =>
			fetchApi(`/companies/${companyId}/integrations/${platform}`, {
				method: 'POST',
				body: JSON.stringify(body),
			}),
		delete: (companyId: string, integrationId: string) =>
			fetchApi(`/companies/${companyId}/integrations/${integrationId}`, { method: 'DELETE' }),
		greetings: (companyId: string, integrationId: string) =>
			fetchApi(`/companies/${companyId}/integrations/${integrationId}/greetings`),
		updateGreetings: (companyId: string, integrationId: string, body: object) =>
			fetchApi(`/companies/${companyId}/integrations/${integrationId}/greetings`, {
				method: 'PUT',
				body: JSON.stringify(body),
			}),
		autoReplies: (companyId: string, integrationId: string) =>
			fetchApi(`/companies/${companyId}/integrations/${integrationId}/auto-replies`),
		updateAutoReplies: (companyId: string, integrationId: string, body: object) =>
			fetchApi(`/companies/${companyId}/integrations/${integrationId}/auto-replies`, {
				method: 'PUT',
				body: JSON.stringify(body),
			}),
		autoAssignment: (companyId: string, integrationId: string) =>
			fetchApi(`/companies/${companyId}/integrations/${integrationId}/auto-assignment`),
		updateAutoAssignment: (companyId: string, integrationId: string, body: object) =>
			fetchApi(`/companies/${companyId}/integrations/${integrationId}/auto-assignment`, {
				method: 'PUT',
				body: JSON.stringify(body),
			}),
		shortcuts: (companyId: string, integrationId: string) =>
			fetchApi(`/companies/${companyId}/integrations/${integrationId}/shortcuts`),
		addShortcut: (companyId: string, integrationId: string, body: object) =>
			fetchApi(`/companies/${companyId}/integrations/${integrationId}/shortcuts`, {
				method: 'POST',
				body: JSON.stringify(body),
			}),
		deleteShortcut: (companyId: string, integrationId: string, shortcutId: string) =>
			fetchApi(`/companies/${companyId}/integrations/${integrationId}/shortcuts/${shortcutId}`, {
				method: 'DELETE',
			}),
	},
	users: {
		me: (companyId: string) => fetchApi(`/companies/${companyId}/users/me`),
		notifications: (companyId: string) => fetchApi(`/companies/${companyId}/users/me/notifications`),
		list: (companyId: string) => fetchApi(`/companies/${companyId}/users`),
	},
	customers: {
		list: (companyId: string, params?: Record<string, string>) =>
			fetchApi(`/companies/${companyId}/customers${params ? '?' + new URLSearchParams(params) : ''}`),
		get: (companyId: string, customerId: string) =>
			fetchApi(`/companies/${companyId}/customers/${customerId}`),
	},
	companies: {
		featureSettings: (companyId: string) => fetchApi(`/companies/${companyId}/feature-settings`),
	},
	chatbot: {
		configuration: (companyId: string) => fetchApi(`/companies/${companyId}/chatbot/configuration`),
		update: (companyId: string, body: object) =>
			fetchApi(`/companies/${companyId}/chatbot/configuration`, {
				method: 'PUT',
				body: JSON.stringify(body),
			}),
		knowledgeSources: (companyId: string) =>
			fetchApi(`/companies/${companyId}/chatbot/knowledge-sources`),
		addKnowledgeSource: (companyId: string, body: object) =>
			fetchApi(`/companies/${companyId}/chatbot/knowledge-sources`, {
				method: 'POST',
				body: JSON.stringify(body),
			}),
		deleteKnowledgeSource: (companyId: string, sourceId: string) =>
			fetchApi(`/companies/${companyId}/chatbot/knowledge-sources/${sourceId}`, {
				method: 'DELETE',
			}),
	},
}
