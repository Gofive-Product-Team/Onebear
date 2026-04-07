import { useState } from 'react'
import { cn } from '@one-bear/ui'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { useBulkFollowup } from '@/api/useCustomers'

// ─── Channel options ───────────────────────────────────────────────────────────

const CHANNELS = [
	{ value: 'line', label: 'LINE' },
	{ value: 'facebook', label: 'Facebook' },
	{ value: 'whatsapp', label: 'WhatsApp' },
	{ value: 'email', label: 'Email' },
	{ value: 'instagram', label: 'Instagram' },
]

const DEFAULT_TEMPLATE =
	'สวัสดีค่ะ เราไม่ได้ติดต่อกันมาสักพักแล้ว มีโปรโมชั่นพิเศษสำหรับคุณค่ะ สนใจไหมคะ?'

// ─── Props ─────────────────────────────────────────────────────────────────────

interface Props {
	open: boolean
	onOpenChange: (open: boolean) => void
	customerIds: string[]
	onSuccess?: () => void
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function BulkFollowupSheet({ open, onOpenChange, customerIds, onSuccess }: Props) {
	const [channel, setChannel] = useState('line')
	const [message, setMessage] = useState(DEFAULT_TEMPLATE)
	const [didSucceed, setDidSucceed] = useState(false)

	const bulkFollowup = useBulkFollowup()

	function handleClose() {
		onOpenChange(false)
		setDidSucceed(false)
	}

	async function handleSend() {
		try {
			await bulkFollowup.mutateAsync({ customerIds, channel, message: message.trim() })
			setDidSucceed(true)
			onSuccess?.()
			// Auto-close after brief success state
			setTimeout(handleClose, 1200)
		} catch {
			// error displayed below
		}
	}

	if (!open) return null

	return (
		<div className="fixed inset-0 z-50">
			{/* Backdrop */}
			<div className="fixed inset-0 bg-black/50" onClick={handleClose} aria-hidden="true" />

			{/* Bottom sheet */}
			<div
				className={cn(
					'fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col rounded-t-2xl bg-bg-card shadow-xl',
					'animate-in slide-in-from-bottom-4',
				)}
				role="dialog"
				aria-modal="true"
				aria-label="Bulk follow-up"
			>
				{/* Drag handle */}
				<div className="flex justify-center pt-3 pb-1">
					<div className="h-1 w-10 rounded-full bg-border" aria-hidden="true" />
				</div>

				{/* Header */}
				<div className="flex items-center justify-between border-b border-border px-5 py-3">
					<h2 className="text-base font-semibold text-t1">
						Follow up with {customerIds.length} customer{customerIds.length !== 1 ? 's' : ''}
					</h2>
					<button
						type="button"
						onClick={handleClose}
						className="rounded p-1 text-t3 hover:text-t2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
						aria-label="Close"
					>
						<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
							<path d="M18 6 6 18" />
							<path d="m6 6 12 12" />
						</svg>
					</button>
				</div>

				{/* Content */}
				<div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
					{/* Channel selector */}
					<div className="flex flex-col gap-1.5">
						<label htmlFor="followup-channel" className="text-sm font-medium text-t1">
							Channel
						</label>
						<select
							id="followup-channel"
							value={channel}
							onChange={(e) => setChannel(e.target.value)}
							className="w-full rounded-md border border-border-input bg-bg-input px-3 py-2 text-sm text-t1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
						>
							{CHANNELS.map((ch) => (
								<option key={ch.value} value={ch.value}>
									{ch.label}
								</option>
							))}
						</select>
					</div>

					{/* Message */}
					<div className="flex flex-col gap-1.5">
						<label htmlFor="followup-message" className="text-sm font-medium text-t1">
							Message
						</label>
						<Textarea
							id="followup-message"
							value={message}
							onChange={(e) => setMessage(e.target.value)}
							rows={5}
							placeholder="Type your follow-up message…"
							className="resize-none"
							aria-label="Follow-up message"
						/>
						<p className="text-xs text-t3">{message.length} characters</p>
					</div>

					{/* Error */}
					{bulkFollowup.isError && (
						<p className="rounded-md border border-error bg-error-bg px-3 py-2 text-sm text-error" role="alert">
							Failed to send follow-up. Please try again.
						</p>
					)}

					{/* Success */}
					{didSucceed && (
						<p
							className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700"
							role="status"
						>
							Follow-up tasks created for {customerIds.length} customer{customerIds.length !== 1 ? 's' : ''}!
						</p>
					)}
				</div>

				{/* Footer */}
				<div className="flex gap-3 border-t border-border px-5 py-4">
					<Button variant="outline" className="flex-1" onClick={handleClose}>
						Cancel
					</Button>
					<Button
						className="flex-1"
						disabled={!message.trim() || customerIds.length === 0 || didSucceed}
						loading={bulkFollowup.isPending}
						onClick={handleSend}
					>
						Send Follow-up
					</Button>
				</div>
			</div>
		</div>
	)
}
