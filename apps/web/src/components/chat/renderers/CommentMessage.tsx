import { MessageCircle } from 'lucide-react'
import type { ChatMessage } from '@one-bear/shared-types'

interface Props {
	message: ChatMessage
}

export function CommentMessage({ message }: Props) {
	const meta = message.metadata ?? {}
	const postContent = typeof meta.postContent === 'string' ? meta.postContent : undefined

	return (
		<div className="flex flex-col gap-1.5">
			<div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-gray-400">
				<MessageCircle className="h-4 w-4" />
				<span>Comment</span>
			</div>
			{postContent && (
				<div className="rounded border-l-2 border-gray-300 pl-2 text-xs text-gray-500 italic line-clamp-2">
					{postContent}
				</div>
			)}
			<p className="whitespace-pre-wrap text-sm">{message.content ?? ''}</p>
		</div>
	)
}
