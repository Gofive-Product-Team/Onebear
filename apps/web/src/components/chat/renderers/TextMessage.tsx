import type { ChatMessage } from '@one-bear/shared-types'

const URL_REGEX = /https?:\/\/[^\s<>)"']+/g

function linkify(text: string): React.ReactNode[] {
	const parts: React.ReactNode[] = []
	let lastIndex = 0
	let match: RegExpExecArray | null

	URL_REGEX.lastIndex = 0
	while ((match = URL_REGEX.exec(text)) !== null) {
		if (match.index > lastIndex) {
			parts.push(text.slice(lastIndex, match.index))
		}
		parts.push(
			<a
				key={match.index}
				href={match[0]}
				target="_blank"
				rel="noopener noreferrer"
				className="underline opacity-90 hover:opacity-100"
			>
				{match[0]}
			</a>,
		)
		lastIndex = match.index + match[0].length
	}

	if (lastIndex < text.length) {
		parts.push(text.slice(lastIndex))
	}

	return parts
}

interface Props {
	message: ChatMessage
}

export function TextMessage({ message }: Props) {
	const text = message.content ?? ''
	return <p className="whitespace-pre-wrap break-words">{linkify(text)}</p>
}
