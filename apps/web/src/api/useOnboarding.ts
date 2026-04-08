import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth-store'

export interface OnboardingChannel {
	platform: string
	channelName: string | null
	integrationId: string | null
	testMessageReceived: boolean
}

export interface OnboardingProduct {
	name: string
	category: string
	price: number
	stock: number | null
}

export interface OnboardingState {
	id: string
	currentStep: number
	isCompleted: boolean
	connectedChannels: OnboardingChannel[]
	testMessageReceived: boolean
	aiEnabled: boolean
	sampleProductCreated: boolean
	pendingProducts: OnboardingProduct[]
	canAnswerFaq: boolean
	canCloseOrders: boolean
	tutorialDismissed: boolean
	tutorialsDismissed: string[]
}

export function useOnboardingState() {
	const companyId = useAuthStore((s) => s.companyId)
	return useQuery({
		queryKey: ['onboarding', companyId],
		queryFn: () => api.onboarding.get(companyId!) as Promise<OnboardingState>,
		enabled: !!companyId,
	})
}

export function useConnectChannel() {
	const companyId = useAuthStore((s) => s.companyId)
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (body: { platform: string; channelName?: string; integrationId?: string }) =>
			api.onboarding.connectChannel(companyId!, body),
		onSuccess: () => qc.invalidateQueries({ queryKey: ['onboarding'] }),
	})
}

export function useAdvanceToStep2() {
	const companyId = useAuthStore((s) => s.companyId)
	const qc = useQueryClient()
	return useMutation({
		mutationFn: () => api.onboarding.advanceStep2(companyId!),
		onSuccess: () => qc.invalidateQueries({ queryKey: ['onboarding'] }),
	})
}

export function useCompleteStep2() {
	const companyId = useAuthStore((s) => s.companyId)
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (body: { products: OnboardingProduct[] }) =>
			api.onboarding.completeStep2(companyId!, body),
		onSuccess: () => qc.invalidateQueries({ queryKey: ['onboarding'] }),
	})
}

export function useDismissTutorial() {
	const companyId = useAuthStore((s) => s.companyId)
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (body: { tutorialKey: string }) =>
			api.onboarding.dismissTutorial(companyId!, body),
		onSuccess: () => qc.invalidateQueries({ queryKey: ['onboarding'] }),
	})
}
