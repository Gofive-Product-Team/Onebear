import type { ChatMessage } from '@one-bear/shared-types'

interface Props {
	message: ChatMessage
}

export function SystemMessage({ message }: Props) {
	return (
		<span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500">
			{message.content ?? 'System message'}
		</span>
	)
}
