export interface PagedResponse<T> {
	data: T[]
	continuationToken: string | null
	hasMore: boolean
}

export interface PaginationParams {
	pageSize?: number
	continuationToken?: string | null
}

export function toQueryParams(params: PaginationParams): Record<string, string> {
	const result: Record<string, string> = {}
	if (params.pageSize) result.pageSize = params.pageSize.toString()
	if (params.continuationToken) result.continuationToken = params.continuationToken
	return result
}
