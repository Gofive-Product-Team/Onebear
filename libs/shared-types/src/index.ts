// Matches backend ChatRoomDto
export interface ChatRoom {
	id: string
	platform: string
	state: string
	assignToUserId: string | null
	unreadCount: number
	customerName: string | null
	customerAvatar: string | null
	createdTimestamp: number // Unix ms
	lastMessageTimestamp: number | null // Unix ms
}

// Matches backend ChatMessageDto
export interface ChatMessage {
	id: string
	roomId: string
	content: string | null
	type: string // "Text", "Image", "File", "System", etc. (PascalCase from backend)
	platform: string
	deliveryStatus: string // "Pending", "Sent", "Delivered", "Failed"
	senderName: string | null
	senderType: string | null // "Agent", "Customer", "System", null
	timestamp: number // Unix ms
}

export interface PagedResponse<T> {
	data: T[]
	continuationToken: string | null
	hasMore: boolean
}

export interface BadgeCount {
	total: number
	mine: number
	unassigned: number
	followUp: number
}

export type SocialPlatform = 'Line' | 'Facebook' | 'Instagram' | 'WhatsApp' | 'Email' | 'TikTok' | 'Lazada' | 'Shopee'
export type ChatState = 'New' | 'InProgress' | 'Closed' | 'Resolved'

export { Permission, type PermissionId } from './permissions'
