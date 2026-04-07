import { useState } from 'react'
import { Lightbulb } from 'lucide-react'
import type { CustomerDetail } from '@/api/useCustomers'

interface Props {
	customer: CustomerDetail
	onDraftMessage: () => void
}

export function NextBestActionCard({ customer, onDraftMessage }: Props) {
	const [dismissed, setDismissed] = useState(() => {
		return sessionStorage.getItem(`nba-dismissed-${customer.id}`) === '1'
	})

	if (dismissed || !customer.suggestedAction) return null

	return (
		<div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
			<div className="flex items-start gap-3">
				<Lightbulb className="h-5 w-5 text-blue-500 shrink-0" aria-hidden="true" />
				<div className="flex-1">
					<p className="text-sm font-semibold text-t1">Next Best Action</p>
					<p className="mt-0.5 text-sm text-t2">{customer.suggestedAction}</p>
				</div>
			</div>
			<div className="mt-3 flex gap-2">
				<button
					type="button"
					onClick={onDraftMessage}
					className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
				>
					Draft Message
				</button>
				<button
					type="button"
					onClick={() => {
						setDismissed(true)
						sessionStorage.setItem(`nba-dismissed-${customer.id}`, '1')
					}}
					className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-t2 hover:bg-bg-hover"
				>
					Dismiss
				</button>
			</div>
		</div>
	)
}
