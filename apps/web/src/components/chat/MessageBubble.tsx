import { cn } from '@one-bear/ui'
import type { ChatMessage } from '@one-bear/shared-types'

interface Props {
	message: ChatMessage
	currentUserId: string
	onRetry?: (messageId: string) => void
}

function DeliveryStatusIcon({ status }: { status: string }) {
	switch (status) {
		case 'Sent':
			return (
				<svg className="h-3.5 w-3.5 text-gray-400" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
					<path d="M4 8.5L7 11.5L12 5" />
				</svg>
			)
		case 'Delivered':
		case 'Completed':
		case 'Read':
			return (
				<svg className="h-3.5 w-3.5 text-blue-500" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
					<path d="M2 8.5L5 11.5L10 5" />
					<path d="M6 8.5L9 11.5L14 5" />
				</svg>
			)
		case 'Failed':
			return (
				<svg className="h-3.5 w-3.5 text-red-500" viewBox="0 0 16 16" fill="currentColor">
					<circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
					<text x="8" y="12" fontSize="10" textAnchor="middle" fill="currentColor">!</text>
				</svg>
			)
		default:
			return null
	}
}

function formatTime(unixMs: number): string {
	const d = new Date(unixMs)
	return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function MessageBubble({ message, currentUserId, onRetry }: Props) {
	const msgType = message.type.toLowerCase()
	const senderType = message.senderType?.toLowerCase() ?? ''

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
				<span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500">
					{message.content ?? 'System message'}
				</span>
			</div>
		)
	}

	// If senderType is null/empty but it's not a system message, try to infer
	// Messages without senderType: assume customer if type is not system
	const isFromAgent = isAgent || (!isSystem && senderType === '' && message.deliveryStatus === 'Sent')

	return (
		<div className={cn('flex w-full mb-1', isFromAgent ? 'justify-end' : 'justify-start')}>
			<div className={cn('max-w-[70%] flex flex-col', isFromAgent ? 'items-end' : 'items-start')}>
				{/* Sender name for customer messages */}
				{!isFromAgent && message.senderName && (
					<span className="text-xs text-gray-400 mb-0.5 px-1">{message.senderName}</span>
				)}

				{/* Message content */}
				<div
					className={cn(
						'rounded-2xl px-3.5 py-2 text-sm break-words',
						isFromAgent
							? 'bg-blue-600 text-white rounded-br-md'
							: 'bg-white text-gray-900 border border-gray-200 rounded-bl-md',
						isFailed && 'ring-2 ring-red-300 bg-red-50 text-red-800',
					)}
				>
					{msgType === 'image' ? (
						message.content ? (
							<img
								src={message.content}
								alt="Shared image"
								className="max-w-[240px] rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
								loading="lazy"
							/>
						) : (
							<span className="text-gray-400 italic">📷 Image</span>
						)
					) : msgType === 'file' ? (
						<a
							href={message.content ?? '#'}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-2 text-sm underline"
						>
							📎 {message.content?.split('/').pop() ?? 'File'}
						</a>
					) : (
						<p className="whitespace-pre-wrap">{message.content ?? ''}</p>
					)}
				</div>

				{/* Timestamp + delivery status */}
				<div className="flex items-center gap-1 mt-0.5 px-1">
					<span className="text-[10px] text-gray-400">{formatTime(message.timestamp)}</span>
					{isFromAgent && <DeliveryStatusIcon status={message.deliveryStatus} />}
				</div>

				{/* Retry for failed */}
				{isFailed && onRetry && (
					<button
						type="button"
						onClick={() => onRetry(message.id)}
						className="text-xs text-red-600 hover:text-red-700 mt-0.5 px-1 font-medium"
					>
						Retry
					</button>
				)}
			</div>
		</div>
	)
}
