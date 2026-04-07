import { useState } from 'react'
import { cn } from '@one-bear/ui'
import type { ChatMessage } from '@one-bear/shared-types'
import { Tooltip } from '@/components/ui/Tooltip'
import { MessageRenderer } from './renderers/MessageRenderer'
import { formatSmartTimestamp, formatFullThaiDatetime } from '@/lib/date'

interface Props {
	message: ChatMessage
	currentUserId: string
	onRetry?: (messageId: string) => void
	onPin?: (messageId: string) => void
	onUnpin?: (messageId: string) => void
}

function DeliveryStatusIcon({ status }: { status: string }) {
	switch (status) {
		case 'Sent':
			return (
				<svg className="h-3.5 w-3.5 text-t3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
					<path d="M4 8.5L7 11.5L12 5" />
				</svg>
			)
		case 'Delivered':
		case 'Completed':
		case 'Read':
			return (
				<svg className="h-3.5 w-3.5 text-primary" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
					<path d="M2 8.5L5 11.5L10 5" />
					<path d="M6 8.5L9 11.5L14 5" />
				</svg>
			)
		case 'Failed':
			return (
				<svg className="h-3.5 w-3.5 text-error" viewBox="0 0 16 16" fill="currentColor">
					<circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
					<text x="8" y="12" fontSize="10" textAnchor="middle" fill="currentColor">!</text>
				</svg>
			)
		default:
			return null
	}
}


function RobotAvatar() {
	return (
		<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-100">
			<svg className="h-4 w-4 text-purple-600" viewBox="0 0 24 24" fill="currentColor">
				<path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 110 2h-1.07A7.001 7.001 0 0113 22h-2a7.001 7.001 0 01-6.93-6H3a1 1 0 110-2h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2zm-1 9a5 5 0 00-5 5 5 5 0 005 5h2a5 5 0 005-5 5 5 0 00-5-5h-2zm-1 3a1 1 0 110 2 1 1 0 010-2zm4 0a1 1 0 110 2 1 1 0 010-2z" />
			</svg>
		</div>
	)
}

export function MessageBubble({ message, currentUserId, onRetry, onPin, onUnpin }: Props) {
	const [hovered, setHovered] = useState(false)
	const msgType = message.type.toLowerCase()
	const senderType = message.senderType?.toLowerCase() ?? ''
	const isAiMessage = message.isAiMessage === true

	// Determine if this message is from the current agent user
	// Backend sets senderType to "Agent" or "Customer" or null
	// Also check if senderName matches or if userId matches from context
	const isAgent = senderType === 'agent'
	const isSystem = msgType === 'system' || senderType === 'system' || senderType === ''
	const isFailed = message.deliveryStatus === 'Failed'

	// System messages — centered gray pill
	if (isSystem && msgType === 'system') {
		return (
			<div className="flex justify-center py-1">
				<MessageRenderer message={message} />
			</div>
		)
	}

	// If senderType is null/empty but it's not a system message, try to infer
	// Messages without senderType: assume customer if type is not system
	const isFromAgent = isAgent || (!isSystem && senderType === '' && message.deliveryStatus === 'Sent')

	const isPinned = message.isPinnedByUser

	return (
		<div
			className={cn('flex w-full mb-1 group', isFromAgent ? 'justify-end' : 'justify-start')}
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
		>
			<div className={cn('max-w-[70%] flex flex-col', isFromAgent ? 'items-end' : 'items-start')}>
				{/* Sender name for customer messages or AI messages */}
				{!isFromAgent && (message.senderName || isAiMessage) && (
					<div className="flex items-center gap-1.5 mb-0.5 px-1">
						{message.senderName && <span className="text-xs text-t3">{message.senderName}</span>}
						{isAiMessage && (
							<span className="inline-flex items-center rounded-full bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold text-purple-700">
								AI
							</span>
						)}
					</div>
				)}
				{isFromAgent && isAiMessage && (
					<div className="flex items-center gap-1.5 mb-0.5 px-1">
						<span className="inline-flex items-center rounded-full bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold text-purple-700">
							AI
						</span>
					</div>
				)}

				{/* Message content row with pin button */}
				<div className={cn('flex items-end gap-1.5', isFromAgent ? 'flex-row-reverse' : 'flex-row')}>
					{/* AI robot avatar */}
					{isAiMessage && !isFromAgent && <RobotAvatar />}
					<div
						className={cn(
							'rounded-2xl px-3.5 py-2 text-sm break-words',
							isFromAgent
								? 'bg-primary text-white rounded-[16px_16px_4px_16px]'
								: 'bg-bg-input text-t1 rounded-[16px_16px_16px_4px]',
							isFailed && 'ring-2 ring-error/30 bg-error-bg text-error',
						)}
					>
						<MessageRenderer message={message} />
					</div>

					{/* Pin/unpin button — visible on hover or when pinned */}
					{(onPin || onUnpin) && (hovered || isPinned) && (
						<Tooltip content={isPinned ? 'Unpin message' : 'Pin message'} side="top">
							<button
								type="button"
								onClick={() => isPinned ? onUnpin?.(message.id) : onPin?.(message.id)}
								className={cn(
									'shrink-0 flex items-center justify-center h-6 w-6 rounded-full transition-colors',
									isPinned
										? 'text-amber-500 bg-amber-100 hover:bg-amber-200'
										: 'text-t3 bg-bg-hover hover:text-amber-500 hover:bg-amber-100',
								)}
								aria-label={isPinned ? 'Unpin message' : 'Pin message'}
							>
								<span className="text-[11px] leading-none" aria-hidden>📌</span>
							</button>
						</Tooltip>
					)}
				</div>

				{/* Timestamp + delivery status */}
				<div className="flex items-center gap-1 mt-0.5 px-1">
					<Tooltip content={formatFullThaiDatetime(message.timestamp)} side={isFromAgent ? 'left' : 'right'}>
						<span className="text-[10px] text-t3 cursor-default">{formatSmartTimestamp(message.timestamp)}</span>
					</Tooltip>
					{isFromAgent && <DeliveryStatusIcon status={message.deliveryStatus} />}
				</div>

				{/* Retry for failed */}
				{isFailed && onRetry && (
					<button
						type="button"
						onClick={() => onRetry(message.id)}
						className="text-xs text-error hover:text-error/80 mt-0.5 px-1 font-medium"
					>
						Retry
					</button>
				)}
			</div>
		</div>
	)
}
