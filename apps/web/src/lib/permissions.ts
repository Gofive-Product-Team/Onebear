export interface PermissionDef {
	id: number
	key: string
	label: string
	description: string
}

export interface PermissionGroup {
	module: string
	icon: string
	permissions: PermissionDef[]
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
	{
		module: 'Chat',
		icon: 'MessageCircle',
		permissions: [
			{ id: 3001, key: 'chat.view', label: 'View chats', description: 'View assigned chat rooms' },
			{ id: 3002, key: 'chat.resolve', label: 'Resolve chats', description: 'Close and resolve conversations' },
			{ id: 3003, key: 'chat.mention', label: 'Mention', description: 'Mention team members' },
			{ id: 3004, key: 'chat.assign', label: 'Assign chats', description: 'Assign chats to any member' },
			{ id: 3005, key: 'chat.access_all', label: 'Access all chats', description: 'View all chats, not just assigned' },
		],
	},
	{
		module: 'Customer',
		icon: 'Users',
		permissions: [
			{ id: 3010, key: 'customer.view', label: 'View customers', description: 'Browse customer list' },
			{ id: 3011, key: 'customer.edit', label: 'Edit customers', description: 'Add, edit, delete customers' },
			{ id: 3012, key: 'customer.export', label: 'Export customers', description: 'Export customer data' },
		],
	},
	{
		module: 'Settings',
		icon: 'Settings',
		permissions: [
			{ id: 3020, key: 'settings.view', label: 'View settings', description: 'View all settings' },
			{ id: 3021, key: 'settings.manage', label: 'Manage settings', description: 'Change integrations, greetings, etc.' },
		],
	},
	{
		module: 'Members',
		icon: 'UserCog',
		permissions: [
			{ id: 3030, key: 'members.view', label: 'View members', description: 'See team member list' },
			{ id: 3031, key: 'members.manage', label: 'Manage members', description: 'Add, edit, remove members and roles' },
		],
	},
	{
		module: 'Dashboard',
		icon: 'BarChart3',
		permissions: [
			{ id: 3040, key: 'dashboard.view', label: 'View dashboard', description: 'Access analytics and KPIs' },
		],
	},
	{
		module: 'AI',
		icon: 'Bot',
		permissions: [
			{ id: 3050, key: 'ai.config', label: 'Configure AI', description: 'Manage chatbot, knowledge base' },
			{ id: 3051, key: 'ai.credit', label: 'Manage AI credit', description: 'View and top up credits' },
		],
	},
]

export const ALL_PERMISSION_IDS = PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => p.id))
