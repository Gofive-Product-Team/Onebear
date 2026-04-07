import { cn } from '@one-bear/ui'
import { Tooltip } from '@/components/ui/Tooltip'
import { generateAvatarColor } from './CustomerCard'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Contact {
	name: string
	avatar?: string
}

interface Props {
	contacts: Contact[]
	max?: number
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ContactAvatarStack({ contacts, max = 3 }: Props) {
	const visible = contacts.slice(0, max)
	const overflow = contacts.length - max

	if (contacts.length === 0) {
		return <span className="text-xs text-t3">No contacts</span>
	}

	return (
		<div className="flex items-center">
			{visible.map((contact, i) => {
				const initials = contact.name.slice(0, 2).toUpperCase()
				const bg = generateAvatarColor(contact.name)

				return (
					<Tooltip key={`${contact.name}-${i}`} content={contact.name} side="top">
						<div
							className={cn(
								'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-bg-card text-[9px] font-semibold text-white',
								i > 0 && '-ml-1.5',
							)}
							style={{ backgroundColor: contact.avatar ? undefined : bg, zIndex: visible.length - i }}
							aria-label={contact.name}
						>
							{contact.avatar ? (
								<img src={contact.avatar} alt={contact.name} className="h-6 w-6 rounded-full object-cover" />
							) : (
								initials
							)}
						</div>
					</Tooltip>
				)
			})}

			{overflow > 0 && (
				<Tooltip content={`${overflow} more contact${overflow === 1 ? '' : 's'}`} side="top">
					<div
						className={cn(
							'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-bg-card',
							'bg-bg-input text-[9px] font-semibold text-t2 -ml-1.5',
						)}
						aria-label={`${overflow} more contacts`}
					>
						+{overflow}
					</div>
				</Tooltip>
			)}
		</div>
	)
}
