import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth-store'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface KpiData {
  // Agent view
  myRevenue?: number
  newOrders?: number
  unansweredChats?: number
  aiClosed?: number
  pendingFollowUps?: number
  pendingPayment?: number
  // Manager/Admin view
  teamRevenue?: number
  totalOrders?: number
  responseRate?: number
  monthRevenue?: number
  slaBreach?: number
  aiAdoption?: number
}

export interface DayRevenue {
  day: number
  revenue: number
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useCalendarKpi(role: string) {
  const companyId = useAuthStore((s) => s.user?.companyId ?? '')

  return useQuery({
    queryKey: ['calendar-kpi', companyId, role],
    queryFn: () => api.calendar.kpi(companyId!, role) as Promise<KpiData>,
    enabled: !!companyId,
    staleTime: 60_000,
  })
}

export function useCalendarRevenue(year: number, month: number) {
  const companyId = useAuthStore((s) => s.user?.companyId ?? '')

  return useQuery({
    queryKey: ['calendar-revenue', companyId, year, month],
    queryFn: () => api.calendar.revenue(companyId!, year, month) as Promise<DayRevenue[]>,
    enabled: !!companyId,
    staleTime: 5 * 60_000,
  })
}
