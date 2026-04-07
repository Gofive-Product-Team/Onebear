import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth-store'

export interface MemberItem {
	id: string
	email: string
	displayName: string | null
	roleId: string
	roleName: string
	permissions: number[]
	isActive: boolean
	createdTimestamp: number
	lastLoginTimestamp: number | null
}

function useCompanyId() {
	const user = useAuthStore((s) => s.user)
	return user?.companyId ?? ''
}

export function useMembers() {
	const companyId = useCompanyId()

	return useQuery({
		queryKey: ['members', companyId],
		queryFn: () => api.members.list(companyId) as Promise<MemberItem[]>,
		enabled: !!companyId,
	})
}

export function useAddMember() {
	const companyId = useCompanyId()
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (body: { email: string; roleId: string }) => api.members.add(companyId, body),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['members', companyId] })
		},
	})
}

export function useUpdateMember() {
	const companyId = useCompanyId()
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({ id, body }: { id: string; body: { roleId: string } }) =>
			api.members.update(companyId, id, body),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['members', companyId] })
		},
	})
}

export function useRemoveMember() {
	const companyId = useCompanyId()
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (id: string) => api.members.remove(companyId, id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['members', companyId] })
		},
	})
}
