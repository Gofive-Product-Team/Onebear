export interface ProblemDetails {
	type?: string
	title?: string
	status?: number
	detail?: string
	instance?: string
	errors?: Record<string, string[]>
	correlationId?: string
}

export class ApiError extends Error {
	constructor(
		public readonly status: number,
		public readonly statusText: string,
		public readonly body: ProblemDetails | null,
		public readonly correlationId?: string,
	) {
		super(body?.detail ?? `API ${status}: ${statusText}`)
		this.name = 'ApiError'
	}

	get isNotFound(): boolean {
		return this.status === 404
	}

	get isValidation(): boolean {
		return this.status === 400
	}

	get isConflict(): boolean {
		return this.status === 409
	}

	get isRateLimited(): boolean {
		return this.status === 429
	}

	get isForbidden(): boolean {
		return this.status === 403
	}

	get isUnauthorized(): boolean {
		return this.status === 401
	}
}
