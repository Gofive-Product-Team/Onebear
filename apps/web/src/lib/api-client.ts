import { useAuthStore } from '../stores/auth-store'
import { ApiError, type ProblemDetails } from './errors'

export { ApiError } from './errors'

const API_BASE = import.meta.env.VITE_API_BASE_URL
	? `${import.meta.env.VITE_API_BASE_URL}/api/v1`
	: '/api/v1'

async function fetchApi<T>(path: string, options?: RequestInit, retryCount = 0): Promise<T> {
	const { token, isTokenExpired, logout, tryRefreshToken } = useAuthStore.getState()

	if (token && isTokenExpired()) {
		const refreshed = await tryRefreshToken()
		if (!refreshed) {
			throw new ApiError(401, 'Token expired', null)
		}
	}

	// Re-read token after potential refresh (the destructured `token` may be stale)
	const currentToken = useAuthStore.getState().token

	const correlationId = crypto.randomUUID()

	const isFormData = options?.body instanceof FormData

	const response = await fetch(`${API_BASE}${path}`, {
		...options,
		headers: {
			// Skip Content-Type for FormData — let the browser set multipart boundary
			...(isFormData ? {} : { 'Content-Type': 'application/json' }),
			'X-Correlation-Id': correlationId,
			...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
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
	const parsed = JSON.parse(text)
	// Auto-unwrap API response wrapper { data: [...] } but NOT paginated responses
	// Paginated responses have { data, continuationToken, hasMore } — don't unwrap those
	if (
		parsed && typeof parsed === 'object' &&
		'data' in parsed && Array.isArray(parsed.data) &&
		!('continuationToken' in parsed) && !('hasMore' in parsed)
	) {
		return parsed.data as T
	}
	return parsed as T
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
		pin: (companyId: string, roomId: string) =>
			fetchApi(`/companies/${companyId}/rooms/${roomId}/pin`, { method: 'POST' }),
		unpin: (companyId: string, roomId: string) =>
			fetchApi(`/companies/${companyId}/rooms/${roomId}/pin`, { method: 'DELETE' }),
		done: (companyId: string, roomId: string) =>
			fetchApi(`/companies/${companyId}/rooms/${roomId}/done`, { method: 'POST' }),
		returnToAi: (companyId: string, roomId: string) =>
			fetchApi(`/companies/${companyId}/rooms/${roomId}/return-to-ai`, { method: 'POST' }),
		spam: (companyId: string) => fetchApi(`/companies/${companyId}/rooms/spam`),
		notSpam: (companyId: string, roomId: string) =>
			fetchApi(`/companies/${companyId}/rooms/${roomId}/not-spam`, { method: 'POST' }),
		updateFollowUp: (companyId: string, roomId: string, body: object) =>
			fetchApi(`/companies/${companyId}/rooms/${roomId}/follow-up`, { method: 'PUT', body: JSON.stringify(body) }),
	},
	messages: {
		list: (companyId: string, roomId: string, params?: Record<string, string>) =>
			fetchApi(`/companies/${companyId}/rooms/${roomId}/messages${params ? '?' + new URLSearchParams(params) : ''}`),
		send: (companyId: string, roomId: string, body: object) =>
			fetchApi(`/companies/${companyId}/rooms/${roomId}/messages`, { method: 'POST', body: JSON.stringify(body) }),
		get: (companyId: string, roomId: string, messageId: string) =>
			fetchApi(`/companies/${companyId}/rooms/${roomId}/messages/${messageId}`),
		pinnedMessages: (companyId: string, roomId: string) =>
			fetchApi(`/companies/${companyId}/rooms/${roomId}/pinned-messages`),
		pinMessage: (companyId: string, roomId: string, messageId: string) =>
			fetchApi(`/companies/${companyId}/rooms/${roomId}/messages/${messageId}/pin`, { method: 'POST' }),
		unpinMessage: (companyId: string, roomId: string, messageId: string) =>
			fetchApi(`/companies/${companyId}/rooms/${roomId}/messages/${messageId}/pin`, { method: 'DELETE' }),
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
		update: (companyId: string, integrationId: string, body: object) =>
			fetchApi(`/companies/${companyId}/integrations/${integrationId}`, {
				method: 'PUT',
				body: JSON.stringify(body),
			}),
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
		updateShortcut: (companyId: string, integrationId: string, shortcutId: string, body: object) =>
			fetchApi(`/companies/${companyId}/integrations/${integrationId}/shortcuts/${shortcutId}`, {
				method: 'PUT',
				body: JSON.stringify(body),
			}),
		updateCategory: (companyId: string, integrationId: string, categoryId: string, body: object) =>
			fetchApi(`/companies/${companyId}/integrations/${integrationId}/categories/${categoryId}`, {
				method: 'PUT',
				body: JSON.stringify(body),
			}),
		deleteCategory: (companyId: string, integrationId: string, categoryId: string) =>
			fetchApi(`/companies/${companyId}/integrations/${integrationId}/categories/${categoryId}`, {
				method: 'DELETE',
			}),
	},
	users: {
		me: (companyId: string) => fetchApi(`/companies/${companyId}/users/me`),
		notifications: (companyId: string) => fetchApi(`/companies/${companyId}/users/me/notifications`),
		updateNotifications: (companyId: string, body: object) =>
			fetchApi(`/companies/${companyId}/users/me/notifications`, { method: 'PUT', body: JSON.stringify(body) }),
		list: (companyId: string) => fetchApi(`/companies/${companyId}/users`),
	},
	customers: {
		list: (companyId: string, params?: Record<string, string>) =>
			fetchApi(`/companies/${companyId}/customers${params ? '?' + new URLSearchParams(params) : ''}`),
		get: (companyId: string, id: string) =>
			fetchApi(`/companies/${companyId}/customers/${id}`),
		segmentCounts: (companyId: string) =>
			fetchApi(`/companies/${companyId}/customers/segment-counts`),
		create: (companyId: string, body: object) =>
			fetchApi(`/companies/${companyId}/customers`, { method: 'POST', body: JSON.stringify(body) }),
		update: (companyId: string, id: string, body: object) =>
			fetchApi(`/companies/${companyId}/customers/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
		delete: (companyId: string, id: string) =>
			fetchApi(`/companies/${companyId}/customers/${id}`, { method: 'DELETE' }),
		addTag: (companyId: string, id: string, name: string) =>
			fetchApi(`/companies/${companyId}/customers/${id}/tags`, { method: 'POST', body: JSON.stringify({ name }) }),
		removeTag: (companyId: string, id: string, name: string) =>
			fetchApi(`/companies/${companyId}/customers/${id}/tags/${encodeURIComponent(name)}`, { method: 'DELETE' }),
		setPinnedNote: (companyId: string, id: string, note: string) =>
			fetchApi(`/companies/${companyId}/customers/${id}/pinned-note`, { method: 'PUT', body: JSON.stringify({ note }) }),
		removePinnedNote: (companyId: string, id: string) =>
			fetchApi(`/companies/${companyId}/customers/${id}/pinned-note`, { method: 'DELETE' }),
		promote: (companyId: string, id: string) =>
			fetchApi(`/companies/${companyId}/customers/${id}/promote`, { method: 'POST' }),
		kpiSnapshot: (companyId: string) =>
			fetchApi(`/companies/${companyId}/customers/kpi-snapshot`),
		activity: (companyId: string, customerId: string, params?: Record<string, string>) =>
			fetchApi(`/companies/${companyId}/customers/${customerId}/activity${params ? '?' + new URLSearchParams(params) : ''}`),
		linkContact: (companyId: string, id: string, contactCustomerId: string) =>
			fetchApi(`/companies/${companyId}/customers/${id}/contacts`, {
				method: 'POST',
				body: JSON.stringify({ contactCustomerId }),
			}),
		unlinkContact: (companyId: string, id: string, contactId: string) =>
			fetchApi(`/companies/${companyId}/customers/${id}/contacts/${contactId}`, { method: 'DELETE' }),
		contacts: (companyId: string, id: string) =>
			fetchApi(`/companies/${companyId}/customers/${id}/contacts`),
		checkDuplicate: (companyId: string, params: Record<string, string>) =>
			fetchApi(`/companies/${companyId}/customers/check-duplicate?${new URLSearchParams(params)}`),
		bulkFollowup: (companyId: string, body: { customerIds: string[]; channel: string; message: string }) =>
			fetchApi(`/companies/${companyId}/customers/bulk-followup`, { method: 'POST', body: JSON.stringify(body) }),
		snooze: (companyId: string, id: string) =>
			fetchApi(`/companies/${companyId}/customers/${id}/snooze`, { method: 'POST' }),
	},
	companies: {
		featureSettings: (companyId: string) => fetchApi(`/companies/${companyId}/feature-settings`),
	},
	company: {
		get: (companyId: string) => fetchApi(`/companies/${companyId}/profile`),
		update: (companyId: string, body: object) =>
			fetchApi(`/companies/${companyId}/profile`, { method: 'PUT', body: JSON.stringify(body) }),
	},
	members: {
		list: (companyId: string) => fetchApi(`/companies/${companyId}/members`),
		add: (companyId: string, body: { email: string; roleId: string }) =>
			fetchApi(`/companies/${companyId}/members`, { method: 'POST', body: JSON.stringify(body) }),
		update: (companyId: string, id: string, body: { roleId: string }) =>
			fetchApi(`/companies/${companyId}/members/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
		remove: (companyId: string, id: string) =>
			fetchApi(`/companies/${companyId}/members/${id}`, { method: 'DELETE' }),
	},
	roles: {
		list: (companyId: string) => fetchApi(`/companies/${companyId}/roles`),
		create: (companyId: string, body: { name: string; description?: string; permissions: number[] }) =>
			fetchApi(`/companies/${companyId}/roles`, { method: 'POST', body: JSON.stringify(body) }),
		update: (companyId: string, roleId: string, body: { name?: string; description?: string; permissions?: number[] }) =>
			fetchApi(`/companies/${companyId}/roles/${roleId}`, { method: 'PUT', body: JSON.stringify(body) }),
		delete: (companyId: string, roleId: string) =>
			fetchApi(`/companies/${companyId}/roles/${roleId}`, { method: 'DELETE' }),
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
		faq: (companyId: string) =>
			fetchApi(`/companies/${companyId}/chatbot/faq`),
		addFaq: (companyId: string, body: { question: string; answer: string }) =>
			fetchApi(`/companies/${companyId}/chatbot/faq`, { method: 'POST', body: JSON.stringify(body) }),
		updateFaq: (companyId: string, faqId: string, body: { question: string; answer: string }) =>
			fetchApi(`/companies/${companyId}/chatbot/faq/${faqId}`, { method: 'PUT', body: JSON.stringify(body) }),
		deleteFaq: (companyId: string, faqId: string) =>
			fetchApi(`/companies/${companyId}/chatbot/faq/${faqId}`, { method: 'DELETE' }),
		importCsv: (companyId: string, file: File) => {
			const formData = new FormData()
			formData.append('file', file)
			return fetchApi(`/companies/${companyId}/chatbot/faq/import-csv`, { method: 'POST', body: formData })
		},
		test: (companyId: string, message: string) =>
			fetchApi(`/companies/${companyId}/chatbot/test`, { method: 'POST', body: JSON.stringify({ message }) }),
		insights: (companyId: string) =>
			fetchApi(`/companies/${companyId}/chatbot/insights/unanswered`),
		addInsightToFaq: (companyId: string, id: string) =>
			fetchApi(`/companies/${companyId}/chatbot/insights/${id}/add-to-faq`, { method: 'POST' }),
		dismissInsight: (companyId: string, id: string) =>
			fetchApi(`/companies/${companyId}/chatbot/insights/${id}`, { method: 'DELETE' }),
		credit: (companyId: string) =>
			fetchApi(`/companies/${companyId}/chatbot/credit`),
		topUp: (companyId: string, amount: number) =>
			fetchApi(`/companies/${companyId}/chatbot/credit/topup`, { method: 'POST', body: JSON.stringify({ amount }) }),
	},
	dashboard: {
		get: (companyId: string, from: string, to: string) =>
			fetchApi(`/companies/${companyId}/dashboard?from=${from}&to=${to}`),
	},
	oauth: {
		getAuthUrl: (companyId: string, platform: string) =>
			fetchApi(`/companies/${companyId}/oauth/${platform}/auth-url`),
		callback: (companyId: string, platform: string, body: object) =>
			fetchApi(`/companies/${companyId}/oauth/${platform}/callback`, { method: 'POST', body: JSON.stringify(body) }),
		facebookToken: (companyId: string, body: object) =>
			fetchApi(`/companies/${companyId}/oauth/facebook/token`, { method: 'POST', body: JSON.stringify(body) }),
		whatsappToken: (companyId: string, body: object) =>
			fetchApi(`/companies/${companyId}/oauth/whatsapp/token`, { method: 'POST', body: JSON.stringify(body) }),
	},
}
