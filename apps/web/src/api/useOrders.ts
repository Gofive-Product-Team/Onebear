import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth-store'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OrderLineItem {
	productId: string
	productName: string
	variantId: string | null
	variantLabel: string | null
	quantity: number
	unitPrice: number
	lineTotal: number
}

export interface PaymentLinkInfo {
	url: string | null
	status: string
	expiresAtTimestamp: number
	createdTimestamp: number
}

export interface OrderItem {
	id: string
	orderId: string
	customerId: string | null
	customerName: string | null
	roomId: string | null
	status: string
	source: string
	items: OrderLineItem[]
	subtotal: number
	discount: number
	total: number
	currency: string
	paymentMode: string
	paymentLink: PaymentLinkInfo | null
	paidAmount: number
	paidTimestamp: number | null
	aiClosed: boolean
	assignedToUserId: string | null
	internalNote: string | null
	cancellationReason: string | null
	createdTimestamp: number
	updatedTimestamp: number | null
}

interface OrdersResponse {
	data: OrderItem[]
	continuationToken: string | null
	hasMore: boolean
}

export interface OrderSummary {
	totalOrders: number
	newOrders: number
	pendingPayment: number
	pendingVerify: number
	completed: number
	cancelled: number
	todayRevenue: number
}

export interface CreateOrderBody {
	customerId?: string
	customerName?: string
	roomId?: string
	items: {
		productId: string
		productName: string
		variantId?: string
		variantLabel?: string
		quantity: number
		unitPrice: number
	}[]
	discount?: number
	paymentMode?: string
	source?: string
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useOrders(params?: Record<string, string>) {
	const companyId = useAuthStore((s) => s.companyId)

	return useQuery({
		queryKey: ['orders', companyId, params],
		queryFn: () => api.orders.list(companyId!, params) as Promise<OrdersResponse>,
		enabled: !!companyId,
	})
}

export function useOrder(orderId: string | null) {
	const companyId = useAuthStore((s) => s.companyId)

	return useQuery({
		queryKey: ['order', companyId, orderId],
		queryFn: () => api.orders.get(companyId!, orderId!) as Promise<OrderItem>,
		enabled: !!companyId && !!orderId,
	})
}

export function useOrderSummary() {
	const companyId = useAuthStore((s) => s.companyId)

	return useQuery({
		queryKey: ['order-summary', companyId],
		queryFn: () => api.orders.summary(companyId!) as Promise<OrderSummary>,
		enabled: !!companyId,
	})
}

export function useCreateOrder() {
	const companyId = useAuthStore((s) => s.companyId)
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (body: CreateOrderBody) => api.orders.create(companyId!, body),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['orders'] })
			queryClient.invalidateQueries({ queryKey: ['order-summary'] })
		},
	})
}

export function useUpdateOrderStatus() {
	const companyId = useAuthStore((s) => s.companyId)
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({ orderId, body }: { orderId: string; body: { status: string; internalNote?: string; cancellationReason?: string } }) =>
			api.orders.updateStatus(companyId!, orderId, body),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['orders'] })
			queryClient.invalidateQueries({ queryKey: ['order'] })
			queryClient.invalidateQueries({ queryKey: ['order-summary'] })
		},
	})
}
