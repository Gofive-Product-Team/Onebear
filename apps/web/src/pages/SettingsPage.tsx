import { useState } from 'react'
import { cn } from '@one-bear/ui'
import { IntegrationList } from '@/components/settings/IntegrationList'
import { GreetingEditor } from '@/components/settings/GreetingEditor'
import { AutoReplyEditor } from '@/components/settings/AutoReplyEditor'
import { AutoAssignmentConfig } from '@/components/settings/AutoAssignmentConfig'
import { ShortcutManager } from '@/components/settings/ShortcutManager'
import { ChatbotConfig } from '@/components/settings/ChatbotConfig'
import { NotificationSettings } from '@/components/settings/NotificationSettings'

type SettingsSection =
	| 'integrations'
	| 'greeting'
	| 'auto-reply'
	| 'auto-assignment'
	| 'shortcuts'
	| 'chatbot'
	| 'notifications'

const sections: Array<{ id: SettingsSection; label: string; icon: string }> = [
	{ id: 'integrations', label: 'Integrations', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' },
	{ id: 'greeting', label: 'Greeting Messages', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
	{ id: 'auto-reply', label: 'Auto Reply', icon: 'M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6' },
	{ id: 'auto-assignment', label: 'Auto Assignment', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
	{ id: 'shortcuts', label: 'Shortcuts', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
	{ id: 'chatbot', label: 'AI Chatbot', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
	{ id: 'notifications', label: 'Notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
]

function SectionContent({ section }: { section: SettingsSection }) {
	switch (section) {
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
		case 'notifications':
			return <NotificationSettings />
	}
}

export function SettingsPage() {
	const [activeSection, setActiveSection] = useState<SettingsSection>('integrations')

	return (
		<div className="mx-auto max-w-7xl space-y-6">
			<div>
				<h1 className="text-2xl font-bold text-gray-900">Settings</h1>
				<p className="mt-1 text-sm text-gray-500">
					Configure integrations, messaging rules, and AI chatbot
				</p>
			</div>

			<div className="flex flex-col gap-6 lg:flex-row">
				{/* Side Navigation */}
				<nav className="w-full shrink-0 lg:w-56">
					{/* Mobile: horizontal scroll */}
					<div className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-x-visible lg:pb-0">
						{sections.map((section) => (
							<button
								key={section.id}
								type="button"
								onClick={() => setActiveSection(section.id)}
								className={cn(
									'flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
									activeSection === section.id
										? 'bg-blue-50 text-blue-700'
										: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
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
				</nav>

				{/* Content Area */}
				<div className="min-w-0 flex-1">
					<SectionContent section={activeSection} />
				</div>
			</div>
		</div>
	)
}
