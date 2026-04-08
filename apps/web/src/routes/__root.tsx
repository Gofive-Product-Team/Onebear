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
import { ProductsPage } from '../pages/ProductsPage'
import { OrdersPage } from '../pages/OrdersPage'
import { BookingsPage } from '../pages/BookingsPage'
import { OnboardingPage } from '../pages/OnboardingPage'
import { FollowUpPage } from '../pages/FollowUpPage'
import { SlipVerificationPage } from '../pages/SlipVerificationPage'
import { CalendarKpiPage } from '../pages/CalendarKpiPage'
import { InsightsPage } from '../pages/InsightsPage'
import { AiAgentPage } from '../pages/AiAgentPage'

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
	component: CalendarKpiPage,
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

const productsRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/products',
	component: ProductsPage,
})

const ordersRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/orders',
	component: OrdersPage,
})

const bookingsRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/bookings',
	component: BookingsPage,
})

const onboardingRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/onboarding',
	component: OnboardingPage,
})

const oauthCallbackRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/oauth/callback/$platform',
	component: OAuthCallbackPage,
})

const followUpRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/followup',
	component: FollowUpPage,
})

const slipsRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/slips',
	component: SlipVerificationPage,
})

const calendarRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/calendar',
	component: CalendarKpiPage,
})

const insightsRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/insights',
	component: InsightsPage,
})

const aiAgentRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/ai-agent',
	component: AiAgentPage,
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
	productsRoute,
	ordersRoute,
	bookingsRoute,
	onboardingRoute,
	oauthCallbackRoute,
	followUpRoute,
	slipsRoute,
	calendarRoute,
	insightsRoute,
	aiAgentRoute,
])
