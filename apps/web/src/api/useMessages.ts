import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ChatMessage, PagedResponse } from '@one-bear/shared-types'
import { api } from '@/lib/api-client'

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

	return useMutation({
		mutationFn: (body: SendMessageBody) => {
			if (!roomId) throw new Error('roomId is required to send a message')
			return api.messages.send(companyId, roomId, {
				content: body.content,
				messageType: body.messageType ?? 'text',
			})
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['messages', companyId, roomId] })
			queryClient.invalidateQueries({ queryKey: ['rooms'] })
			queryClient.invalidateQueries({ queryKey: ['room', companyId, roomId] })
		},
	})
}
