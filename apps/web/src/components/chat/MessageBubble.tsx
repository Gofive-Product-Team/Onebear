import { cn } from '@one-bear/ui'
import type { ChatMessage } from '@one-bear/shared-types'
import { formatTime } from '@/lib/date'

interface Props {
	message: ChatMessage
	onRetry?: (messageId: string) => void
}

function DeliveryStatusIcon({ status }: { status: string }) {
	switch (status) {
		case 'Pending':
			return (
				<svg className="h-3.5 w-3.5 text-gray-400" viewBox="0 0 16 16" fill="currentColor">
					<circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
				</svg>
			)
		case 'Sent':
			return (
				<svg className="h-3.5 w-3.5 text-gray-400" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
					<path d="M4 8.5L7 11.5L12 5" />
				</svg>
			)
		case 'Delivered':
		case 'Completed':
			return (
				<svg className="h-3.5 w-3.5 text-blue-500" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
					<path d="M2 8.5L5 11.5L10 5" />
					<path d="M6 8.5L9 11.5L14 5" />
				</svg>
			)
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

function ImageContent({ content }: { content: string }) {
	return (
		<img
			src={content}
			alt="Shared image"
			className="max-w-[240px] rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
			loading="lazy"
		/>
	)
}

function FileContent({ content }: { content: string }) {
	const fileName = content.split('/').pop() ?? 'Download file'
	return (
		<a
			href={content}
			target="_blank"
			rel="noopener noreferrer"
			className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors text-sm"
		>
			<svg className="h-4 w-4 text-gray-500 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
				<path d="M4 2h5l4 4v8a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z" />
				<path d="M9 2v4h4" />
			</svg>
			<span className="truncate max-w-[180px]">{fileName}</span>
		</a>
	)
}

export function MessageBubble({ message, onRetry }: Props) {
	const senderType = message.sender?.type ?? 'system'
	const isAgent = senderType === 'agent' || senderType === 'Agent'
	const isSystem = message.messageType === 'system' || senderType === 'system' || senderType === 'System'
	const isFailed = message.deliveryStatus === 'Failed'

	// System messages
	if (isSystem) {
		return (
			<div className="flex justify-center py-1">
				<span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500">
					{message.content ?? 'System message'}
				</span>
			</div>
		)
	}

	return (
		<div className={cn('flex w-full mb-1', isAgent ? 'justify-end' : 'justify-start')}>
			<div className={cn('max-w-[70%] flex flex-col', isAgent ? 'items-end' : 'items-start')}>
				{/* Sender name for customer messages */}
				{!isAgent && message.sender?.displayName && (
					<span className="text-xs text-gray-400 mb-0.5 px-1">{message.sender.displayName}</span>
				)}

				{/* Message content */}
				<div
					className={cn(
						'rounded-2xl px-3.5 py-2 text-sm break-words',
						isAgent
							? 'bg-blue-600 text-white rounded-br-md'
							: 'bg-white text-gray-900 border border-gray-200 rounded-bl-md',
						isFailed && 'ring-2 ring-red-300 bg-red-50 text-red-800',
					)}
				>
					{message.messageType === 'image' && message.content ? (
						<ImageContent content={message.content} />
					) : message.messageType === 'file' && message.content ? (
						<FileContent content={message.content} />
					) : (
						<p className="whitespace-pre-wrap">{message.content ?? ''}</p>
					)}
				</div>

				{/* Timestamp + delivery status */}
				<div className="flex items-center gap-1 mt-0.5 px-1">
					<span className="text-[10px] text-gray-400">{formatTime(message.sentAt)}</span>
					{isAgent && <DeliveryStatusIcon status={message.deliveryStatus} />}
				</div>

				{/* Retry for failed messages */}
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
