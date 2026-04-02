import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth-store'

export type ChatbotScheduleMode = 'always' | 'never' | 'scheduled' | 'outside-hours'

export interface DaySchedule {
	day: string
	enabled: boolean
	startTime: string
	endTime: string
}

export interface ChatbotConfiguration {
	enabled: boolean
	scheduleMode: ChatbotScheduleMode
	schedule: DaySchedule[]
	businessOverview: string
	responseStyle: string
	instructions: string
}

export interface KnowledgeSource {
	id: string
	name: string
	type: 'url' | 'file' | 'text'
	content: string
	createdAt: string
}

function useCompanyId() {
	const user = useAuthStore((s) => s.user)
	return user?.companyId ?? ''
}

export function useChatbotConfiguration() {
	const companyId = useCompanyId()

	return useQuery({
		queryKey: ['chatbot', companyId, 'configuration'],
		queryFn: () => api.chatbot.configuration(companyId) as Promise<ChatbotConfiguration>,
		enabled: !!companyId,
	})
}

export function useUpdateChatbot() {
	const companyId = useCompanyId()
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (body: object) => api.chatbot.update(companyId, body),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['chatbot', companyId, 'configuration'] })
		},
	})
}

export function useKnowledgeSources() {
	const companyId = useCompanyId()

	return useQuery({
		queryKey: ['chatbot', companyId, 'knowledge-sources'],
		queryFn: () => api.chatbot.knowledgeSources(companyId) as Promise<KnowledgeSource[]>,
		enabled: !!companyId,
	})
}

export function useAddKnowledgeSource() {
	const companyId = useCompanyId()
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (body: object) => api.chatbot.addKnowledgeSource(companyId, body),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['chatbot', companyId, 'knowledge-sources'] })
		},
	})
}

export function useDeleteKnowledgeSource() {
	const companyId = useCompanyId()
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (sourceId: string) => api.chatbot.deleteKnowledgeSource(companyId, sourceId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['chatbot', companyId, 'knowledge-sources'] })
		},
	})
}
