export const Permission = {
	ChatView: 3001,
	ChatResolved: 3002,
	ChatMention: 3003,
	ChatAssignAllCompany: 3004,
	ChatAccessAllData: 3005,
} as const

export type PermissionId = (typeof Permission)[keyof typeof Permission]
