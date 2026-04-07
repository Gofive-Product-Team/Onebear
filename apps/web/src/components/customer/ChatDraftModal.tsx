import { useState } from 'react'
import { cn } from '@one-bear/ui'
import { Dialog, DialogHeader, DialogTitle, DialogClose, DialogContent, DialogFooter } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import type { CustomerListItem, SuggestedActionType } from '@/api/useCustomers'

// ─── Template registry ────────────────────────────────────────────────────────

const CHAT_TEMPLATES: Record<SuggestedActionType, string> = {
	chat: 'สวัสดีค่ะ ขอบคุณที่สนใจสินค้าของเรานะคะ มีอะไรให้ช่วยเหลือไหมคะ?',
	followup: 'สวัสดีค่ะ เราไม่ได้ติดต่อกันมาสักพักแล้ว มีโปรโมชั่นพิเศษสำหรับคุณค่ะ สนใจไหมคะ?',
	welcome: 'ยินดีต้อนรับค่ะ! เราพร้อมให้บริการคุณค่ะ สนใจสินค้าอะไรเป็นพิเศษไหมคะ?',
}

// ─── Toast (inline, lightweight) ──────────────────────────────────────────────

interface ToastProps {
	message: string
}

function InlineToast({ message }: ToastProps) {
	return (
		<div
			className={cn(
				'mt-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700',
				'animate-in fade-in-0 slide-in-from-bottom-2',
			)}
			role="status"
			aria-live="polite"
		>
			{message}
		</div>
	)
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
	customer: CustomerListItem
	actionType: SuggestedActionType
	onClose: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ChatDraftModal({ customer, actionType, onClose }: Props) {
	const [message, setMessage] = useState(CHAT_TEMPLATES[actionType])
	const [sent, setSent] = useState(false)

	function handleSend() {
		// Chat room linking is complex — show informational toast
		setSent(true)
	}

	return (
		<Dialog open onOpenChange={(open) => !open && onClose()}>
			<DialogHeader>
				<DialogTitle>Send message to {customer.name}</DialogTitle>
				<DialogClose onClose={onClose} />
			</DialogHeader>

			<DialogContent>
				<p className="mb-3 text-xs text-t3">Please review the message before sending</p>

				<Textarea
					value={message}
					onChange={(e) => setMessage(e.target.value)}
					rows={5}
					placeholder="Type your message…"
					className="w-full"
					aria-label="Message draft"
				/>

				{sent && (
					<InlineToast message="Message will be sent when chat integration is ready" />
				)}
			</DialogContent>

			<DialogFooter>
				<Button type="button" variant="outline" onClick={onClose}>
					Cancel
				</Button>
				<Button
					type="button"
					onClick={handleSend}
					disabled={!message.trim() || sent}
				>
					Send
				</Button>
			</DialogFooter>
		</Dialog>
	)
}
