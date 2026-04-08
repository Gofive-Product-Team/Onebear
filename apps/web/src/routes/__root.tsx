import { createRootRoute, createRoute, Outlet, useParams, useRouterState } from '@tanstack/react-router'
import { createContext, useContext } from 'react'
import type { HubConnection } from '@microsoft/signalr'
import { useAuthStore } from '../stores/auth-store'
import { useSignalR } from '../hooks/useSignalR'
import { useSignalREvents } from '../hooks/useSignalREvents'
import { LoginPage } from '../pages/LoginPage'
import { RegisterPage } from '../pages/RegisterPage'
import { AuthCallbackPage } from '../pages/AuthCallbackPage'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { NotificationToast } from '../components/ui/NotificationToast'
import { AppShell } from '../components/layout/AppShell'
import { ChatLayout } from '../components/chat/ChatLayout'
import { DashboardPage } from '../pages/DashboardPage'
import { CustomerPage } from '../pages/CustomerPage'
import { CustomerProfilePage } from '../pages/CustomerProfilePage'
import { SettingsPage } from '../pages/SettingsPage'
import { PaymentPage } from '../pages/PaymentPage'
import { SatisfactionPage } from '../pages/SatisfactionPage'
import { OAuthCallbackPage } from '../pages/OAuthCallbackPage'

// SignalR context — connection lives at root level, survives route changes
interface SignalRContextValue {
	connection: HubConnection | null
	isConnected: boolean
}
const SignalRContext = createContext<SignalRContextValue>({ connection: null, isConnected: false })
export function useSignalRContext() {
	return useContext(SignalRContext)
}

// Public routes that don't require authentication
const PUBLIC_PATHS = ['/register', '/auth/callback']

// Root layout with auth guard + SignalR provider
function RootLayout() {
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
	const currentPath = useRouterState().location.pathname

	// SignalR lives here — never unmounts while authenticated
	const { connection, isConnected } = useSignalR()
	useSignalREvents(connection)

	// Allow public routes without authentication
	const isPublicRoute = PUBLIC_PATHS.some((p) => currentPath.startsWith(p))
	if (isPublicRoute) {
		return <Outlet />
	}

	if (!isAuthenticated) {
		return <LoginPage />
	}

	return (
		<ErrorBoundary>
			<SignalRContext.Provider value={{ connection, isConnected }}>
				<AppShell>
					<Outlet />
				</AppShell>
				<NotificationToast />
			</SignalRContext.Provider>
		</ErrorBoundary>
	)
}

const rootRoute = createRootRoute({
	component: RootLayout,
})

// Routes
const indexRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/',
	component: () => (
		<div className="max-w-2xl mx-auto mt-12 text-center">
			<h1 className="text-4xl font-bold text-t1 mb-4">One Bear Platform</h1>
			<p className="text-lg text-t2 mb-2">Multi-platform social messaging SaaS</p>
			<p className="text-sm text-t3">Scaffold v1.0.0</p>
		</div>
	),
})

const registerRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/register',
	component: RegisterPage,
})

const authCallbackRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/auth/callback',
	component: AuthCallbackPage,
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

function CustomerProfileRoutePage() {
	const { customerId } = useParams({ from: '/customer/$customerId' })
	return <CustomerProfilePage customerId={customerId} />
}

const customerProfileRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/customer/$customerId',
	component: CustomerProfileRoutePage,
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

const oauthCallbackRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/oauth/callback/$platform',
	component: OAuthCallbackPage,
})

// Build route tree
export const routeTree = rootRoute.addChildren([
	indexRoute,
	registerRoute,
	authCallbackRoute,
	chatRoute,
	chatRoomRoute,
	customerRoute,
	customerProfileRoute,
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
	oauthCallbackRoute,
])
