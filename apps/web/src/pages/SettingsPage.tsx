import { useState } from 'react'
import { cn } from '@one-bear/ui'
import { IntegrationList } from '@/components/settings/IntegrationList'
import { GreetingEditor } from '@/components/settings/GreetingEditor'
import { AutoReplyEditor } from '@/components/settings/AutoReplyEditor'
import { AutoAssignmentConfig } from '@/components/settings/AutoAssignmentConfig'
import { ShortcutManager } from '@/components/settings/ShortcutManager'
import { ChatbotConfig } from '@/components/settings/ChatbotConfig'
import { NotificationSettings } from '@/components/settings/NotificationSettings'
import { TeamTab } from '@/components/settings/TeamTab'
import { WorkspaceSettings } from '@/components/settings/WorkspaceSettings'
import { BillingSettings } from '@/components/settings/BillingSettings'
import { AuditLogSettings } from '@/components/settings/AuditLogSettings'
import { PaymentConfigSettings } from '@/components/settings/PaymentConfigSettings'
import { AiSalesAgentSettings } from '@/components/settings/AiSalesAgentSettings'

type SettingsSection =
	| 'workspace'
	| 'integrations'
	| 'greeting'
	| 'auto-reply'
	| 'auto-assignment'
	| 'shortcuts'
	| 'chatbot'
	| 'ai-sales-agent'
	| 'notifications'
	| 'team'
	| 'payment-config'
	| 'billing'
	| 'audit-log'

interface SectionDef {
	id: SettingsSection
	label: string
	icon: string
	group?: string
}

const sections: SectionDef[] = [
	// General group
	{ id: 'workspace',       label: 'ทั่วไป',            group: 'general',    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
	{ id: 'team',            label: 'Team',               group: 'general',    icon: 'M18 21a8 8 0 00-16 0M12 11a4 4 0 100-8 4 4 0 000 8zm7-3a3 3 0 100-6M22 21a6 6 0 00-6-6' },
	{ id: 'notifications',   label: 'Notifications',      group: 'general',    icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
	// Messaging group
	{ id: 'integrations',    label: 'Integrations',       group: 'messaging',  icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' },
	{ id: 'greeting',        label: 'Greeting Messages',  group: 'messaging',  icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
	{ id: 'auto-reply',      label: 'Auto Reply',         group: 'messaging',  icon: 'M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6' },
	{ id: 'auto-assignment', label: 'Auto Assignment',    group: 'messaging',  icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
	{ id: 'shortcuts',       label: 'Shortcuts',          group: 'messaging',  icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
	{ id: 'chatbot',         label: 'AI Chatbot',         group: 'messaging',  icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
	{ id: 'ai-sales-agent',  label: 'AI Sales Agent',     group: 'messaging',  icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
	// Payments group
	{ id: 'payment-config',  label: 'การชำระเงิน',        group: 'payments',   icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
	// Admin group
	{ id: 'billing',         label: 'Billing',            group: 'admin',      icon: 'M9 14H5l-1 1v3l1 1h14l1-1v-3l-1-1h-4M9 6h6m-3-3v3m0 12v3M4 7l-2 1M20 7l2 1M4 17l-2-1M20 17l2-1' },
	{ id: 'audit-log',       label: 'Audit Log',          group: 'admin',      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
]

const GROUP_LABELS: Record<string, string> = {
	general: 'ทั่วไป',
	messaging: 'Messaging',
	payments: 'Payments',
	admin: 'Admin',
}

function SectionContent({ section }: { section: SettingsSection }) {
	switch (section) {
		case 'workspace':
			return <WorkspaceSettings />
		case 'integrations':
			return <IntegrationList />
		case 'greeting':
			return <GreetingEditor />
		case 'auto-reply':
			return <AutoReplyEditor />
		case 'auto-assignment':
			return <AutoAssignmentConfig />
		case 'shortcuts':
			return <ShortcutManager />
		case 'chatbot':
			return <ChatbotConfig />
		case 'ai-sales-agent':
			return <AiSalesAgentSettings />
		case 'team':
			return <TeamTab />
		case 'notifications':
			return <NotificationSettings />
		case 'payment-config':
			return <PaymentConfigSettings />
		case 'billing':
			return <BillingSettings />
		case 'audit-log':
			return <AuditLogSettings />
	}
}

export function SettingsPage() {
	const [activeSection, setActiveSection] = useState<SettingsSection>('workspace')

	// Group sections
	const groups = ['general', 'messaging', 'payments', 'admin']

	return (
		<div className="mx-auto max-w-7xl space-y-6">
			<div>
				<h1 className="text-2xl font-bold text-t1">Settings</h1>
				<p className="mt-1 text-sm text-t2">
					Configure integrations, messaging rules, and AI chatbot
				</p>
			</div>

			<div className="flex flex-col gap-6 lg:flex-row">
				{/* Side Navigation */}
				<nav className="w-full shrink-0 lg:w-56">
					{/* Mobile: horizontal scroll */}
					<div className="flex gap-1 overflow-x-auto pb-2 lg:hidden">
						{sections.map((section) => (
							<button
								key={section.id}
								type="button"
								onClick={() => setActiveSection(section.id)}
								className={cn(
									'flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
									activeSection === section.id
										? 'bg-primary-alpha text-primary-light'
										: 'text-t2 hover:bg-bg-hover hover:text-t1',
								)}
							>
								<svg
									className="h-4 w-4 shrink-0"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									strokeWidth={1.5}
								>
									<path strokeLinecap="round" strokeLinejoin="round" d={section.icon} />
								</svg>
								<span className="whitespace-nowrap">{section.label}</span>
							</button>
						))}
					</div>

					{/* Desktop: grouped sidebar */}
					<div className="hidden lg:flex lg:flex-col lg:gap-4">
						{groups.map((group) => {
							const groupSections = sections.filter((s) => s.group === group)
							if (groupSections.length === 0) return null
							return (
								<div key={group}>
									<div className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-t3">
										{GROUP_LABELS[group]}
									</div>
									<div className="flex flex-col gap-0.5">
										{groupSections.map((section) => (
											<button
												key={section.id}
												type="button"
												onClick={() => setActiveSection(section.id)}
												className={cn(
													'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
													activeSection === section.id
														? 'bg-primary-alpha text-primary-light'
														: 'text-t2 hover:bg-bg-hover hover:text-t1',
												)}
											>
												<svg
													className="h-4 w-4 shrink-0"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
													strokeWidth={1.5}
												>
													<path strokeLinecap="round" strokeLinejoin="round" d={section.icon} />
												</svg>
												<span className="whitespace-nowrap">{section.label}</span>
											</button>
										))}
									</div>
								</div>
							)
						})}
					</div>
				</nav>

				{/* Content Area */}
				<div className="min-w-0 flex-1">
					<SectionContent section={activeSection} />
				</div>
			</div>
		</div>
	)
}
