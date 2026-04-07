import { cn } from '@one-bear/ui'
import { MessageCircle } from 'lucide-react'
import type { CustomerDetail } from '@/api/useCustomers'

// ─── Platform colors ──────────────────────────────────────────────────────────

const PLATFORM_COLORS: Record<string, string> = {
	line: 'bg-[#06C755]',
	facebook: 'bg-[#1877F2]',
	instagram: 'bg-pink-500',
	whatsapp: 'bg-emerald-500',
	email: 'bg-gray-400',
	tiktok: 'bg-black',
	lazada: 'bg-orange-500',
	shopee: 'bg-red-500',
}

// ─── Channel card ─────────────────────────────────────────────────────────────

interface ChannelCardProps {
	platform: string
	displayName: string | null
}

function ChannelCard({ platform, displayName }: ChannelCardProps) {
	const color = PLATFORM_COLORS[platform.toLowerCase()] ?? 'bg-gray-400'

	return (
		<div className="flex items-center justify-between rounded-lg border border-border bg-bg-card px-4 py-3">
			<div className="flex items-center gap-3">
				<span className={cn('h-3 w-3 rounded-full shrink-0', color)} aria-hidden="true" />
				<div>
					<p className="text-sm font-medium text-t1 capitalize">{platform}</p>
					{displayName && <p className="text-xs text-t2">{displayName}</p>}
				</div>
			</div>
			<button
				type="button"
				className="rounded-md bg-bg-input px-3 py-1.5 text-xs font-medium text-t2 transition-colors hover:bg-bg-hover"
			>
				Open Chat
			</button>
		</div>
	)
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
	customer: CustomerDetail
}

export function ConversationHistoryTab({ customer }: Props) {
	if (customer.channels.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
				<div className="flex h-14 w-14 items-center justify-center rounded-full bg-bg-input text-t3">
					<MessageCircle className="h-8 w-8" />
				</div>
				<div>
					<p className="text-sm font-medium text-t1">No channels connected</p>
					<p className="mt-1 text-xs text-t2">This customer has no linked social channels yet.</p>
				</div>
			</div>
		)
	}

	return (
		<div className="space-y-4">
			{/* Note: full room query by customer ID will be available once the API supports */}
			{/* GET /companies/{companyId}/rooms?userId={chatUserId} — for now show linked channels */}
			<div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-700">
				Showing linked channels. Full conversation history will appear once the API supports
				querying rooms by customer.
			</div>

			<div className="space-y-2">
				{customer.channels.map((ch, i) => (
					<ChannelCard key={`${ch.platform}-${i}`} platform={ch.platform} displayName={ch.displayName} />
				))}
			</div>
		</div>
	)
}
