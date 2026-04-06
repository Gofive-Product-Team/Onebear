import { useEffect, useRef, useCallback, useMemo } from 'react'
import type { ChatMessage } from '@one-bear/shared-types'
import { useMessages } from '@/api/useMessages'
import { useAuthStore } from '@/stores/auth-store'
import { MessageBubble } from './MessageBubble'
import { formatDateSeparator } from '@/lib/date'

interface TypingUser {
	userId: string
	displayName: string
}

interface Props {
	companyId: string
	roomId: string
	typingUsers: TypingUser[]
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

export function MessageList({ companyId, roomId, typingUsers }: Props) {
	const currentUserId = useAuthStore((s) => s.user?.userId ?? '')
	const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useMessages(companyId, roomId)
	const scrollContainerRef = useRef<HTMLDivElement>(null)
	const bottomRef = useRef<HTMLDivElement>(null)
	const prevMessageCountRef = useRef(0)

	// Flatten all pages into a single ordered list
	const allMessages = useMemo(() => {
		if (!data?.pages) return []
		const msgs = data.pages.flatMap((page) => page.data)
		// Older pages come first (continuation token loads older messages).
		// Reverse so the oldest page's messages are at the top.
		return msgs.reverse()
	}, [data])

	const dateGroups = useMemo(() => groupMessagesByDate(allMessages), [allMessages])

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

	return (
		<div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto bg-bg-card">
			{/* Loading older messages indicator */}
			{isFetchingNextPage && (
				<div className="flex justify-center py-3">
					<span className="text-xs text-t3">Loading older messages...</span>
				</div>
			)}

			{isLoading ? (
				<MessageSkeleton />
			) : allMessages.length === 0 ? (
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
								<MessageBubble key={message.id} message={message} currentUserId={currentUserId} />
							))}
						</div>
					))}
				</div>
			)}

			{/* Typing indicator */}
			<TypingIndicator users={typingUsers} />

			{/* Scroll anchor */}
			<div ref={bottomRef} />
		</div>
	)
}
