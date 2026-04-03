import type { ChatMessage } from '@one-bear/shared-types'

interface Props {
	message: ChatMessage
}

export function LocationMessage({ message }: Props) {
	const meta = message.metadata ?? {}
	const lat = typeof meta.lat === 'number' ? meta.lat : typeof meta.latitude === 'number' ? meta.latitude : null
	const lng = typeof meta.lng === 'number' ? meta.lng : typeof meta.longitude === 'number' ? meta.longitude : null
	const title = typeof meta.title === 'string' ? meta.title : message.content ?? 'Location'
	const address = typeof meta.address === 'string' ? meta.address : undefined

	const mapsUrl =
		lat !== null && lng !== null ? `https://www.google.com/maps?q=${lat},${lng}` : undefined

	return (
		<a
			href={mapsUrl ?? '#'}
			target="_blank"
			rel="noopener noreferrer"
			className="inline-flex items-start gap-2 rounded-lg border border-current/20 px-2 py-1.5 hover:underline"
		>
			<span className="mt-0.5 text-base leading-none">📍</span>
			<span className="flex flex-col">
				<span className="font-medium leading-tight">{title}</span>
				{address && <span className="text-[11px] opacity-70 leading-snug">{address}</span>}
				{lat !== null && lng !== null && (
					<span className="text-[10px] opacity-50 leading-tight">
						{lat.toFixed(6)}, {lng.toFixed(6)}
					</span>
				)}
			</span>
		</a>
	)
}
