import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth-store'

export interface RoleItem {
	id: string
	companyId: string
	name: string
	description: string | null
	permissions: number[]
	isSystem: boolean
	isOwnerRole: boolean
	createdTimestamp: number
}

function useCompanyId() {
	const user = useAuthStore((s) => s.user)
	return user?.companyId ?? ''
}

export function useRoles() {
	const companyId = useCompanyId()

	return useQuery({
		queryKey: ['roles', companyId],
		queryFn: () => api.roles.list(companyId) as Promise<RoleItem[]>,
		enabled: !!companyId,
	})
}

export function useCreateRole() {
	const companyId = useCompanyId()
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (body: { name: string; description?: string; permissions: number[] }) =>
			api.roles.create(companyId, body),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['roles', companyId] })
		},
	})
}

export function useUpdateRole() {
	const companyId = useCompanyId()
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({
			roleId,
			body,
		}: {
			roleId: string
			body: { name?: string; description?: string; permissions?: number[] }
		}) => api.roles.update(companyId, roleId, body),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['roles', companyId] })
			queryClient.invalidateQueries({ queryKey: ['members', companyId] })
		},
	})
}

export function useDeleteRole() {
	const companyId = useCompanyId()
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (roleId: string) => api.roles.delete(companyId, roleId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['roles', companyId] })
		},
	})
}
