import { useAuthStore } from '@/stores/auth-store'
import { SidebarNavItem } from './SidebarNavItem'

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function CustomerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

function PaymentIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  )
}

function SatisfactionIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

export function Sidebar() {
  const user = useAuthStore((s) => s.user)
  const initials = user?.displayName?.slice(0, 2)?.toUpperCase() ?? 'OB'

  return (
    <aside className="w-[62px] bg-bg-app flex flex-col items-center py-4 pb-5 shrink-0 border-r border-border z-20 transition-[background] duration-350">
      {/* Logo */}
      <div className="w-9 h-9 bg-gradient-to-br from-primary-light to-primary rounded-xl flex items-center justify-center font-[800] text-[15px] text-white mb-[22px] shrink-0 shadow-[0_0_0_1px_rgba(255,255,255,0.15)_inset,0_4px_20px_var(--color-primary-glow)]">
        O
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-0.5 w-full px-[11px]">
        <SidebarNavItem to="/chat" label="Chat" icon={<ChatIcon />} hasNotification />
        <SidebarNavItem to="/customer" label="Customer" icon={<CustomerIcon />} />
        <SidebarNavItem to="/dashboard" label="Dashboard" icon={<DashboardIcon />} />
        <SidebarNavItem to="/settings" label="Settings" icon={<SettingsIcon />} />
        <SidebarNavItem to="/payment" label="Payment" icon={<PaymentIcon />} />
        <SidebarNavItem to="/satisfaction" label="Satisfaction" icon={<SatisfactionIcon />} />
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User avatar */}
      <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-[#a78bfa] to-[#7c3aed] flex items-center justify-center text-[11px] font-bold text-white cursor-pointer shadow-[0_0_0_2.5px_rgba(167,139,250,0.3)]">
        {initials}
        <span className="absolute bottom-[1px] right-[1px] w-2 h-2 rounded-full bg-success border-[1.5px] border-bg-app" />
      </div>
    </aside>
  )
}
