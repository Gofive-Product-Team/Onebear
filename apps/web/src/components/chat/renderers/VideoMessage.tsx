import type { ChatMessage } from '@one-bear/shared-types'

interface Props {
	message: ChatMessage
}

export function VideoMessage({ message }: Props) {
	const src = message.content ?? message.attachments?.[0]?.url
	const posterUrl =
		typeof message.metadata?.thumbnailUrl === 'string' ? message.metadata.thumbnailUrl : undefined

	if (!src) {
		return <span className="text-gray-400 italic">Video unavailable</span>
	}

	return (
		<video
			src={src}
			controls
			preload="metadata"
			poster={posterUrl}
			className="max-w-[320px] rounded-lg"
		>
			Your browser does not support video playback.
		</video>
	)
}
