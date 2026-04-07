import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ChatRoom, PagedResponse, BadgeCount } from '@one-bear/shared-types'
import { api } from '@/lib/api-client'

export function useSpamRooms(companyId: string) {
	return useQuery<ChatRoom[]>({
		queryKey: ['rooms-spam', companyId],
		queryFn: () => api.rooms.spam(companyId) as Promise<ChatRoom[]>,
		enabled: !!companyId,
	})
}

export function useMarkNotSpam(companyId: string) {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (roomId: string) => api.rooms.notSpam(companyId, roomId),
		onMutate: async (roomId) => {
			await queryClient.cancelQueries({ queryKey: ['rooms-spam', companyId] })
			const previous = queryClient.getQueryData<ChatRoom[]>(['rooms-spam', companyId])
			queryClient.setQueryData<ChatRoom[]>(['rooms-spam', companyId], (old = []) =>
				old.filter((r) => r.id !== roomId),
			)
			return { previous }
		},
		onError: (_err, _roomId, context) => {
			if (context?.previous !== undefined) {
				queryClient.setQueryData(['rooms-spam', companyId], context.previous)
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['rooms-spam', companyId] })
			queryClient.invalidateQueries({ queryKey: ['rooms', companyId] })
		},
	})
}

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

export function usePinRoom(companyId: string) {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (roomId: string) => api.rooms.pin(companyId, roomId),
		onMutate: async (roomId) => {
			await queryClient.cancelQueries({ queryKey: ['rooms', companyId] })
			const previousRooms = queryClient.getQueriesData<PagedResponse<ChatRoom>>({ queryKey: ['rooms', companyId] })
			queryClient.setQueriesData<PagedResponse<ChatRoom>>({ queryKey: ['rooms', companyId] }, (old) => {
				if (!old) return old
				return {
					...old,
					data: old.data.map((r) =>
						r.id === roomId ? { ...r, isPinned: true, pinnedTimestamp: Date.now() } : r,
					),
				}
			})
			return { previousRooms }
		},
		onError: (_err, _roomId, context) => {
			if (context?.previousRooms) {
				for (const [queryKey, data] of context.previousRooms) {
					queryClient.setQueryData(queryKey, data)
				}
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['rooms', companyId] })
		},
	})
}

export function useMarkDone(companyId: string) {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (roomId: string) => api.rooms.done(companyId, roomId),
		onSuccess: (_data, roomId) => {
			queryClient.invalidateQueries({ queryKey: ['rooms'] })
			queryClient.invalidateQueries({ queryKey: ['room', companyId, roomId] })
			queryClient.invalidateQueries({ queryKey: ['badge-count'] })
		},
	})
}

export function useReturnToAi(companyId: string) {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (roomId: string) => api.rooms.returnToAi(companyId, roomId),
		onSuccess: (_data, roomId) => {
			queryClient.invalidateQueries({ queryKey: ['rooms'] })
			queryClient.invalidateQueries({ queryKey: ['room', companyId, roomId] })
		},
	})
}

export function useUnpinRoom(companyId: string) {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (roomId: string) => api.rooms.unpin(companyId, roomId),
		onMutate: async (roomId) => {
			await queryClient.cancelQueries({ queryKey: ['rooms', companyId] })
			const previousRooms = queryClient.getQueriesData<PagedResponse<ChatRoom>>({ queryKey: ['rooms', companyId] })
			queryClient.setQueriesData<PagedResponse<ChatRoom>>({ queryKey: ['rooms', companyId] }, (old) => {
				if (!old) return old
				return {
					...old,
					data: old.data.map((r) =>
						r.id === roomId ? { ...r, isPinned: false, pinnedTimestamp: null } : r,
					),
				}
			})
			return { previousRooms }
		},
		onError: (_err, _roomId, context) => {
			if (context?.previousRooms) {
				for (const [queryKey, data] of context.previousRooms) {
					queryClient.setQueryData(queryKey, data)
				}
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['rooms', companyId] })
		},
	})
}
