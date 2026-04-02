import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ChatRoom, PagedResponse, BadgeCount } from '@one-bear/shared-types'
import { api } from '@/lib/api-client'

export interface RoomFilters {
	state?: string
	assignedTo?: string
	platform?: string
	search?: string
	continuationToken?: string
}

function buildParams(filters?: RoomFilters): Record<string, string> | undefined {
	if (!filters) return undefined
	const params: Record<string, string> = {}
	if (filters.state) params.state = filters.state
	if (filters.assignedTo) params.assignedTo = filters.assignedTo
	if (filters.platform) params.platform = filters.platform
	if (filters.search) params.search = filters.search
	if (filters.continuationToken) params.continuationToken = filters.continuationToken
	return Object.keys(params).length > 0 ? params : undefined
}

export function useRooms(companyId: string, filters?: RoomFilters) {
	return useQuery<PagedResponse<ChatRoom>>({
		queryKey: ['rooms', companyId, filters],
		queryFn: () => api.rooms.list(companyId, buildParams(filters)) as Promise<PagedResponse<ChatRoom>>,
		enabled: !!companyId,
	})
}

export function useRoom(companyId: string, roomId: string | null) {
	return useQuery<ChatRoom>({
		queryKey: ['room', companyId, roomId],
		queryFn: () => api.rooms.get(companyId, roomId!) as Promise<ChatRoom>,
		enabled: !!companyId && !!roomId,
	})
}

export function useBadgeCount(companyId: string) {
	return useQuery<BadgeCount>({
		queryKey: ['badge-count', companyId],
		queryFn: () => api.rooms.getBadgeCount(companyId) as Promise<BadgeCount>,
		enabled: !!companyId,
		refetchInterval: 30_000,
	})
}

export function useResolveRoom(companyId: string) {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (roomId: string) => api.rooms.resolve(companyId, roomId),
		onSuccess: (_data, roomId) => {
			queryClient.invalidateQueries({ queryKey: ['rooms'] })
			queryClient.invalidateQueries({ queryKey: ['room', companyId, roomId] })
			queryClient.invalidateQueries({ queryKey: ['badge-count'] })
		},
	})
}

export function useCloseRoom(companyId: string) {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (roomId: string) => api.rooms.close(companyId, roomId),
		onSuccess: (_data, roomId) => {
			queryClient.invalidateQueries({ queryKey: ['rooms'] })
			queryClient.invalidateQueries({ queryKey: ['room', companyId, roomId] })
			queryClient.invalidateQueries({ queryKey: ['badge-count'] })
		},
	})
}
