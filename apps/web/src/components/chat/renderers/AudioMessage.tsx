import type { ChatMessage } from '@one-bear/shared-types'

interface Props {
	message: ChatMessage
}

function formatDuration(seconds: unknown): string {
	if (typeof seconds !== 'number' || isNaN(seconds)) return ''
	const m = Math.floor(seconds / 60)
	const s = Math.floor(seconds % 60)
	return `${m}:${s.toString().padStart(2, '0')}`
}

export function AudioMessage({ message }: Props) {
	const src = message.content ?? message.attachments?.[0]?.url
	const duration = formatDuration(message.metadata?.duration)

	if (!src) {
		return <span className="text-gray-400 italic">Audio unavailable</span>
	}

	return (
		<div className="flex flex-col gap-1">
			<audio controls src={src} className="max-w-[280px]">
				Your browser does not support audio playback.
			</audio>
			{duration && <span className="text-[10px] text-gray-400">{duration}</span>}
		</div>
	)
}
