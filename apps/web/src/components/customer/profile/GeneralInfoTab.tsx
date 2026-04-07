import { useState } from 'react'
import { cn } from '@one-bear/ui'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter, DialogClose } from '@/components/ui/Dialog'
import { PinnedNoteEditor } from '@/components/customer/PinnedNoteEditor'
import { SegmentTag } from '@/components/customer/SegmentTag'
import { generateAvatarColor } from '@/components/customer/CustomerCard'
import { LinkContactDialog } from './LinkContactDialog'
import { useAddCustomerTag, useRemoveCustomerTag, useCustomerContacts, useUnlinkContact } from '@/api/useCustomers'
import type { CustomerDetail, ContactListItem } from '@/api/useCustomers'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
	if (value >= 1_000_000) return `฿${(value / 1_000_000).toFixed(1)}M`
	if (value >= 1_000) return `฿${(value / 1_000).toFixed(1)}K`
	return `฿${value.toFixed(0)}`
}

function formatTimestamp(ts: number | null): string {
	if (ts === null) return '—'
	return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
	return <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-t3">{children}</p>
}

// ─── Stat tile ────────────────────────────────────────────────────────────────

function StatTile({ label, value }: { label: string; value: string | number }) {
	return (
		<div className="rounded-lg bg-bg-page p-3 text-center">
			<p className="text-xs text-t3">{label}</p>
			<p className="mt-0.5 text-sm font-semibold text-t1">{value}</p>
		</div>
	)
}

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

// ─── Tag editor ───────────────────────────────────────────────────────────────

interface TagEditorProps {
	customerId: string
	tags: CustomerDetail['tags']
}

function TagEditor({ customerId, tags }: TagEditorProps) {
	const [adding, setAdding] = useState(false)
	const [newTag, setNewTag] = useState('')
	const addTag = useAddCustomerTag()
	const removeTag = useRemoveCustomerTag()

	function handleAdd() {
		const trimmed = newTag.trim()
		if (!trimmed) return
		addTag.mutate({ id: customerId, name: trimmed }, {
			onSuccess: () => {
				setNewTag('')
				setAdding(false)
			},
		})
	}

	return (
		<div>
			<SectionLabel>Tags</SectionLabel>
			<div className="flex flex-wrap gap-1.5">
				{tags.map((tag) => (
					<div key={tag.name} className="group relative">
						<SegmentTag tag={tag} />
						<button
							type="button"
							onClick={() => removeTag.mutate({ id: customerId, name: tag.name })}
							className="absolute -right-1 -top-1 hidden h-3.5 w-3.5 items-center justify-center rounded-full bg-t3 text-[8px] text-white group-hover:flex"
							aria-label={`Remove tag ${tag.name}`}
						>
							×
						</button>
					</div>
				))}

				{adding ? (
					<div className="flex items-center gap-1.5">
						<Input
							autoFocus
							value={newTag}
							onChange={(e) => setNewTag(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === 'Enter') handleAdd()
								if (e.key === 'Escape') { setAdding(false); setNewTag('') }
							}}
							placeholder="Tag name…"
							className="h-6 w-28 px-2 text-xs"
						/>
						<button
							type="button"
							onClick={handleAdd}
							disabled={addTag.isPending}
							className="rounded px-2 py-0.5 text-xs font-medium text-primary hover:underline disabled:opacity-50"
						>
							Add
						</button>
						<button
							type="button"
							onClick={() => { setAdding(false); setNewTag('') }}
							className="rounded px-1 py-0.5 text-xs text-t3 hover:text-t2"
						>
							Cancel
						</button>
					</div>
				) : (
					<button
						type="button"
						onClick={() => setAdding(true)}
						className="flex items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-0.5 text-xs text-t3 hover:border-t2 hover:text-t2"
					>
						<span aria-hidden="true">+</span> Add tag
					</button>
				)}
			</div>
		</div>
	)
}

// ─── Unlink confirm dialog ────────────────────────────────────────────────────

interface UnlinkConfirmProps {
	contact: ContactListItem
	onConfirm: () => void
	onCancel: () => void
	isPending: boolean
}

