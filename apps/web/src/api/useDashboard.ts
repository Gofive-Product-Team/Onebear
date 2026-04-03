import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'

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
	LINE: '#22c55e',
	Facebook: '#3b82f6',
	Instagram: '#ec4899',
	WhatsApp: '#10b981',
	Email: '#6b7280',
	TikTok: '#334155',
	Lazada: '#f97316',
	Shopee: '#ef4444',
}

// --- Mock data functions ---

function getMockDashboardStats(_dateRange: DateRange, _companyId: string): Promise<DashboardStats> {
	return Promise.resolve({
		totalRooms: 1284,
		activeRooms: 47,
		resolvedToday: 23,
		avgResponseTimeMs: 154000, // 2m 34s
		totalRoomsChange: 12,
		activeRoomsChange: 3,
		resolvedTodayChange: -5,
		avgResponseTimeMsChange: -18,
	})
}

function getMockPlatformDistribution(_dateRange: DateRange, _companyId: string): Promise<PlatformDistribution[]> {
	return Promise.resolve([
		{ platform: 'LINE', count: 542, color: '#22c55e' },
		{ platform: 'Facebook', count: 318, color: '#3b82f6' },
		{ platform: 'Instagram', count: 186, color: '#ec4899' },
		{ platform: 'WhatsApp', count: 104, color: '#10b981' },
		{ platform: 'Email', count: 72, color: '#6b7280' },
		{ platform: 'TikTok', count: 34, color: '#334155' },
		{ platform: 'Lazada', count: 18, color: '#f97316' },
		{ platform: 'Shopee', count: 10, color: '#ef4444' },
	])
}

function getMockMessageVolume(_dateRange: DateRange, _companyId: string): Promise<MessageVolume[]> {
	const days = [
		{ date: 'มี.ค. 25', inbound: 142, outbound: 138 },
		{ date: 'มี.ค. 26', inbound: 168, outbound: 155 },
		{ date: 'มี.ค. 27', inbound: 125, outbound: 119 },
		{ date: 'มี.ค. 28', inbound: 189, outbound: 174 },
		{ date: 'มี.ค. 29', inbound: 210, outbound: 198 },
		{ date: 'มี.ค. 30', inbound: 176, outbound: 163 },
		{ date: 'มี.ค. 31', inbound: 155, outbound: 141 },
	]
	return Promise.resolve(days)
}

function getMockResponseTimeTrend(_dateRange: DateRange, _companyId: string): Promise<ResponseTimeTrend[]> {
	return Promise.resolve([
		{ date: 'มี.ค. 25', avgMs: 180000 },
		{ date: 'มี.ค. 26', avgMs: 162000 },
		{ date: 'มี.ค. 27', avgMs: 145000 },
		{ date: 'มี.ค. 28', avgMs: 158000 },
		{ date: 'มี.ค. 29', avgMs: 134000 },
		{ date: 'มี.ค. 30', avgMs: 151000 },
		{ date: 'มี.ค. 31', avgMs: 154000 },
	])
}

function getMockAgentPerformance(_dateRange: DateRange, _companyId: string): Promise<AgentPerformance[]> {
	return Promise.resolve([
		{ userId: 'u-001', name: 'สมชาย ก.', roomsHandled: 84, avgResponseTimeMs: 105000, satisfaction: 4.8 },
		{ userId: 'u-002', name: 'ณัฐพร ส.', roomsHandled: 72, avgResponseTimeMs: 132000, satisfaction: 4.6 },
		{ userId: 'u-003', name: 'กิตติพงษ์ ว.', roomsHandled: 68, avgResponseTimeMs: 175000, satisfaction: 4.3 },
		{ userId: 'u-004', name: 'อารีย์ พ.', roomsHandled: 61, avgResponseTimeMs: 188000, satisfaction: 4.5 },
		{ userId: 'u-005', name: 'ธนกฤต ล.', roomsHandled: 55, avgResponseTimeMs: 150000, satisfaction: 4.7 },
	])
}

// --- useCompanyId helper ---

function useCompanyId() {
	const user = useAuthStore((s) => s.user)
	return user?.companyId ?? ''
}

// --- Hooks ---

export function useDashboardStats(dateRange: DateRange) {
	const companyId = useCompanyId()

	return useQuery({
		queryKey: ['dashboard', 'stats', companyId, dateRange],
		queryFn: () => getMockDashboardStats(dateRange, companyId),
		enabled: !!companyId,
	})
}

export function usePlatformDistribution(dateRange: DateRange) {
	const companyId = useCompanyId()

	return useQuery({
		queryKey: ['dashboard', 'platform-distribution', companyId, dateRange],
		queryFn: () => getMockPlatformDistribution(dateRange, companyId),
		enabled: !!companyId,
	})
}

export function useMessageVolume(dateRange: DateRange) {
	const companyId = useCompanyId()

	return useQuery({
		queryKey: ['dashboard', 'message-volume', companyId, dateRange],
		queryFn: () => getMockMessageVolume(dateRange, companyId),
		enabled: !!companyId,
	})
}

export function useResponseTimeTrend(dateRange: DateRange) {
	const companyId = useCompanyId()

	return useQuery({
		queryKey: ['dashboard', 'response-time-trend', companyId, dateRange],
		queryFn: () => getMockResponseTimeTrend(dateRange, companyId),
		enabled: !!companyId,
	})
}

export function useAgentPerformance(dateRange: DateRange) {
	const companyId = useCompanyId()

	return useQuery({
		queryKey: ['dashboard', 'agent-performance', companyId, dateRange],
		queryFn: () => getMockAgentPerformance(dateRange, companyId),
		enabled: !!companyId,
	})
}
