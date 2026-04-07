import type { ChatMessage } from '@one-bear/shared-types'

interface CarouselCard {
	imageUrl?: string
	title?: string
	subtitle?: string
	actions?: Array<{ label: string }>
}

interface Props {
	message: ChatMessage
}

function parseCards(raw: unknown): CarouselCard[] {
	if (!Array.isArray(raw)) return []
	return raw.flatMap((item) => {
		if (item !== null && typeof item === 'object') {
			const card = item as Record<string, unknown>
			return [
				{
					imageUrl: typeof card.imageUrl === 'string' ? card.imageUrl : undefined,
					title: typeof card.title === 'string' ? card.title : undefined,
					subtitle: typeof card.subtitle === 'string' ? card.subtitle : undefined,
					actions: Array.isArray(card.actions)
						? card.actions.flatMap((a) =>
								a !== null && typeof a === 'object' && 'label' in a && typeof (a as Record<string, unknown>).label === 'string'
									? [{ label: (a as Record<string, unknown>).label as string }]
									: [],
							)
						: [],
				},
			]
		}
		return []
	})
}

export function CarouselMessage({ message }: Props) {
	const meta = message.metadata ?? {}
	const cards = parseCards(meta.cards)

	if (cards.length === 0) {
		return <span className="text-gray-400 italic">{message.content ?? 'Carousel unavailable'}</span>
	}

	return (
		<div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-1">
			{cards.map((card, i) => (
				<div
					key={i}
					className="flex-shrink-0 snap-start flex w-52 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white text-sm"
				>
					{card.imageUrl && (
						<img
							src={card.imageUrl}
							alt={card.title ?? `Card ${i + 1}`}
							className="h-28 w-full object-cover"
							loading="lazy"
						/>
					)}
					<div className="flex flex-col gap-0.5 p-2">
						{card.title && <span className="font-semibold text-xs leading-snug">{card.title}</span>}
						{card.subtitle && <span className="text-[11px] text-gray-500 leading-snug">{card.subtitle}</span>}
					</div>
					{card.actions && card.actions.length > 0 && (
						<div className="mt-auto flex flex-col border-t border-gray-100">
							{card.actions.map((action, j) => (
								<span
									key={j}
									className="border-b border-gray-100 px-2 py-1.5 text-center text-[11px] text-blue-500 last:border-b-0"
								>
									{action.label}
								</span>
							))}
						</div>
					)}
				</div>
			))}
		</div>
	)
}
