import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ChatMessage } from '@one-bear/shared-types'
import { api } from '@/lib/api-client'

export function usePinnedMessages(companyId: string, roomId: string) {
	return useQuery<ChatMessage[]>({
		queryKey: ['pinned-messages', companyId, roomId],
		queryFn: () => api.messages.pinnedMessages(companyId, roomId) as Promise<ChatMessage[]>,
		enabled: !!companyId && !!roomId,
	})
}

export function usePinMessage(companyId: string, roomId: string) {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (messageId: string) => api.messages.pinMessage(companyId, roomId, messageId),
		onMutate: async (messageId) => {
			await queryClient.cancelQueries({ queryKey: ['pinned-messages', companyId, roomId] })
			const previous = queryClient.getQueryData<ChatMessage[]>(['pinned-messages', companyId, roomId])

			// Optimistically add message to pinned list — look up in messages cache
			const allPages = queryClient.getQueriesData<{ pages: { data: ChatMessage[] }[] }>({
				queryKey: ['messages', companyId, roomId],
			})
			let pinnedMsg: ChatMessage | undefined
			for (const [, paged] of allPages) {
				if (!paged?.pages) continue
				for (const page of paged.pages) {
					pinnedMsg = page.data.find((m) => m.id === messageId)
					if (pinnedMsg) break
				}
				if (pinnedMsg) break
			}

			if (pinnedMsg) {
				const updated = { ...pinnedMsg, isPinnedByUser: true, pinnedTimestamp: Date.now() }
				queryClient.setQueryData<ChatMessage[]>(['pinned-messages', companyId, roomId], (old = []) => {
					// Avoid duplicates
					if (old.some((m) => m.id === messageId)) return old
					return [...old, updated]
				})
			}

			return { previous }
		},
		onError: (_err, _messageId, context) => {
			if (context?.previous !== undefined) {
				queryClient.setQueryData(['pinned-messages', companyId, roomId], context.previous)
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['pinned-messages', companyId, roomId] })
		},
	})
}

export function useUnpinMessage(companyId: string, roomId: string) {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (messageId: string) => api.messages.unpinMessage(companyId, roomId, messageId),
		onMutate: async (messageId) => {
			await queryClient.cancelQueries({ queryKey: ['pinned-messages', companyId, roomId] })
			const previous = queryClient.getQueryData<ChatMessage[]>(['pinned-messages', companyId, roomId])

			queryClient.setQueryData<ChatMessage[]>(['pinned-messages', companyId, roomId], (old = []) =>
				old.filter((m) => m.id !== messageId),
			)

			return { previous }
		},
		onError: (_err, _messageId, context) => {
			if (context?.previous !== undefined) {
				queryClient.setQueryData(['pinned-messages', companyId, roomId], context.previous)
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['pinned-messages', companyId, roomId] })
		},
	})
}
