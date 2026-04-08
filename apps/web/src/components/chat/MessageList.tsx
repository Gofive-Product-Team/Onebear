import { useEffect, useRef, useCallback, useMemo } from 'react'
import { cn } from '@one-bear/ui'
import type { ChatMessage } from '@one-bear/shared-types'
import { useMessages } from '@/api/useMessages'
import { useMembers } from '@/api/useMembers'
import { useAuthStore } from '@/stores/auth-store'
import { MessageBubble } from './MessageBubble'
import { PinBar } from './PinBar'
import { usePinnedMessages, usePinMessage, useUnpinMessage } from '@/api/usePinnedMessages'
import { formatDateSeparator } from '@/lib/date'
import { Tooltip } from '@/components/ui/Tooltip'

interface TypingUser {
	userId: string
	displayName: string
}

interface Props {
	companyId: string
	roomId: string
	typingUsers: TypingUser[]
	viewingUserIds: string[]
}

function groupMessagesByDate(messages: ChatMessage[]): Map<string, ChatMessage[]> {
	const groups = new Map<string, ChatMessage[]>()
	for (const msg of messages) {
		const dateKey = new Date(msg.timestamp).toDateString()
		const existing = groups.get(dateKey)
		if (existing) {
			existing.push(msg)
		} else {
			groups.set(dateKey, [msg])
		}
	}
	return groups
}

function MessageSkeleton() {
	return (
		<div className="flex flex-col gap-3 p-4 animate-pulse">
			{Array.from({ length: 6 }).map((_, i) => (
				<div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
					<div
						className={`rounded-2xl ${i % 2 === 0 ? 'bg-bg-input' : 'bg-primary-alpha'}`}
						style={{ width: `${120 + Math.random() * 140}px`, height: '36px' }}
					/>
				</div>
			))}
		</div>
	)
}

function TypingIndicator({ users }: { users: TypingUser[] }) {
	if (users.length === 0) return null

	const text =
		users.length === 1
			? `${users[0]!.displayName} is typing`
			: `${users.map((u) => u.displayName).join(', ')} are typing`

	return (
		<div className="flex items-center gap-2 px-4 py-2">
			<div className="flex gap-1">
				<span className="h-[5px] w-[5px] rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
				<span className="h-[5px] w-[5px] rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
				<span className="h-[5px] w-[5px] rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
			</div>
			<span className="text-xs text-t3">{text}</span>
		</div>
	)
}

// ─── Viewing Avatars ────────────────────────────────────────────
const AVATAR_COLORS = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500', 'bg-red-500', 'bg-indigo-500']

function getAvatarColor(id: string): string {
	let hash = 0
	for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
	return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length] ?? 'bg-blue-500'
}

function ViewingAvatars({ userIds }: { userIds: string[] }) {
	const { data: members } = useMembers()

	if (userIds.length === 0) return null

	function resolveName(userId: string): string {
		const member = members?.find((m) => m.keycloakUserId === userId)
		return member?.displayName ?? member?.email ?? userId
	}

	function getInitials(userId: string): string {
		const name = resolveName(userId)
		const parts = name.trim().split(/\s+/)
		if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
		return name.slice(0, 2).toUpperCase()
	}

	return (
		<div className="flex items-center justify-end gap-1 px-4 py-1.5">
			<span className="text-[10px] text-t3 mr-1">Viewing</span>
			{userIds.map((id, idx) => (
				<Tooltip key={id} content={resolveName(id)} side="top">
					<span
						className={cn(
							'inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold text-white ring-2 ring-bg-page',
							getAvatarColor(id),
						)}
						style={{ marginLeft: idx === 0 ? 0 : '-4px' }}
					>
						{getInitials(id)}
					</span>
				</Tooltip>
			))}
		</div>
	)
}

