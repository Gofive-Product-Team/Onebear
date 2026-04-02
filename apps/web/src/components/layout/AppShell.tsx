import { type ReactNode } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { cn } from '@one-bear/ui'
import { useUIStore } from '../../stores/ui-store'
import { useAuthStore } from '../../stores/auth-store'
import { Avatar } from '../ui/Avatar'
import { Separator } from '../ui/Separator'
import { Sheet, SheetHeader, SheetTitle, SheetContent, SheetClose } from '../ui/Sheet'
import { Tooltip } from '../ui/Tooltip'
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuLabel,
} from '../ui/DropdownMenu'

interface NavItem {
	to: string
	label: string
	icon: string
}

const NAV_ITEMS: NavItem[] = [
	{ to: '/chat', label: 'Chat', icon: '\u{1F4AC}' },
	{ to: '/customer', label: 'Customer', icon: '\u{1F465}' },
	{ to: '/dashboard', label: 'Dashboard', icon: '\u{1F4CA}' },
	{ to: '/settings', label: 'Settings', icon: '\u2699\uFE0F' },
	{ to: '/payment', label: 'Payment', icon: '\u{1F4B3}' },
	{ to: '/satisfaction', label: 'Satisfaction', icon: '\u2B50' },
]

function SidebarToggleIcon({ collapsed }: { collapsed: boolean }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="20"
			height="20"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={cn('transition-transform', collapsed && 'rotate-180')}
		>
			<rect width="18" height="18" x="3" y="3" rx="2" />
			<path d="M9 3v18" />
			<path d="m14 9 3 3-3 3" />
		</svg>
	)
}

function MenuIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="20"
			height="20"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<line x1="4" x2="20" y1="12" y2="12" />
			<line x1="4" x2="20" y1="6" y2="6" />
			<line x1="4" x2="20" y1="18" y2="18" />
		</svg>
	)
}

function useCurrentPath(): string {
	const routerState = useRouterState()
	return routerState.location.pathname
}

function isChatPath(pathname: string): boolean {
	return pathname === '/chat' || pathname.startsWith('/chat/')
}

function isActive(currentPath: string, to: string): boolean {
	if (to === '/') return currentPath === '/'
	return currentPath === to || currentPath.startsWith(to + '/')
}

function NavLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
	const currentPath = useCurrentPath()
	const active = isActive(currentPath, item.to)

	const link = (
		<Link
			to={item.to}
			className={cn(
				'flex items-center rounded-md transition-colors',
				collapsed ? 'justify-center h-10 w-10' : 'gap-3 px-3 py-2',
				active
					? 'bg-blue-50 text-blue-700 font-medium'
					: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
			)}
		>
			<span className="text-lg leading-none shrink-0">{item.icon}</span>
			{!collapsed && <span className="text-sm">{item.label}</span>}
		</Link>
	)

	if (collapsed) {
		return (
			<Tooltip content={item.label} side="right">
				{link}
			</Tooltip>
		)
	}

	return link
}

function SidebarNav({ collapsed }: { collapsed: boolean }) {
	return (
		<nav className={cn('flex flex-col gap-1', collapsed ? 'items-center' : 'px-3')}>
			{NAV_ITEMS.map((item) => (
				<NavLink key={item.to} item={item} collapsed={collapsed} />
			))}
		</nav>
	)
}

