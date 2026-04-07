import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import { api } from '@/lib/api-client'

// --- Types ---

export interface DateRange {
	from: string // ISO date string e.g. "2024-03-01"
	to: string // ISO date string e.g. "2024-03-31"
}

export interface DashboardStats {
	totalRooms: number
	activeRooms: number
	resolvedToday: number
	avgResponseTimeMs: number
	totalRoomsChange: number // percentage change
	activeRoomsChange: number // absolute change
	resolvedTodayChange: number // percentage change
	avgResponseTimeMsChange: number // percentage change
}

export interface PlatformDistribution {
	platform: string
	count: number
	color: string
}

export interface MessageVolume {
	date: string // e.g. "Mar 01"
	inbound: number
	outbound: number
}

export interface ResponseTimeTrend {
	date: string
	avgMs: number
}

export interface AgentPerformance {
	userId: string
	name: string
	roomsHandled: number
	avgResponseTimeMs: number
	satisfaction: number
}

// --- Platform colors ---

const PLATFORM_COLORS: Record<string, string> = {
	Line: '#22c55e',
	LINE: '#22c55e',
	Facebook: '#3b82f6',
	Instagram: '#ec4899',
	WhatsApp: '#10b981',
	Email: '#6b7280',
	TikTok: '#334155',
	Lazada: '#f97316',
	Shopee: '#ef4444',
}

// --- API response type ---

interface DashboardApiResponse {
	stats: DashboardStats
	platformDistribution: Array<{ platform: string; count: number }>
	messageVolume: Array<{ date: string; inbound: number; outbound: number }>
	responseTimeTrend: Array<{ date: string; avgMs: number }>
	agentPerformance: AgentPerformance[]
}

// --- useCompanyId helper ---

function useCompanyId() {
	const user = useAuthStore((s) => s.user)
	return user?.companyId ?? ''
}

// --- Shared data fetcher ---

function useDashboardData(dateRange: DateRange) {
	const companyId = useCompanyId()
	return useQuery({
		queryKey: ['dashboard', companyId, dateRange],
		queryFn: () => api.dashboard.get(companyId, dateRange.from, dateRange.to) as Promise<DashboardApiResponse>,
		enabled: !!companyId,
		staleTime: 60_000, // 1 minute
	})
}

// --- Hooks ---

export function useDashboardStats(dateRange: DateRange) {
	const { data, isLoading, isError } = useDashboardData(dateRange)
	return {
		data: data?.stats,
		isLoading,
		isError,
	}
}

export function usePlatformDistribution(dateRange: DateRange) {
	const { data, isLoading, isError } = useDashboardData(dateRange)
	return {
		data: data?.platformDistribution?.map((p) => ({
			...p,
			color: PLATFORM_COLORS[p.platform] ?? '#94a3b8',
		})),
		isLoading,
		isError,
	}
}

export function useMessageVolume(dateRange: DateRange) {
	const { data, isLoading, isError } = useDashboardData(dateRange)
	return { data: data?.messageVolume, isLoading, isError }
}

export function useResponseTimeTrend(dateRange: DateRange) {
	const { data, isLoading, isError } = useDashboardData(dateRange)
	return { data: data?.responseTimeTrend, isLoading, isError }
}

export function useAgentPerformance(dateRange: DateRange) {
	const { data, isLoading, isError } = useDashboardData(dateRange)
	return { data: data?.agentPerformance, isLoading, isError }
}
