import { useInfiniteQuery } from '@tanstack/react-query'
import type { PagedResponse } from '@one-bear/shared-types'
import { api } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth-store'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ActivityLogItem {
	id: string
	type: string // "chat", "order", "note", "tag_change", etc.
	description: string
	actorId: string | null
	actorName: string | null
	referenceId: string | null
	referenceType: string | null
	timestamp: number
}

// ─── Internal helper ───────────────────────────────────────────────────────────

function useCompanyId() {
	const user = useAuthStore((s) => s.user)
	return user?.companyId ?? ''
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useActivityLog(customerId: string, type?: string, pageSize = 20) {
	const companyId = useCompanyId()

	return useInfiniteQuery<PagedResponse<ActivityLogItem>>({
		queryKey: ['customers', companyId, customerId, 'activity', type, pageSize],
		queryFn: ({ pageParam }) => {
			const params: Record<string, string> = { pageSize: String(pageSize) }
			if (type) params.type = type
			if (pageParam) params.continuationToken = pageParam as string
			return api.customers.activity(companyId, customerId, params) as Promise<PagedResponse<ActivityLogItem>>
		},
		initialPageParam: null as string | null,
		getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.continuationToken : undefined),
		enabled: !!companyId && !!customerId,
	})
}
