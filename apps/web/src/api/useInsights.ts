import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth-store'

export interface ActionRecommendation {
	category: string
	priority: string
	title: string
	description: string
	actionUrl: string | null
}

export interface DailyInsights {
	date: string
	sales: {
		revenue: number
		avgRevenue: number
		changePercent: number
		orderCount: number
		avgOrderValue: number
		channelBreakdown: { channel: string; revenue: number; percent: number; trend: string }[]
	}
	customers: {
		newCustomers: number
		avgNewCustomers: number
		atRiskCount: number
		hotCount: number
		conversionRate: number
	}
	chat: {
		totalMessages: number
		activeRooms: number
		avgResponseTimeMs: number
		slaComplianceRate: number
		unansweredCount: number
	}
	ai: {
		aiMessagesHandled: number
		aiOrdersClosed: number
		handoffCount: number
		aiConfidenceAvg: number
	}
	recommendations: ActionRecommendation[]
}

export function useDailyInsights(date?: string) {
	const companyId = useAuthStore((s) => s.user?.companyId ?? '')
	return useQuery({
		queryKey: ['insights-daily', companyId, date],
		queryFn: () => api.insights.daily(companyId!, date) as Promise<DailyInsights>,
		enabled: !!companyId,
		staleTime: 5 * 60_000,
	})
}
