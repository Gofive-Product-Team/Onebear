import type { ChatMessage } from '@one-bear/shared-types'

interface Props {
	message: ChatMessage
}

export function UnknownMessage({ message }: Props) {
	return (
		<div className="text-xs text-gray-400 italic">
			<span>Unsupported message type: {message.type}</span>
			{message.content && (
				<pre className="mt-1 max-w-xs overflow-auto rounded bg-gray-50 p-1 text-[10px] text-gray-400">{message.content}</pre>
			)}
		</div>
	)
}
