import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth-store'

export interface Customer {
	id: string
	name: string
	email: string | null
	phone: string | null
	avatar: string | null
	platform: string
	totalRooms: number
	lastContactAt: string | null
	tags: string[]
}

export interface CustomerDetail extends Customer {
	rooms: CustomerRoom[]
}

export interface CustomerRoom {
	id: string
	platform: string
	state: string
	lastMessage: string | null
	createdAt: string
}

function useCompanyId() {
	const user = useAuthStore((s) => s.user)
	return user?.companyId ?? ''
}

export function useCustomers(params?: Record<string, string>) {
	const companyId = useCompanyId()

	return useQuery({
		queryKey: ['customers', companyId, params],
		queryFn: () => api.customers.list(companyId, params) as Promise<Customer[]>,
		enabled: !!companyId,
	})
}

export function useCustomer(customerId: string) {
	const companyId = useCompanyId()

	return useQuery({
		queryKey: ['customers', companyId, customerId],
		queryFn: () => api.customers.get(companyId, customerId) as Promise<CustomerDetail>,
		enabled: !!companyId && !!customerId,
	})
}
