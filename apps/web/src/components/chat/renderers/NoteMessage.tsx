import type { ChatMessage } from '@one-bear/shared-types'

interface Props {
	message: ChatMessage
}

export function NoteMessage({ message }: Props) {
	return (
		<div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
			<div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-amber-600">
				<span>🔒</span>
				<span>Internal note</span>
			</div>
			<p className="whitespace-pre-wrap text-sm">{message.content ?? ''}</p>
		</div>
	)
}
