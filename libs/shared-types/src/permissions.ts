export const Permission = {
	// Chat (3001-3005)
	ChatView: 3001,
	ChatResolve: 3002,
	ChatMention: 3003,
	ChatAssign: 3004,
	ChatAccessAll: 3005,

	// Customer (3010-3012)
	CustomerView: 3010,
	CustomerEdit: 3011,
	CustomerExport: 3012,

	// Settings (3020-3021)
	SettingsView: 3020,
	SettingsManage: 3021,

	// Members (3030-3031)
	MembersView: 3030,
	MembersManage: 3031,

	// Dashboard (3040)
	DashboardView: 3040,

	// AI (3050-3051)
	AiConfig: 3050,
	AiCredit: 3051,
} as const

export type PermissionId = (typeof Permission)[keyof typeof Permission]
