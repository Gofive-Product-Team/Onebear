import type { ChatMessage } from '@one-bear/shared-types'

interface Props {
	message: ChatMessage
}

export function StoryMessage({ message }: Props) {
	const meta = message.metadata ?? {}
	const storyUrl = typeof meta.storyUrl === 'string' ? meta.storyUrl : undefined

	return (
		<div className="flex flex-col gap-1.5">
			<div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-gray-400">
				<span>📖</span>
				<span>Replied to your story</span>
			</div>
			{storyUrl && (
				<img
					src={storyUrl}
					alt="Story"
					className="max-w-[120px] rounded-lg object-cover opacity-80"
					loading="lazy"
				/>
			)}
			{message.content && <p className="whitespace-pre-wrap text-sm">{message.content}</p>}
		</div>
	)
}
