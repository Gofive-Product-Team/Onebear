import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { PagedResponse } from '@one-bear/shared-types'
import { api } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth-store'

export interface Customer {
	id: string
	name: string
	email: string | null
	phone: string | null
	avatar: string | null
	platform: string
	totalRooms: number
	lastContactAt: string | null
	tags: string[]
}

export interface CustomerDetail extends Customer {
	notes: string | null
	rooms: CustomerRoom[]
}

export interface CustomerRoom {
	id: string
	platform: string
	state: string
	lastMessage: string | null
	createdAt: string
}

function useCompanyId() {
	const user = useAuthStore((s) => s.user)
	return user?.companyId ?? ''
}

export function useCustomers(params?: Record<string, string>) {
	const companyId = useCompanyId()

	return useInfiniteQuery<PagedResponse<Customer>>({
		queryKey: ['customers', companyId, params],
		queryFn: ({ pageParam }) => {
			const p: Record<string, string> = { ...(params ?? {}) }
			if (pageParam) p.continuationToken = pageParam as string
			return api.customers.list(companyId, Object.keys(p).length > 0 ? p : undefined) as Promise<
				PagedResponse<Customer>
			>
		},
		initialPageParam: null as string | null,
		getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.continuationToken : undefined),
		enabled: !!companyId,
	})
}

export function useCustomer(customerId: string) {
	const companyId = useCompanyId()

	return useQuery({
		queryKey: ['customers', companyId, customerId],
		queryFn: () => api.customers.get(companyId, customerId) as Promise<CustomerDetail>,
		enabled: !!companyId && !!customerId,
	})
}

export function useUpdateCustomer() {
	const companyId = useCompanyId()
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({ customerId, body }: { customerId: string; body: { name: string; email?: string; phone?: string; notes?: string } }) =>
			api.customers.update(companyId, customerId, body),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['customers', companyId] })
		},
	})
}

export function useAddTag() {
	const companyId = useCompanyId()
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({ customerId, tag }: { customerId: string; tag: string }) =>
			api.customers.addTag(companyId, customerId, tag),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['customers', companyId] })
		},
	})
}

export function useRemoveTag() {
	const companyId = useCompanyId()
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({ customerId, tag }: { customerId: string; tag: string }) =>
			api.customers.removeTag(companyId, customerId, tag),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['customers', companyId] })
		},
	})
}
