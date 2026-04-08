import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth-store'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProductImage {
	url: string
	sortOrder: number
	isPrimary: boolean
}

export interface ProductVariant {
	id: string
	type: string
	value: string
	stock: number
	priceAdjustment: number
}

export interface ProductRelationship {
	productId: string
	productName: string | null
	customPrice: number | null
	sortOrder: number
}

export interface Product {
	id: string
	name: string
	category: string
	description: string | null
	price: number
	stock: number | null
	effectiveStock: number | null
	allowPreOrder: boolean
	status: string
	imageUrl: string | null
	images: ProductImage[]
	variants: ProductVariant[]
	upsells: ProductRelationship[]
	crossSells: ProductRelationship[]
	upsellMaxPrice: number | null
	isSample: boolean
	createdTimestamp: number
	updatedTimestamp: number | null
}

interface ProductsResponse {
	data: Product[]
	continuationToken: string | null
	hasMore: boolean
}

export interface CreateProductBody {
	name: string
	category: string
	description?: string
	price: number
	stock?: number | null
	allowPreOrder?: boolean
	imageUrl?: string
	images?: ProductImage[]
	variants?: Omit<ProductVariant, 'id'>[]
	upsells?: Omit<ProductRelationship, 'productName'>[]
	crossSells?: Omit<ProductRelationship, 'productName'>[]
	upsellMaxPrice?: number
}

export interface CsvImportResult {
	created: number
	updated: number
	skipped: number
	errors: { row: number; field: string; message: string }[]
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useProducts(params?: Record<string, string>) {
	const companyId = useAuthStore((s) => s.user?.companyId ?? '')

	return useQuery({
		queryKey: ['products', companyId, params],
		queryFn: () => api.products.list(companyId!, params) as Promise<ProductsResponse>,
		enabled: !!companyId,
	})
}

export function useProduct(productId: string | null) {
	const companyId = useAuthStore((s) => s.user?.companyId ?? '')

	return useQuery({
		queryKey: ['product', companyId, productId],
		queryFn: () => api.products.get(companyId!, productId!) as Promise<Product>,
		enabled: !!companyId && !!productId,
	})
}

export function useProductCategories() {
	const companyId = useAuthStore((s) => s.user?.companyId ?? '')

	return useQuery({
		queryKey: ['product-categories', companyId],
		queryFn: () => api.products.categories(companyId!),
		enabled: !!companyId,
	})
}

export function useCreateProduct() {
	const companyId = useAuthStore((s) => s.user?.companyId ?? '')
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (body: CreateProductBody) => api.products.create(companyId!, body),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['products'] })
			queryClient.invalidateQueries({ queryKey: ['product-categories'] })
		},
	})
}

export function useUpdateProduct() {
	const companyId = useAuthStore((s) => s.user?.companyId ?? '')
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({ productId, body }: { productId: string; body: Partial<CreateProductBody> & { status?: string } }) =>
			api.products.update(companyId!, productId, body),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['products'] })
			queryClient.invalidateQueries({ queryKey: ['product'] })
			queryClient.invalidateQueries({ queryKey: ['product-categories'] })
		},
	})
}

export function useDeleteProduct() {
	const companyId = useAuthStore((s) => s.user?.companyId ?? '')
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (productId: string) => api.products.delete(companyId!, productId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['products'] })
			queryClient.invalidateQueries({ queryKey: ['product-categories'] })
		},
	})
}

export function useImportProducts() {
	const companyId = useAuthStore((s) => s.user?.companyId ?? '')
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (rows: object[]) => api.products.importCsv(companyId!, rows) as Promise<CsvImportResult>,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['products'] })
			queryClient.invalidateQueries({ queryKey: ['product-categories'] })
		},
	})
}
