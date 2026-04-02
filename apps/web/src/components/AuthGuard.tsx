import type { ReactNode } from 'react'
import { useAuthStore } from '../stores/auth-store'
import type { PermissionId } from '@one-bear/shared-types'

interface AuthGuardProps {
	requiredPermission?: PermissionId
	children: ReactNode
}

export function AuthGuard({ requiredPermission, children }: AuthGuardProps) {
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
	const hasPermission = useAuthStore((s) => s.hasPermission)

	if (!isAuthenticated) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50">
				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
					<h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
					<p className="text-gray-500">Please sign in to access this page.</p>
				</div>
			</div>
		)
	}

	if (requiredPermission !== undefined && !hasPermission(requiredPermission)) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50">
				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
					<h2 className="text-xl font-semibold text-red-600 mb-2">Insufficient Permissions</h2>
					<p className="text-gray-500">You do not have permission to access this page.</p>
				</div>
			</div>
		)
	}

	return <>{children}</>
}
