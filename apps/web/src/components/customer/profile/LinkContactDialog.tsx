import { useState } from 'react'
import { cn } from '@one-bear/ui'
import { Dialog, DialogHeader, DialogTitle, DialogClose, DialogContent } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { useLinkContact, useCustomers } from '@/api/useCustomers'
import { generateAvatarColor } from '@/components/customer/CustomerCard'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
	organizationId: string
	onClose: () => void
	onLinked: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LinkContactDialog({ organizationId, onClose, onLinked }: Props) {
	const [search, setSearch] = useState('')
	const linkContact = useLinkContact()

	// Fetch Individual customers matching the search
	const { data, isLoading } = useCustomers({ search: search.trim() || undefined })
	const allItems = data?.pages.flatMap((p) => p.data) ?? []

	// Only show Individual type customers (orgs can't be contacts)
	const results = allItems.filter((c) => c.customerType === 'Individual')

	function handleLink(contactCustomerId: string) {
		linkContact.mutate(
			{ id: organizationId, contactCustomerId },
			{
				onSuccess: () => {
					onLinked()
					onClose()
				},
			},
		)
	}

	return (
		<Dialog open onOpenChange={(open) => !open && onClose()}>
			<DialogHeader>
				<DialogTitle>Link Existing Contact</DialogTitle>
				<DialogClose onClose={onClose} />
			</DialogHeader>

			<DialogContent>
				<Input
					autoFocus
					placeholder="Search by name, email, or phone…"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="mb-3"
					aria-label="Search customers"
				/>

				<div className="max-h-72 overflow-y-auto rounded-lg border border-border">
					{isLoading ? (
						<p className="px-4 py-3 text-sm text-t3">Searching…</p>
					) : results.length === 0 ? (
						<p className="px-4 py-3 text-sm text-t3">
							{search.trim() ? 'No Individual customers found.' : 'Type to search for a customer.'}
						</p>
					) : (
						results.slice(0, 20).map((customer) => {
							const initials = customer.name.slice(0, 2).toUpperCase()
							const bg = generateAvatarColor(customer.name)

							return (
								<button
									key={customer.id}
									type="button"
									disabled={linkContact.isPending}
									onClick={() => handleLink(customer.id)}
									className={cn(
										'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors',
										'hover:bg-bg-hover focus-visible:outline-none focus-visible:bg-bg-hover',
										'border-b border-border last:border-0',
									)}
								>
									<div
										className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
										style={{ backgroundColor: customer.avatar ? undefined : bg }}
										aria-hidden="true"
									>
										{customer.avatar ? (
											<img src={customer.avatar} alt={customer.name} className="h-8 w-8 rounded-full object-cover" />
										) : (
											initials
										)}
									</div>
									<div className="min-w-0 flex-1">
										<p className="truncate text-sm font-medium text-t1">{customer.name}</p>
										<p className="truncate text-xs text-t3">
											{customer.email ?? customer.phone ?? 'No contact info'}
										</p>
									</div>
									<span className="shrink-0 text-xs font-medium text-primary">Link</span>
								</button>
							)
						})
					)}
				</div>

				{linkContact.isError && (
					<p className="mt-2 text-xs text-error">Failed to link contact. Please try again.</p>
				)}
			</DialogContent>
		</Dialog>
	)
}
