import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth-store'

export interface OAuthAuthUrlResponse {
	authUrl: string
	state: string
}

export interface OAuthConnectResponse {
	integration: {
		id: string
		platform: string
		name: string | null
		status: string
		webhookUrl: string | null
	}
	webhookUrl: string
}

function useCompanyId() {
	const user = useAuthStore((s) => s.user)
	return user?.companyId ?? ''
}

export function useOAuthAuthUrl() {
	const companyId = useCompanyId()

	return useMutation({
		mutationFn: (platform: string) => api.oauth.getAuthUrl(companyId, platform) as Promise<OAuthAuthUrlResponse>,
	})
}

export function useOAuthCallback() {
	const companyId = useCompanyId()
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({ platform, ...body }: { platform: string; code: string; state: string; shopId?: string }) =>
			api.oauth.callback(companyId, platform, body) as Promise<OAuthConnectResponse>,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['integrations', companyId] })
		},
	})
}

export function useFacebookConnect() {
	const companyId = useCompanyId()
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (body: { accessToken: string; name: string }) =>
			api.oauth.facebookToken(companyId, body) as Promise<OAuthConnectResponse>,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['integrations', companyId] })
		},
	})
}

export function useWhatsAppConnect() {
	const companyId = useCompanyId()
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (body: { accessToken: string }) =>
			api.oauth.whatsappToken(companyId, body) as Promise<OAuthConnectResponse>,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['integrations', companyId] })
		},
	})
}
