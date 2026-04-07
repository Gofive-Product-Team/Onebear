import type { ChatMessage } from '@one-bear/shared-types'

interface TemplateAction {
	label: string
	type?: string
}

interface Props {
	message: ChatMessage
}

function parseActions(raw: unknown): TemplateAction[] {
	if (!Array.isArray(raw)) return []
	return raw.flatMap((item) => {
		if (item !== null && typeof item === 'object' && 'label' in item && typeof (item as Record<string, unknown>).label === 'string') {
			return [{ label: (item as Record<string, unknown>).label as string, type: (item as Record<string, unknown>).type as string | undefined }]
		}
		return []
	})
}

export function TemplateMessage({ message }: Props) {
	const meta = message.metadata ?? {}
	const imageUrl = typeof meta.imageUrl === 'string' ? meta.imageUrl : undefined
	const title = typeof meta.title === 'string' ? meta.title : message.content ?? undefined
	const subtitle = typeof meta.subtitle === 'string' ? meta.subtitle : undefined
	const actions = parseActions(meta.actions)

	return (
		<div className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white text-sm">
			{imageUrl && (
				<img
					src={imageUrl}
					alt={title ?? 'Template'}
					className="h-36 w-full object-cover"
					loading="lazy"
				/>
			)}
			<div className="flex flex-col gap-1 p-3">
				{title && <span className="font-semibold leading-snug">{title}</span>}
				{subtitle && <span className="text-xs text-gray-500">{subtitle}</span>}
			</div>
			{actions.length > 0 && (
				<div className="flex flex-col border-t border-gray-100">
					{actions.map((action, i) => (
						<span
							key={i}
							className="border-b border-gray-100 px-3 py-2 text-center text-xs text-blue-500 last:border-b-0"
						>
							{action.label}
						</span>
					))}
				</div>
			)}
		</div>
	)
}
