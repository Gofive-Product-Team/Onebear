import type { ChatMessage } from '@one-bear/shared-types'

interface Props {
	message: ChatMessage
}

export function ProductMessage({ message }: Props) {
	const meta = message.metadata ?? {}
	const imageUrl = typeof meta.imageUrl === 'string' ? meta.imageUrl : undefined
	const name = typeof meta.name === 'string' ? meta.name : message.content ?? 'Product'
	const price = typeof meta.price === 'number' ? meta.price : undefined
	const currency = typeof meta.currency === 'string' ? meta.currency : 'THB'
	const productUrl = typeof meta.productUrl === 'string' ? meta.productUrl : undefined

	return (
		<div className="flex gap-3 rounded-lg border border-gray-200 bg-white p-3 text-sm">
			{imageUrl && (
				<img
					src={imageUrl}
					alt={name}
					className="h-16 w-16 flex-shrink-0 rounded-md object-cover"
					loading="lazy"
				/>
			)}
			<div className="flex flex-col justify-between gap-1">
				<span className="font-semibold leading-snug line-clamp-2">{name}</span>
				{price !== undefined && (
					<span className="text-sm font-medium text-blue-600">
						{currency} {price.toLocaleString()}
					</span>
				)}
				{productUrl && (
					<a
						href={productUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="text-xs text-blue-500 hover:underline"
					>
						View product →
					</a>
				)}
			</div>
		</div>
	)
}
