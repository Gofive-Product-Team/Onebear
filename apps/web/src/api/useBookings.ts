import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth-store'

export interface BookingItem {
	id: string
	bookingId: string
	customerId: string | null
	customerName: string | null
	status: string
	serviceName: string
	servicePrice: number
	serviceDurationMinutes: number
	agentUserId: string | null
	agentName: string | null
	dateTimestamp: number
	endTimestamp: number
	isRecurring: boolean
	recurringInterval: string | null
	customerNote: string | null
	createdTimestamp: number
}

interface BookingsResponse {
	data: BookingItem[]
	continuationToken: string | null
	hasMore: boolean
}

export interface BookingServiceItem {
	id: string
	name: string
	price: number
	durationMinutes: number
	isActive: boolean
	agentUserIds: string[]
	description: string | null
}

export function useBookings(params?: Record<string, string>) {
	const companyId = useAuthStore((s) => s.user?.companyId ?? '')
	return useQuery({
		queryKey: ['bookings', companyId, params],
		queryFn: () => api.bookings.list(companyId!, params) as Promise<BookingsResponse>,
		enabled: !!companyId,
	})
}

export function useBookingServices() {
	const companyId = useAuthStore((s) => s.user?.companyId ?? '')
	return useQuery({
		queryKey: ['booking-services', companyId],
		queryFn: () => api.bookings.services(companyId!) as Promise<BookingServiceItem[]>,
		enabled: !!companyId,
	})
}

export function useCreateBooking() {
	const companyId = useAuthStore((s) => s.user?.companyId ?? '')
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (body: object) => api.bookings.create(companyId!, body),
		onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings'] }),
	})
}

export function useUpdateBookingStatus() {
	const companyId = useAuthStore((s) => s.user?.companyId ?? '')
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ bookingId, body }: { bookingId: string; body: object }) =>
			api.bookings.updateStatus(companyId!, bookingId, body),
		onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings'] }),
	})
}

export function useCreateBookingService() {
	const companyId = useAuthStore((s) => s.user?.companyId ?? '')
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (body: object) => api.bookings.createService(companyId!, body),
		onSuccess: () => qc.invalidateQueries({ queryKey: ['booking-services'] }),
	})
}
