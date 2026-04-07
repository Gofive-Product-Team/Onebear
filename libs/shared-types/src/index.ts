// Matches backend SessionTiming value object
export interface SessionTiming {
	frtMs: number
	rtMs: number
	resolvedBy: string
	timestamp: number
}

// Matches backend ChatRoomDto
export interface ChatRoom {
	id: string
	platform: string
	state: string
	assignToUserId: string | null
	unreadCount: number
	customerName: string | null
	customerAvatar: string | null
	lastMessage: string | null
	createdTimestamp: number // Unix ms
	lastMessageTimestamp: number | null // Unix ms
	// Pin fields
	isPinned?: boolean
	pinnedTimestamp?: number | null
	// Handoff fields
	handoffSource?: string | null
	handoffSourceName?: string | null
	handoffTimestamp?: number | null
	isAiMuted?: boolean
	attendedUserIds?: string[]
	// FRT/RT timer fields
	frtStartTimestamp?: number | null
	frtEndTimestamp?: number | null
	frtDurationMs?: number | null
	isFrtStopped?: boolean
	isResolved?: boolean
	rtEndTimestamp?: number | null
	rtDurationMs?: number | null
	sessionTimings?: SessionTiming[]
	// Spam fields
	isSpam?: boolean
	spamScore?: number | null
}

export type MessageType =
	| 'Text'
	| 'Image'
	| 'Video'
	| 'Audio'
	| 'File'
	| 'Sticker'
	| 'Location'
	| 'System'
	| 'TemplateMessage'
	| 'Carousel'
	| 'ReactionAdded'
	| 'ReactionRemoved'
	| 'Note'
	| 'Email'
	| 'Story'
	| 'Order'
	| 'Product'
	| 'Flex'
	| 'Comment'

export interface Attachment {
	id: string
	fileName: string
	fileSize: number
	mimeType: string
	url: string
	thumbnailUrl?: string
}

// Matches backend ChatMessageDto
export interface ChatMessage {
	id: string
	roomId: string
	content: string | null
	type: MessageType | string // "Text", "Image", "File", "System", etc. (PascalCase from backend)
	platform: string
	deliveryStatus: string // "Pending", "Sent", "Delivered", "Failed"
	senderName: string | null
	senderType: string | null // "Agent", "Customer", "System", null
	timestamp: number // Unix ms
	metadata?: Record<string, unknown>
	attachments?: Attachment[]
	replyTo?: string
	// Pin fields
	isPinnedByUser?: boolean
	pinnedTimestamp?: number | null
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
