import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth-store'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface KpiSnapshot {
	totalCustomers: number
	atRiskCount: number
	hotCount: number
	newThisWeek: number
	totalLtv: number
	alertMessage: string | null
}

// ─── Internal helper ───────────────────────────────────────────────────────────

function useCompanyId() {
	const user = useAuthStore((s) => s.user)
	return user?.companyId ?? ''
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useKpiSnapshot() {
	const companyId = useCompanyId()

	return useQuery<KpiSnapshot>({
		queryKey: ['customers', companyId, 'kpi-snapshot'],
		queryFn: () => api.customers.kpiSnapshot(companyId) as Promise<KpiSnapshot>,
		enabled: !!companyId,
		staleTime: 60_000, // 1 minute
	})
}