function UnlinkConfirmDialog({ contact, onConfirm, onCancel, isPending }: UnlinkConfirmProps) {
	return (
		<Dialog open onOpenChange={(open) => !open && onCancel()}>
			<DialogHeader>
				<DialogTitle>Unlink Contact</DialogTitle>
				<DialogClose onClose={onCancel} />
			</DialogHeader>
			<DialogContent>
				<p className="text-sm text-t2">
					Remove <strong>{contact.name}</strong> as a contact from this organization? The customer record will remain intact.
				</p>
			</DialogContent>
			<DialogFooter>
				<Button type="button" variant="outline" onClick={onCancel}>
					Cancel
				</Button>
				<Button type="button" onClick={onConfirm} loading={isPending}>
					Unlink
				</Button>
			</DialogFooter>
		</Dialog>
	)
}

// ─── Contacts section (Organization only) ─────────────────────────────────────

interface ContactsSectionProps {
	customerId: string
}

function ContactsSection({ customerId }: ContactsSectionProps) {
	const { data: contacts = [], isLoading } = useCustomerContacts(customerId)
	const unlinkContact = useUnlinkContact()
	const [showLinkDialog, setShowLinkDialog] = useState(false)
	const [confirmUnlink, setConfirmUnlink] = useState<ContactListItem | null>(null)

	function handleUnlinkConfirm() {
		if (!confirmUnlink) return
		unlinkContact.mutate(
			{ id: customerId, contactId: confirmUnlink.id },
			{ onSuccess: () => setConfirmUnlink(null) },
		)
	}

	return (
		<div>
			<div className="mb-2 flex items-center justify-between">
				<SectionLabel>Contacts</SectionLabel>
				<button
					type="button"
					onClick={() => setShowLinkDialog(true)}
					className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
				>
					<span aria-hidden="true">+</span> Link Existing Contact
				</button>
			</div>

			{isLoading ? (
				<p className="text-xs text-t3">Loading contacts…</p>
			) : contacts.length === 0 ? (
				<p className="rounded-lg border border-dashed border-border px-4 py-3 text-sm text-t3">
					No contacts linked. Click "Link Existing Contact" to add one.
				</p>
			) : (
				<div className="divide-y divide-border rounded-lg border border-border">
					{contacts.map((contact) => {
						const initials = contact.name.slice(0, 2).toUpperCase()
						const bg = generateAvatarColor(contact.name)

						return (
							<div key={contact.id} className="flex items-center gap-3 px-4 py-3">
								<div
									className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
									style={{ backgroundColor: contact.avatar ? undefined : bg }}
									aria-hidden="true"
								>
									{contact.avatar ? (
										<img src={contact.avatar} alt={contact.name} className="h-8 w-8 rounded-full object-cover" />
									) : (
										initials
									)}
								</div>
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-medium text-t1">{contact.name}</p>
									{contact.email && <p className="truncate text-xs text-t3">{contact.email}</p>}
								</div>
								<button
									type="button"
									onClick={() => setConfirmUnlink(contact)}
									className="shrink-0 rounded px-2 py-1 text-xs font-medium text-t3 transition-colors hover:bg-bg-hover hover:text-error"
								>
									Unlink
								</button>
							</div>
						)
					})}
				</div>
			)}

			{showLinkDialog && (
				<LinkContactDialog
					organizationId={customerId}
					onClose={() => setShowLinkDialog(false)}
					onLinked={() => setShowLinkDialog(false)}
				/>
			)}

			{confirmUnlink && (
				<UnlinkConfirmDialog
					contact={confirmUnlink}
					onConfirm={handleUnlinkConfirm}
					onCancel={() => setConfirmUnlink(null)}
					isPending={unlinkContact.isPending}
				/>
			)}
		</div>
	)
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
	customer: CustomerDetail
}

