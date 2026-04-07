import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { PagedResponse } from '@one-bear/shared-types'
import { api } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth-store'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CustomerTag {
	name: string
	isAiAssigned: boolean
	reason: string | null
}

export interface CustomerChannel {
	platform: string
	displayName: string | null
}

export type SuggestedActionType = 'chat' | 'followup' | 'welcome'

export interface CustomerListItem {
	id: string
	customerType: string // "Individual" | "Organization"
	name: string
	email: string | null
	phone: string | null
	avatar: string | null
	channels: CustomerChannel[]
	tags: CustomerTag[]
	ltv: number
	orderCount: number
	aov: number
	lastOrderTimestamp: number | null
	lastActivityTimestamp: number | null
	lastMessagePreview: string | null
	pinnedNote: string | null
	isAtRisk: boolean
	daysSinceLastPurchase: number | null
	suggestedAction: string | null
	suggestedActionType: SuggestedActionType | null
}

export interface CustomerDetail extends CustomerListItem {
	nationalId: string | null
	taxId: string | null
	pinnedNoteBy: string | null
	pinnedNoteTimestamp: number | null
	organizationId: string | null
	contactIds: string[]
	isPromoted: boolean
	promotedTimestamp: number | null
	createdTimestamp: number
	updatedTimestamp: number | null
}

export interface SegmentCounts {
	all: number
	hot: number
	vip: number
	atRisk: number
	new: number
	cold: number
	organization: number
}

export interface CustomerListParams {
	segment?: string
	search?: string
	sort?: string
	pageSize?: string
}

// ─── Internal helper ───────────────────────────────────────────────────────────

function useCompanyId() {
	const user = useAuthStore((s) => s.user)
	return user?.companyId ?? ''
}

function toQueryParams(params: CustomerListParams): Record<string, string> {
	const out: Record<string, string> = {}
	if (params.segment && params.segment !== 'All') out.segment = params.segment
	if (params.search) out.search = params.search
	if (params.sort) out.sort = params.sort
	out.pageSize = params.pageSize ?? '20'
	return out
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useCustomers(params: CustomerListParams = {}) {
	const companyId = useCompanyId()

	return useInfiniteQuery<PagedResponse<CustomerListItem>>({
		queryKey: ['customers', companyId, params],
		queryFn: ({ pageParam }) => {
			const p = toQueryParams(params)
			if (pageParam) p.continuationToken = pageParam as string
			return api.customers.list(companyId, p) as Promise<PagedResponse<CustomerListItem>>
		},
		initialPageParam: null as string | null,
		getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.continuationToken : undefined),
		enabled: !!companyId,
	})
}

export function useCustomer(id: string) {
	const companyId = useCompanyId()

	return useQuery({
		queryKey: ['customers', companyId, id],
		queryFn: () => api.customers.get(companyId, id) as Promise<CustomerDetail>,
		enabled: !!companyId && !!id,
	})
}

export function useSegmentCounts() {
	const companyId = useCompanyId()

	return useQuery({
		queryKey: ['customers', companyId, 'segment-counts'],
		queryFn: () => api.customers.segmentCounts(companyId) as Promise<SegmentCounts>,
		enabled: !!companyId,
	})
}

export function useCreateCustomer() {
	const companyId = useCompanyId()
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (body: { name: string; email?: string; phone?: string; customerType?: string }) =>
			api.customers.create(companyId, body) as Promise<CustomerDetail>,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['customers', companyId] })
		},
	})
}

export function useUpdateCustomer() {
	const companyId = useCompanyId()
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({ id, body }: { id: string; body: { name?: string; email?: string; phone?: string; customerType?: string } }) =>
			api.customers.update(companyId, id, body),
		onSuccess: (_data, { id }) => {
			queryClient.invalidateQueries({ queryKey: ['customers', companyId] })
			queryClient.invalidateQueries({ queryKey: ['customers', companyId, id] })
		},
	})
}

export function useDeleteCustomer() {
	const companyId = useCompanyId()
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (id: string) => api.customers.delete(companyId, id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['customers', companyId] })
		},
	})
}

export function useAddCustomerTag() {
	const companyId = useCompanyId()
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({ id, name }: { id: string; name: string }) =>
			api.customers.addTag(companyId, id, name),
		onSuccess: (_data, { id }) => {
			queryClient.invalidateQueries({ queryKey: ['customers', companyId, id] })
		},
	})
}

export function useRemoveCustomerTag() {
	const companyId = useCompanyId()
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({ id, name }: { id: string; name: string }) =>
			api.customers.removeTag(companyId, id, name),
		onSuccess: (_data, { id }) => {
			queryClient.invalidateQueries({ queryKey: ['customers', companyId, id] })
		},
	})
}

export function useSetPinnedNote() {
	const companyId = useCompanyId()
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({ id, note }: { id: string; note: string }) =>
			api.customers.setPinnedNote(companyId, id, note),
		onSuccess: (_data, { id }) => {
			queryClient.invalidateQueries({ queryKey: ['customers', companyId, id] })
			queryClient.invalidateQueries({ queryKey: ['customers', companyId] })
		},
	})
}

export function useRemovePinnedNote() {
	const companyId = useCompanyId()
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (id: string) => api.customers.removePinnedNote(companyId, id),
		onSuccess: (_data, id) => {
			queryClient.invalidateQueries({ queryKey: ['customers', companyId, id] })
			queryClient.invalidateQueries({ queryKey: ['customers', companyId] })
		},
	})
}

export function usePromoteCustomer() {
	const companyId = useCompanyId()
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (id: string) => api.customers.promote(companyId, id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['customers', companyId] })
		},
	})
}

// ─── Re-export legacy compat alias ────────────────────────────────────────────
// CustomerPage previously typed customers as Customer; keep the union accessible
export type Customer = CustomerListItem
