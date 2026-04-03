import { cn } from '@one-bear/ui'
import type { ChatMessage } from '@one-bear/shared-types'

interface OrderItem {
	name: string
	quantity: number
	price: number
}

interface Props {
	message: ChatMessage
}

function parseOrderItems(raw: unknown): OrderItem[] {
	if (!Array.isArray(raw)) return []
	return raw.flatMap((item) => {
		if (
			item !== null &&
			typeof item === 'object' &&
			'name' in item &&
			'quantity' in item &&
			'price' in item &&
			typeof (item as Record<string, unknown>).name === 'string' &&
			typeof (item as Record<string, unknown>).quantity === 'number' &&
			typeof (item as Record<string, unknown>).price === 'number'
		) {
			return [item as OrderItem]
		}
		return []
	})
}

const statusColorMap: Record<string, string> = {
	Pending: 'bg-yellow-100 text-yellow-800',
	Shipped: 'bg-blue-100 text-blue-800',
	Delivered: 'bg-green-100 text-green-800',
	Cancelled: 'bg-red-100 text-red-800',
}

export function OrderMessage({ message }: Props) {
	const meta = message.metadata ?? {}
	const orderId = typeof meta.orderId === 'string' ? meta.orderId : undefined
	const items = parseOrderItems(meta.items)
	const total = typeof meta.total === 'number' ? meta.total : undefined
	const status = typeof meta.status === 'string' ? meta.status : undefined
	const currency = typeof meta.currency === 'string' ? meta.currency : 'THB'

	const statusColor = status ? (statusColorMap[status] ?? 'bg-gray-100 text-gray-800') : undefined

	return (
		<div className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-3 text-sm">
			<div className="flex items-center justify-between gap-2">
				<div className="flex items-center gap-1.5">
					<span>🛒</span>
					<span className="font-semibold">Order</span>
					{orderId && <span className="text-xs text-gray-400">#{orderId}</span>}
				</div>
				{status && statusColor && (
					<span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', statusColor)}>{status}</span>
				)}
			</div>
			{items.length > 0 && (
				<ul className="flex flex-col gap-0.5 border-t border-gray-100 pt-2">
					{items.map((item, i) => (
						<li key={i} className="flex items-center justify-between gap-2 text-xs">
							<span>
								{item.name} × {item.quantity}
							</span>
							<span className="text-gray-500">
								{currency} {(item.price * item.quantity).toLocaleString()}
							</span>
						</li>
					))}
				</ul>
			)}
			{total !== undefined && (
				<div className="flex items-center justify-between border-t border-gray-100 pt-1 text-xs font-semibold">
					<span>Total</span>
					<span>
						{currency} {total.toLocaleString()}
					</span>
				</div>
			)}
			{items.length === 0 && !orderId && (
				<p className="text-gray-400 italic">{message.content ?? 'Order details unavailable'}</p>
			)}
		</div>
	)
}