export function MessageList({ companyId, roomId, typingUsers, viewingUserIds }: Props) {
	const currentUserId = useAuthStore((s) => s.user?.userId ?? '')
	const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useMessages(companyId, roomId)
	const scrollContainerRef = useRef<HTMLDivElement>(null)
	const bottomRef = useRef<HTMLDivElement>(null)
	const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map())
	const prevMessageCountRef = useRef(0)

	const { data: pinnedMessages = [] } = usePinnedMessages(companyId, roomId)
	const pinMessage = usePinMessage(companyId, roomId)
	const unpinMessage = useUnpinMessage(companyId, roomId)

	const handlePin = useCallback((messageId: string) => {
		pinMessage.mutate(messageId)
	}, [pinMessage])

	const handleUnpin = useCallback((messageId: string) => {
		unpinMessage.mutate(messageId)
	}, [unpinMessage])

	const handleScrollToMessage = useCallback((messageId: string) => {
		const el = messageRefs.current.get(messageId)
		if (el) {
			el.scrollIntoView({ behavior: 'smooth', block: 'center' })
			// Brief highlight flash
			el.classList.add('ring-2', 'ring-amber-400', 'rounded-2xl', 'transition-all')
			setTimeout(() => {
				el.classList.remove('ring-2', 'ring-amber-400', 'rounded-2xl', 'transition-all')
			}, 1500)
		}
	}, [])

	// Flatten all pages into a single ordered list
	const allMessages = useMemo(() => {
		if (!data?.pages) return []
		const msgs = data.pages.flatMap((page) => page.data)
		// Older pages come first (continuation token loads older messages).
		// Reverse so the oldest page's messages are at the top.
		return msgs.reverse()
	}, [data])

	// Auto-scroll to bottom when new messages arrive
	useEffect(() => {
		const newCount = allMessages.length
		if (newCount > prevMessageCountRef.current) {
			bottomRef.current?.scrollIntoView({ behavior: prevMessageCountRef.current === 0 ? 'instant' : 'smooth' })
		}
		prevMessageCountRef.current = newCount
	}, [allMessages.length])

	// Load more when scrolling to top
	const handleScroll = useCallback(() => {
		const container = scrollContainerRef.current
		if (!container || isFetchingNextPage || !hasNextPage) return

		if (container.scrollTop < 100) {
			fetchNextPage()
		}
	}, [isFetchingNextPage, hasNextPage, fetchNextPage])

	// Build a set of pinned message ids for quick lookup
	const pinnedIds = useMemo(() => new Set(pinnedMessages.map((m) => m.id)), [pinnedMessages])

	// Merge pin state into messages so MessageBubble knows what's pinned
	const allMessagesWithPinState = useMemo(
		() => allMessages.map((m) => ({ ...m, isPinnedByUser: pinnedIds.has(m.id) })),
		[allMessages, pinnedIds],
	)

	const dateGroups = useMemo(() => groupMessagesByDate(allMessagesWithPinState), [allMessagesWithPinState])

	return (
		<div className="flex flex-col flex-1 min-h-0">
			{/* Pinned messages bar */}
			<PinBar pinnedMessages={pinnedMessages} onScrollToMessage={handleScrollToMessage} />

			<div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto bg-bg-card">
				{/* Loading older messages indicator */}
				{isFetchingNextPage && (
					<div className="flex justify-center py-3">
						<span className="text-xs text-t3">Loading older messages...</span>
					</div>
				)}

				{isLoading ? (
					<MessageSkeleton />
				) : allMessagesWithPinState.length === 0 ? (
					<div className="flex items-center justify-center h-full">
						<p className="text-sm text-t3">No messages yet. Start the conversation!</p>
					</div>
				) : (
					<div className="flex flex-col gap-1 px-4 py-3">
						{Array.from(dateGroups.entries()).map(([dateKey, messages]) => (
							<div key={dateKey}>
								{/* Date separator */}
								<div className="flex items-center justify-center py-3 gap-2.5">
									<span className="flex-1 h-px bg-border" />
									<span className="text-[0.6875rem] text-t3">
										{formatDateSeparator(new Date(messages[0]!.timestamp).toISOString())}
									</span>
									<span className="flex-1 h-px bg-border" />
								</div>

								{/* Messages for this date */}
								{messages.map((message) => (
									<div
										key={message.id}
										ref={(el) => {
											if (el) messageRefs.current.set(message.id, el)
											else messageRefs.current.delete(message.id)
										}}
									>
										<MessageBubble
											message={message}
											currentUserId={currentUserId}
											onPin={handlePin}
											onUnpin={handleUnpin}
										/>
									</div>
								))}
							</div>
						))}
					</div>
				)}

				{/* Typing indicator */}
				<TypingIndicator users={typingUsers} />

				{/* Viewing avatars — removed, shown on room card + sidebar instead */}

				{/* Scroll anchor */}
				<div ref={bottomRef} />
			</div>
		</div>
	)
}
