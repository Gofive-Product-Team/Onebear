import { createRootRoute, createRoute, Outlet, Link, useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '../stores/auth-store'
import { LoginPage } from '../pages/LoginPage'
import { ErrorBoundary } from '../components/ErrorBoundary'

// Root layout with auth guard
function RootLayout() {
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
	const user = useAuthStore((s) => s.user)
	const logout = useAuthStore((s) => s.logout)
	const navigate = useNavigate()

	if (!isAuthenticated) {
		return <LoginPage onSuccess={() => navigate({ to: '/chat' })} />
	}

	return (
		<ErrorBoundary>
			<div className="min-h-screen bg-gray-50">
				<nav className="bg-white border-b border-gray-200 px-4 py-3">
					<div className="flex items-center gap-6">
						<span className="font-bold text-lg">One Bear</span>
						<Link
							to="/"
							className="text-sm text-gray-600 hover:text-gray-900 [&.active]:text-blue-600 [&.active]:font-medium"
						>
							Home
						</Link>
						<Link
							to="/chat"
							className="text-sm text-gray-600 hover:text-gray-900 [&.active]:text-blue-600 [&.active]:font-medium"
						>
							Chat
						</Link>
						<Link
							to="/customer"
							className="text-sm text-gray-600 hover:text-gray-900 [&.active]:text-blue-600 [&.active]:font-medium"
						>
							Customer
						</Link>
						<Link
							to="/dashboard"
							className="text-sm text-gray-600 hover:text-gray-900 [&.active]:text-blue-600 [&.active]:font-medium"
						>
							Dashboard
						</Link>
						<Link
							to="/settings"
							className="text-sm text-gray-600 hover:text-gray-900 [&.active]:text-blue-600 [&.active]:font-medium"
						>
							Settings
						</Link>
						<Link
							to="/payment"
							className="text-sm text-gray-600 hover:text-gray-900 [&.active]:text-blue-600 [&.active]:font-medium"
						>
							Payment
						</Link>
						<Link
							to="/satisfaction"
							className="text-sm text-gray-600 hover:text-gray-900 [&.active]:text-blue-600 [&.active]:font-medium"
						>
							Satisfaction
						</Link>
						<div className="ml-auto flex items-center gap-3">
							{user && <span className="text-sm text-gray-500">{user.displayName}</span>}
							<button
								onClick={() => {
									logout()
									navigate({ to: '/' })
								}}
								className="text-sm text-gray-500 hover:text-red-600"
							>
								Logout
							</button>
						</div>
					</div>
				</nav>
				<main className="p-6">
					<Outlet />
				</main>
			</div>
		</ErrorBoundary>
	)
}

const rootRoute = createRootRoute({
	component: RootLayout,
})

// Placeholder component factory
function TodoPage({ name }: { name: string }) {
	return (
		<div className="max-w-2xl mx-auto mt-12 text-center">
			<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
				<h1 className="text-2xl font-bold text-gray-900 mb-2">TODO: {name}</h1>
				<p className="text-gray-500">This page is a placeholder. Feature implementation pending.</p>
			</div>
		</div>
	)
}

// Routes
const indexRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/',
	component: () => (
		<div className="max-w-2xl mx-auto mt-12 text-center">
			<h1 className="text-4xl font-bold text-gray-900 mb-4">One Bear Platform</h1>
			<p className="text-lg text-gray-600 mb-2">Multi-platform social messaging SaaS</p>
			<p className="text-sm text-gray-400">Scaffold v1.0.0 — All features are TODO</p>
		</div>
	),
})

const chatRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/chat',
	component: () => <TodoPage name="Chat — Room List" />,
})

const chatRoomRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/chat/$roomId',
	component: () => <TodoPage name="Chat — Conversation View" />,
})

const customerRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/customer',
	component: () => <TodoPage name="Customer Management" />,
})

const dashboardRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/dashboard',
	component: () => <TodoPage name="Dashboard — Analytics" />,
})

const settingsRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/settings',
	component: () => <TodoPage name="Settings" />,
})

const settingsIntegrationsRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/settings/integrations',
	component: () => <TodoPage name="Settings — Integrations" />,
})

const settingsGreetingRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/settings/greeting',
	component: () => <TodoPage name="Settings — Greeting Messages" />,
})

const settingsAutoReplyRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/settings/auto-reply',
	component: () => <TodoPage name="Settings — Auto Reply" />,
})

const settingsAutoAssignmentRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/settings/auto-assignment',
	component: () => <TodoPage name="Settings — Auto Assignment" />,
})

const settingsShortcutsRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/settings/shortcuts',
	component: () => <TodoPage name="Settings — Shortcuts" />,
})

const settingsChatbotRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/settings/chatbot',
	component: () => <TodoPage name="Settings — AI Chatbot" />,
})

const paymentRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/payment',
	component: () => <TodoPage name="Payment" />,
})

const satisfactionRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/satisfaction',
	component: () => <TodoPage name="Satisfaction Survey" />,
})

// Build route tree
export const routeTree = rootRoute.addChildren([
	indexRoute,
	chatRoute,
	chatRoomRoute,
	customerRoute,
	dashboardRoute,
	settingsRoute,
	settingsIntegrationsRoute,
	settingsGreetingRoute,
	settingsAutoReplyRoute,
	settingsAutoAssignmentRoute,
	settingsShortcutsRoute,
	settingsChatbotRoute,
	paymentRoute,
	satisfactionRoute,
])
