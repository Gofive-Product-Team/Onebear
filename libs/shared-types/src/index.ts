export interface ChatRoom {
  id: string
  companyId: string
  platform: string
  state: string
  customer: { name: string; avatar: string } | null
  assignedTo: { id: string; displayName: string } | null
  unreadCount: number
  lastMessage: { content: string; sentAt: string } | null
  createdAt: string
}

export interface ChatMessage {
  id: string
  roomId: string
  content: string | null
  messageType: string
  sender: { id: string; displayName: string; type: string } | null
  deliveryStatus: string
  platform: string
  sentAt: string
}

export interface PagedResponse<T> {
  data: T[]
  continuationToken: string | null
  hasMore: boolean
}

export type SocialPlatform = 'Line' | 'Facebook' | 'Instagram' | 'WhatsApp' | 'Email' | 'TikTok' | 'Lazada' | 'Shopee'
export type ChatState = 'New' | 'InProgress' | 'Closed' | 'Resolved'
