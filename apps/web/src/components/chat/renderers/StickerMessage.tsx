import type { ChatMessage } from '@one-bear/shared-types'

interface Props {
	message: ChatMessage
}

export function StickerMessage({ message }: Props) {
	const src =
		message.content ??
		(typeof message.metadata?.stickerUrl === 'string' ? message.metadata.stickerUrl : undefined)

	if (!src) {
		return <span className="text-gray-400 italic">Sticker unavailable</span>
	}

	return (
		<img
			src={src}
			alt="Sticker"
			className="max-w-[120px] object-contain"
			loading="lazy"
		/>
	)
}
