const API_BASE = '/api/v1'

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('one-bear-auth')
  const parsed = token ? JSON.parse(token) : null

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(parsed?.state?.token ? { Authorization: `Bearer ${parsed.state.token}` } : {}),
      ...options?.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }

  return response.json()
}

export const api = {
  rooms: {
    list: (companyId: string, params?: Record<string, string>) =>
      fetchApi(`/companies/${companyId}/rooms?${new URLSearchParams(params)}`),
    get: (companyId: string, roomId: string) =>
      fetchApi(`/companies/${companyId}/rooms/${roomId}`),
    getBadgeCount: (companyId: string) =>
      fetchApi(`/companies/${companyId}/rooms/badge-count`),
  },
  messages: {
    list: (companyId: string, roomId: string) =>
      fetchApi(`/companies/${companyId}/rooms/${roomId}/messages`),
    send: (companyId: string, roomId: string, body: object) =>
      fetchApi(`/companies/${companyId}/rooms/${roomId}/messages`, { method: 'POST', body: JSON.stringify(body) }),
  },
  integrations: {
    list: (companyId: string) =>
      fetchApi(`/companies/${companyId}/integrations`),
  },
  users: {
    me: (companyId: string) =>
      fetchApi(`/companies/${companyId}/users/me`),
  },
  companies: {
    featureSettings: (companyId: string) =>
      fetchApi(`/companies/${companyId}/feature-settings`),
  },
}
