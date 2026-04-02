import { createRootRoute, createRoute, Outlet, useNavigate, useParams } from '@tanstack/react-router'
import { useAuthStore } from '../stores/auth-store'
import { LoginPage } from '../pages/LoginPage'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { AppShell } from '../components/layout/AppShell'
import { ChatLayout } from '../components/chat/ChatLayout'
import { DashboardPage } from '../pages/DashboardPage'
import { CustomerPage } from '../pages/CustomerPage'
import { SettingsPage } from '../pages/SettingsPage'
import { PaymentPage } from '../pages/PaymentPage'
import { SatisfactionPage } from '../pages/SatisfactionPage'

// Root layout with auth guard
function RootLayout() {
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
	const navigate = useNavigate()

	if (!isAuthenticated) {
		return <LoginPage onSuccess={() => navigate({ to: '/chat' })} />
	}

	return (
		<ErrorBoundary>
			<AppShell>
				<Outlet />
			</AppShell>
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
	component: () => <ChatLayout />,
})

function ChatRoomPage() {
	const { roomId } = useParams({ from: '/chat/$roomId' })
	return <ChatLayout roomId={roomId} />
}

const chatRoomRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/chat/$roomId',
	component: ChatRoomPage,
})

const customerRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/customer',
	component: CustomerPage,
})

const dashboardRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/dashboard',
	component: DashboardPage,
})

const settingsRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/settings',
	component: SettingsPage,
})

const settingsIntegrationsRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/settings/integrations',
	component: SettingsPage,
})

const settingsGreetingRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/settings/greeting',
	component: SettingsPage,
})

const settingsAutoReplyRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/settings/auto-reply',
	component: SettingsPage,
})

const settingsAutoAssignmentRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/settings/auto-assignment',
	component: SettingsPage,
})

const settingsShortcutsRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/settings/shortcuts',
	component: SettingsPage,
})

const settingsChatbotRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/settings/chatbot',
	component: SettingsPage,
})

const paymentRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/payment',
	component: PaymentPage,
})

const satisfactionRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/satisfaction',
	component: SatisfactionPage,
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