export function GeneralInfoTab({ customer }: Props) {
	const [showNoteEditor, setShowNoteEditor] = useState(false)

	return (
		<div className="space-y-6">
			{/* Profile header */}
			<div className="flex items-center gap-4">
				<div
					className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
					style={{
						backgroundColor: customer.avatar
							? undefined
							: `hsl(${Math.abs(customer.name.charCodeAt(0) * 137) % 360}, 55%, 45%)`,
					}}
				>
					{customer.avatar ? (
						<img src={customer.avatar} alt={customer.name} className="h-16 w-16 rounded-full object-cover" />
					) : (
						customer.name.slice(0, 2).toUpperCase()
					)}
				</div>
				<div className="min-w-0">
					<h2 className="text-xl font-bold text-t1">{customer.name}</h2>
					<span
						className={cn(
							'mt-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
							customer.customerType === 'Organization'
								? 'bg-purple-100 text-purple-700'
								: 'bg-bg-input text-t3',
						)}
					>
						{customer.customerType}
					</span>
					{customer.isAtRisk && (
						<span className="ml-2 inline-flex rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700">
							At-risk
						</span>
					)}
				</div>
			</div>

			{/* Pinned note — prominent */}
			<div>
				<SectionLabel>Pinned Note</SectionLabel>
				{!showNoteEditor ? (
					<div
						className={cn(
							'cursor-pointer rounded-lg border p-4',
							customer.pinnedNote ? 'border-amber-200 bg-amber-50' : 'border-dashed border-border',
						)}
						onClick={() => setShowNoteEditor(true)}
					>
						{customer.pinnedNote ? (
							<div>
								<p className="text-sm text-t1">{customer.pinnedNote}</p>
								{customer.pinnedNoteBy && (
									<p className="mt-2 text-[10px] text-t3">by {customer.pinnedNoteBy}</p>
								)}
							</div>
						) : (
							<p className="text-sm text-t3">Click to add a pinned note…</p>
						)}
					</div>
				) : (
					<div className="rounded-lg border border-border bg-bg-card p-4">
						<PinnedNoteEditor
							customerId={customer.id}
							currentNote={customer.pinnedNote}
							onClose={() => setShowNoteEditor(false)}
						/>
					</div>
				)}
			</div>

			{/* Tags */}
			<TagEditor customerId={customer.id} tags={customer.tags} />

			{/* Contacts (Organization only) */}
			{customer.customerType === 'Organization' && (
				<ContactsSection customerId={customer.id} />
			)}

			{/* Connected channels */}
			{customer.channels.length > 0 && (
				<div>
					<SectionLabel>Connected Channels</SectionLabel>
					<div className="flex flex-wrap gap-2">
						{customer.channels.map((ch, i) => (
							<div key={`${ch.platform}-${i}`} className="flex items-center gap-2 rounded-lg border border-border bg-bg-card px-3 py-2">
								<span
									className={cn(
										'h-2.5 w-2.5 rounded-full shrink-0',
										PLATFORM_COLORS[ch.platform.toLowerCase()] ?? 'bg-gray-400',
									)}
									aria-hidden="true"
								/>
								<span className="text-sm text-t1">{ch.displayName ?? ch.platform}</span>
								<Badge platform={ch.platform} className="ml-1 capitalize">
									{ch.platform}
								</Badge>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Contact info */}
			{(customer.email || customer.phone || customer.nationalId || customer.taxId) && (
				<div>
					<SectionLabel>Contact Info</SectionLabel>
					<div className="divide-y divide-border rounded-lg border border-border">
						{customer.email && (
							<div className="flex items-center justify-between px-4 py-2.5 text-sm">
								<span className="text-t3">Email</span>
								<span className="text-t1">{customer.email}</span>
							</div>
						)}
						{customer.phone && (
							<div className="flex items-center justify-between px-4 py-2.5 text-sm">
								<span className="text-t3">Phone</span>
								<span className="text-t1">{customer.phone}</span>
							</div>
						)}
						{customer.nationalId && (
							<div className="flex items-center justify-between px-4 py-2.5 text-sm">
								<span className="text-t3">National ID</span>
								<span className="text-t1">{customer.nationalId}</span>
							</div>
						)}
						{customer.taxId && (
							<div className="flex items-center justify-between px-4 py-2.5 text-sm">
								<span className="text-t3">Tax ID</span>
								<span className="text-t1">{customer.taxId}</span>
							</div>
						)}
					</div>
				</div>
			)}

			{/* CRM Stats */}
			<div>
				<SectionLabel>CRM Stats</SectionLabel>
				<div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
					<StatTile label="Lifetime Value" value={formatCurrency(customer.ltv)} />
					<StatTile label="Avg Order Value" value={formatCurrency(customer.aov)} />
					<StatTile label="Orders" value={customer.orderCount} />
					<StatTile label="First Order" value={formatTimestamp(null)} />
					<StatTile label="Last Order" value={formatTimestamp(customer.lastOrderTimestamp)} />
					<StatTile label="Created" value={formatTimestamp(customer.createdTimestamp)} />
				</div>
			</div>
		</div>
	)
}
