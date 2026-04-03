import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth-store'

export interface NotificationPreferences {
	pushEnabled: boolean
	emailEnabled: boolean
	soundEnabled: boolean
	newMessageEnabled: boolean
	roomAssignmentEnabled: boolean
	mentionEnabled: boolean
}

function useCompanyId() {
	const user = useAuthStore((s) => s.user)
	return user?.companyId ?? ''
}

export function useNotificationPreferences() {
	const companyId = useCompanyId()

	return useQuery({
		queryKey: ['notifications', companyId],
		queryFn: () => api.users.notifications(companyId) as Promise<NotificationPreferences>,
		enabled: !!companyId,
	})
}

export function useUpdateNotificationPreferences() {
	const companyId = useCompanyId()
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (body: NotificationPreferences) => api.users.updateNotifications(companyId, body),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['notifications', companyId] })
		},
	})
}
