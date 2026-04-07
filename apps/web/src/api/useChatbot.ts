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
	tone: 'casual' | 'formal' | 'cute'
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

// --- FAQ Types & Hooks ---

export interface FaqEntry {
	id: string
	question: string
	answer: string
	isDefault: boolean
	createdTimestamp: number
	updatedTimestamp: number | null
}

export interface CreditStatus {
	creditLimit: number
	creditUsed: number
	creditRemaining: number
	planId: string
	warning: 'None' | 'Yellow20' | 'Red10' | 'Exhausted'
}

export interface UnansweredQuestion {
	id: string
	question: string
	frequency: number
	lastAskedTimestamp: number
	lastRoomId: string | null
}

export function useFaqEntries() {
	const companyId = useCompanyId()

	return useQuery({
		queryKey: ['chatbot', companyId, 'faq'],
		queryFn: () => api.chatbot.faq(companyId) as Promise<FaqEntry[]>,
		enabled: !!companyId,
	})
}

export function useAddFaq() {
	const companyId = useCompanyId()
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (body: { question: string; answer: string }) => api.chatbot.addFaq(companyId, body),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['chatbot', companyId, 'faq'] })
		},
	})
}

export function useUpdateFaq() {
	const companyId = useCompanyId()
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({ faqId, body }: { faqId: string; body: { question: string; answer: string } }) =>
			api.chatbot.updateFaq(companyId, faqId, body),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['chatbot', companyId, 'faq'] })
		},
	})
}

export function useDeleteFaq() {
	const companyId = useCompanyId()
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (faqId: string) => api.chatbot.deleteFaq(companyId, faqId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['chatbot', companyId, 'faq'] })
		},
	})
}

export function useImportFaqCsv() {
	const companyId = useCompanyId()
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (file: File) => api.chatbot.importCsv(companyId, file),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['chatbot', companyId, 'faq'] })
		},
	})
}

export function useCreditStatus() {
	const companyId = useCompanyId()

	return useQuery({
		queryKey: ['chatbot', companyId, 'credit'],
		queryFn: () => api.chatbot.credit(companyId) as Promise<CreditStatus>,
		enabled: !!companyId,
	})
}

export function useTopUpCredit() {
	const companyId = useCompanyId()
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (amount: number) => api.chatbot.topUp(companyId, amount),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['chatbot', companyId, 'credit'] })
		},
	})
}

export function useUnansweredQuestions() {
	const companyId = useCompanyId()

	return useQuery({
		queryKey: ['chatbot', companyId, 'insights'],
		queryFn: () => api.chatbot.insights(companyId) as Promise<UnansweredQuestion[]>,
		enabled: !!companyId,
	})
}

export function useAddInsightToFaq() {
	const companyId = useCompanyId()
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (id: string) => api.chatbot.addInsightToFaq(companyId, id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['chatbot', companyId, 'insights'] })
			queryClient.invalidateQueries({ queryKey: ['chatbot', companyId, 'faq'] })
		},
	})
}

export function useDismissInsight() {
	const companyId = useCompanyId()
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (id: string) => api.chatbot.dismissInsight(companyId, id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['chatbot', companyId, 'insights'] })
		},
	})
}

export function useTestChatbot() {
	const companyId = useCompanyId()

	return useMutation({
		mutationFn: (message: string) => api.chatbot.test(companyId, message) as Promise<{ response: string }>,
	})
}
