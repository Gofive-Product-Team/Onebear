import type { ChatMessage } from '@one-bear/shared-types'

interface Props {
	message: ChatMessage
}

export function ReactionMessage({ message }: Props) {
	const meta = message.metadata ?? {}
	const emoji = typeof meta.emoji === 'string' ? meta.emoji : '👍'
	const isRemoved = message.type === 'ReactionRemoved' || message.type === 'reactionRemoved'

	return (
		<span className="text-xs text-gray-400 italic">
			{isRemoved ? `Removed reaction ${emoji}` : `Reacted with ${emoji}`}
		</span>
	)
}
