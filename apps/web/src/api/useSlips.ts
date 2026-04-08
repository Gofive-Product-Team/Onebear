import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth-store'

export interface SlipVerification {
	id: string
	orderId: string
	imageUrl: string
	status: string
	confidence: number | null
	extractedAmount: number | null
	extractedBankCode: string | null
	extractedAccountName: string | null
	bankLogoRecognized: boolean | null
	amountMatches: boolean | null
	timestampValid: boolean | null
	accountMatches: boolean | null
	isBlacklisted: boolean
	reviewedBy: string | null
	reviewedTimestamp: number | null
	rejectionReasonCode: string | null
	rejectionMessage: string | null
	submissionCount: number
	manualReviewRequired: boolean
	createdTimestamp: number
}

export function usePendingSlips() {
	const companyId = useAuthStore((s) => s.companyId)
	return useQuery({
		queryKey: ['slips-pending', companyId],
		queryFn: () => api.slips.pending(companyId!) as Promise<SlipVerification[]>,
		enabled: !!companyId,
	})
}

export function useSlipByOrder(orderId: string | null) {
	const companyId = useAuthStore((s) => s.companyId)
	return useQuery({
		queryKey: ['slip', companyId, orderId],
		queryFn: () => api.slips.getByOrder(companyId!, orderId!) as Promise<SlipVerification>,
		enabled: !!companyId && !!orderId,
	})
}

export function useSubmitSlip() {
	const companyId = useAuthStore((s) => s.companyId)
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (body: { orderId: string; imageUrl: string }) =>
			api.slips.submit(companyId!, body),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['slips-pending'] })
			queryClient.invalidateQueries({ queryKey: ['slip'] })
			queryClient.invalidateQueries({ queryKey: ['orders'] })
		},
	})
}

export function useReviewSlip() {
	const companyId = useAuthStore((s) => s.companyId)
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ slipId, body }: { slipId: string; body: { action: string; rejectionReasonCode?: string; adminNote?: string } }) =>
			api.slips.review(companyId!, slipId, body),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['slips-pending'] })
			queryClient.invalidateQueries({ queryKey: ['slip'] })
			queryClient.invalidateQueries({ queryKey: ['orders'] })
			queryClient.invalidateQueries({ queryKey: ['order-summary'] })
		},
	})
}
