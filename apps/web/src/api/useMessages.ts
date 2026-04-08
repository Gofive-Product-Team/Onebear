import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ChatMessage, PagedResponse } from '@one-bear/shared-types'
import { api } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth-store'

export function useMessages(companyId: string, roomId: string | null) {
	return useInfiniteQuery<PagedResponse<ChatMessage>>({
		queryKey: ['messages', companyId, roomId],
		queryFn: ({ pageParam }) => {
			const params: Record<string, string> = {}
			if (pageParam) params.continuationToken = pageParam as string
			return api.messages.list(companyId, roomId!, Object.keys(params).length > 0 ? params : undefined) as Promise<
				PagedResponse<ChatMessage>
			>
		},
		initialPageParam: null as string | null,
		getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.continuationToken : undefined),
		enabled: !!companyId && !!roomId,
		select: (data) => ({
			pages: data.pages,
			pageParams: data.pageParams,
		}),
	})
}

interface SendMessageBody {
	content: string
	messageType?: string
}

export function useSendMessage(companyId: string, roomId: string | null) {
	const queryClient = useQueryClient()
	const user = useAuthStore.getState().user

	return useMutation({
		mutationFn: (body: SendMessageBody) => {
			if (!roomId) throw new Error('roomId is required to send a message')
			return api.messages.send(companyId, roomId, {
				content: body.content,
				messageType: body.messageType ?? 'text',
			})
		},

		// Optimistic update: show message immediately with "Pending" status
		onMutate: async (body) => {
			if (!roomId) return

			// Cancel in-flight queries so they don't overwrite our optimistic update
			await queryClient.cancelQueries({ queryKey: ['messages', companyId, roomId] })

			// Snapshot previous data for rollback
			const previousMessages = queryClient.getQueryData(['messages', companyId, roomId])

			// Create optimistic message
			const optimisticMessage: ChatMessage = {
				id: `optimistic-${Date.now()}`,
				roomId,
				content: body.content,
				type: body.messageType ?? 'Text',
				platform: '',
				deliveryStatus: 'Pending',
				senderName: user?.displayName ?? null,
				senderType: 'Agent',
				timestamp: Date.now(),
			}

			// Add to the first page (newest messages page — API returns newest-first)
			// Prepend so after reverse() in MessageList it appears at the bottom
			queryClient.setQueryData<{ pages: PagedResponse<ChatMessage>[]; pageParams: unknown[] }>(
				['messages', companyId, roomId],
				(old) => {
					if (!old || !old.pages.length) return old
					const newPages = [...old.pages]
					const firstPage = { ...newPages[0] }
					firstPage.data = [optimisticMessage, ...firstPage.data]
					newPages[0] = firstPage
					return { ...old, pages: newPages }
				},
			)

			return { previousMessages }
		},

		// On error: rollback to previous data
		onError: (_err, _body, context) => {
			if (context?.previousMessages) {
				queryClient.setQueryData(['messages', companyId, roomId], context.previousMessages)
			}
		},

		// On success or error: always refetch to get real data from server
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ['messages', companyId, roomId] })
			queryClient.invalidateQueries({ queryKey: ['rooms'] })
			queryClient.invalidateQueries({ queryKey: ['room', companyId, roomId] })
		},
	})
}
