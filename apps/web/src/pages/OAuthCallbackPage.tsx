import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useOAuthCallback } from '@/api/useOAuth'

export function OAuthCallbackPage() {
	const navigate = useNavigate()
	const callbackMutation = useOAuthCallback()

	useEffect(() => {
		const params = new URLSearchParams(window.location.search)
		const platform = params.get('platform') ?? ''
		const code = params.get('code') ?? ''
		const state = params.get('state') ?? ''
		const shopId = params.get('shop_id') ?? undefined

		callbackMutation.mutate(
			{ platform, code, state, ...(shopId ? { shopId } : {}) },
			{
				onSuccess: () => {
					navigate({ to: '/settings' })
				},
			},
		)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	if (callbackMutation.isError) {
		const error = callbackMutation.error
		const message = error instanceof Error ? error.message : 'An unexpected error occurred.'

		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50">
				<div className="bg-white rounded-lg shadow-sm border border-red-200 p-8 text-center max-w-md">
					<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
						<svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
						</svg>
					</div>
					<h2 className="text-xl font-semibold text-gray-900 mb-2">Connection Failed</h2>
					<p className="text-sm text-gray-500 mb-6">{message}</p>
					<button
						type="button"
						onClick={() => navigate({ to: '/settings' })}
						className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
					>
						Back to Settings
					</button>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50">
			<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center max-w-md">
				<div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
				<h2 className="text-xl font-semibold text-gray-900 mb-2">Connecting...</h2>
				<p className="text-sm text-gray-500">Completing platform authorization, please wait.</p>
			</div>
		</div>
	)
}