function DesktopSidebar() {
	const sidebarOpen = useUIStore((s) => s.sidebarOpen)
	const toggleSidebar = useUIStore((s) => s.toggleSidebar)
	const collapsed = !sidebarOpen

	return (
		<aside
			className={cn(
				'hidden md:flex flex-col border-r border-gray-200 bg-white transition-all duration-200',
				collapsed ? 'w-16' : 'w-[280px]',
			)}
		>
			{/* Logo area */}
			<div className={cn('flex items-center border-b border-gray-200 h-14 shrink-0', collapsed ? 'justify-center px-2' : 'px-4')}>
				{collapsed ? (
					<span className="text-xl font-bold text-blue-600">O</span>
				) : (
					<span className="text-lg font-bold text-gray-900">One Bear</span>
				)}
			</div>

			{/* Navigation */}
			<div className="flex-1 overflow-y-auto py-3">
				<SidebarNav collapsed={collapsed} />
			</div>

			{/* Collapse toggle */}
			<div className={cn('border-t border-gray-200 py-2', collapsed ? 'flex justify-center' : 'px-3')}>
				<button
					type="button"
					onClick={toggleSidebar}
					className={cn(
						'flex items-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700',
						collapsed ? 'justify-center h-10 w-10' : 'gap-2 px-3 py-2 w-full',
					)}
					aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
				>
					<SidebarToggleIcon collapsed={collapsed} />
					{!collapsed && <span className="text-sm">Collapse</span>}
				</button>
			</div>
		</aside>
	)
}

function MobileSidebar() {
	const sidebarOpen = useUIStore((s) => s.sidebarOpen)
	const toggleSidebar = useUIStore((s) => s.toggleSidebar)

	return (
		<Sheet open={sidebarOpen} onOpenChange={toggleSidebar} side="left">
			<SheetHeader>
				<SheetTitle>One Bear</SheetTitle>
				<SheetClose onClose={toggleSidebar} />
			</SheetHeader>
			<SheetContent className="py-3">
				<SidebarNav collapsed={false} />
			</SheetContent>
		</Sheet>
	)
}

function getPageTitle(pathname: string): string {
	for (const item of NAV_ITEMS) {
		if (isActive(pathname, item.to)) return item.label
	}
	if (pathname === '/') return 'Home'
	return 'One Bear'
}

function Header() {
	const user = useAuthStore((s) => s.user)
	const logout = useAuthStore((s) => s.logout)
	const toggleSidebar = useUIStore((s) => s.toggleSidebar)
	const currentPath = useCurrentPath()
	const pageTitle = getPageTitle(currentPath)

	return (
		<header className="flex items-center h-14 border-b border-gray-200 bg-white px-4 shrink-0">
			{/* Mobile menu button */}
			<button
				type="button"
				onClick={toggleSidebar}
				className="md:hidden mr-3 rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
				aria-label="Open menu"
			>
				<MenuIcon />
			</button>

			<h1 className="text-base font-semibold text-gray-900">{pageTitle}</h1>

			<div className="ml-auto flex items-center gap-3">
				<DropdownMenu>
					<DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-gray-100">
						<Avatar
							src={null}
							fallback={user?.displayName?.slice(0, 2) ?? '?'}
							size="sm"
						/>
						<span className="hidden sm:block text-sm text-gray-700">{user?.displayName ?? 'User'}</span>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							className="text-gray-400"
						>
							<path d="m6 9 6 6 6-6" />
						</svg>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuLabel>
							<div className="flex flex-col">
								<span className="text-sm font-medium text-gray-900">{user?.displayName}</span>
								<span className="text-xs font-normal text-gray-500">{user?.email}</span>
							</div>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuItem onClick={logout} destructive>
							Sign out
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</header>
	)
}

interface Props {
	children: ReactNode
}

export function AppShell({ children }: Props) {
	const currentPath = useCurrentPath()
	const isChat = isChatPath(currentPath)

	return (
		<div className="flex h-screen overflow-hidden bg-gray-50">
			<DesktopSidebar />

			{/* Mobile sidebar (rendered as Sheet overlay) */}
			<div className="md:hidden">
				<MobileSidebar />
			</div>

			{/* Main content area */}
			<div className="flex flex-1 flex-col overflow-hidden">
				<Header />
				<main className={cn('flex-1 overflow-hidden', isChat ? '' : 'overflow-y-auto p-6')}>
					{children}
				</main>
			</div>
		</div>
	)
}
