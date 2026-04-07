import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth-store'

export interface IntegrationCredentialSummary {
	channelId: string | null
	pageName: string | null
	pageId: string | null
	phoneNumber: string | null
	shopId: string | null
	shopName: string | null
	emailAddress: string | null
	hasAccessToken: boolean
	hasRefreshToken: boolean
	tokenExpiresAt: number | null
	tokenStatus: string | null
}

export interface Integration {
	id: string
	platform: string
	name: string | null
	status: string
	isActive: boolean
	hasChatFeature: boolean
	webhookUrl: string | null
	credentials: IntegrationCredentialSummary | null
	createdTimestamp: number
	updatedTimestamp: number | null
}

export interface GreetingMessage {
	id: string
	type: 'text' | 'image'
	content: string
	enabled: boolean
}

export interface AutoReplyRule {
	id: string
	keywords: string[]
	response: string
	enabled: boolean
}

export interface AutoAssignmentConfig {
	enabled: boolean
	mode: 'round-robin'
	agentIds: string[]
}

export interface ShortcutCategory {
	id: string
	name: string
	shortcuts: Shortcut[]
}

export interface Shortcut {
	id: string
	keyword: string
	content: string
	categoryId: string
}

function useCompanyId() {
	const user = useAuthStore((s) => s.user)
	return user?.companyId ?? ''
}

export function useIntegrations() {
	const companyId = useCompanyId()

	return useQuery({
		queryKey: ['integrations', companyId],
		queryFn: () => api.integrations.list(companyId) as Promise<Integration[]>,
		enabled: !!companyId,
	})
}

export function useIntegration(integrationId: string) {
	const companyId = useCompanyId()

	return useQuery({
		queryKey: ['integrations', companyId, integrationId],
		queryFn: () => api.integrations.get(companyId, integrationId) as Promise<Integration>,
		enabled: !!companyId && !!integrationId,
	})
}

export function useConnectIntegration() {
	const companyId = useCompanyId()
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({ platform, body }: { platform: string; body: object }) =>
			api.integrations.connect(companyId, platform, body),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['integrations', companyId] })
		},
	})
}

export function useDeleteIntegration() {
	const companyId = useCompanyId()
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (integrationId: string) => api.integrations.delete(companyId, integrationId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['integrations', companyId] })
		},
	})
}

export function useUpdateIntegration() {
	const companyId = useCompanyId()
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({ integrationId, body }: { integrationId: string; body: object }) =>
			api.integrations.update(companyId, integrationId, body),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['integrations', companyId] })
		},
	})
}

export function useGreetings(integrationId: string) {
	const companyId = useCompanyId()

	return useQuery({
		queryKey: ['integrations', companyId, integrationId, 'greetings'],
		queryFn: () => api.integrations.greetings(companyId, integrationId) as Promise<GreetingMessage[]>,
		enabled: !!companyId && !!integrationId,
	})
}

export function useUpdateGreetings(integrationId: string) {
	const companyId = useCompanyId()
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (body: object) => api.integrations.updateGreetings(companyId, integrationId, body),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['integrations', companyId, integrationId, 'greetings'],
			})
		},
	})
}

export function useAutoReplies(integrationId: string) {
	const companyId = useCompanyId()

	return useQuery({
		queryKey: ['integrations', companyId, integrationId, 'auto-replies'],
		queryFn: () => api.integrations.autoReplies(companyId, integrationId) as Promise<AutoReplyRule[]>,
		enabled: !!companyId && !!integrationId,
	})
}

export function useUpdateAutoReplies(integrationId: string) {
	const companyId = useCompanyId()
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (body: object) => api.integrations.updateAutoReplies(companyId, integrationId, body),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['integrations', companyId, integrationId, 'auto-replies'],
			})
		},
	})
}

export function useAutoAssignment(integrationId: string) {
	const companyId = useCompanyId()

	return useQuery({
		queryKey: ['integrations', companyId, integrationId, 'auto-assignment'],
		queryFn: () =>
			api.integrations.autoAssignment(companyId, integrationId) as Promise<AutoAssignmentConfig>,
		enabled: !!companyId && !!integrationId,
	})
}

export function useUpdateAutoAssignment(integrationId: string) {
	const companyId = useCompanyId()
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (body: object) =>
			api.integrations.updateAutoAssignment(companyId, integrationId, body),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['integrations', companyId, integrationId, 'auto-assignment'],
			})
		},
	})
}

export function useShortcuts(integrationId: string) {
	const companyId = useCompanyId()

	return useQuery({
		queryKey: ['integrations', companyId, integrationId, 'shortcuts'],
		queryFn: () =>
			api.integrations.shortcuts(companyId, integrationId) as Promise<ShortcutCategory[]>,
		enabled: !!companyId && !!integrationId,
	})
}

export function useAddShortcut(integrationId: string) {
	const companyId = useCompanyId()
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (body: object) => api.integrations.addShortcut(companyId, integrationId, body),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['integrations', companyId, integrationId, 'shortcuts'],
			})
		},
	})
}

export function useDeleteShortcut(integrationId: string) {
	const companyId = useCompanyId()
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (shortcutId: string) =>
			api.integrations.deleteShortcut(companyId, integrationId, shortcutId),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['integrations', companyId, integrationId, 'shortcuts'],
			})
		},
	})
}

export function useUpdateShortcut(integrationId: string) {
	const companyId = useCompanyId()
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({ shortcutId, body }: { shortcutId: string; body: object }) =>
			api.integrations.updateShortcut(companyId, integrationId, shortcutId, body),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['integrations', companyId, integrationId, 'shortcuts'],
			})
		},
	})
}

export function useUpdateCategory(integrationId: string) {
	const companyId = useCompanyId()
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({ categoryId, body }: { categoryId: string; body: { name: string } }) =>
			api.integrations.updateCategory(companyId, integrationId, categoryId, body),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['integrations', companyId, integrationId, 'shortcuts'],
			})
		},
	})
}

export function useDeleteCategory(integrationId: string) {
	const companyId = useCompanyId()
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (categoryId: string) =>
			api.integrations.deleteCategory(companyId, integrationId, categoryId),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['integrations', companyId, integrationId, 'shortcuts'],
			})
		},
	})
}

export function useUsers() {
	const companyId = useCompanyId()

	return useQuery({
		queryKey: ['users', companyId],
		queryFn: () =>
			api.users.list(companyId) as Promise<
				Array<{ id: string; displayName: string; email: string }>
			>,
		enabled: !!companyId,
	})
}
