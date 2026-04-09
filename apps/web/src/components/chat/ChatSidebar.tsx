import { useState } from 'react'
import { Bell, Calendar, X, ShoppingCart, AlertOctagon, Plus, Minus, Hash, Phone, Mail, MapPin, Tag, Users } from 'lucide-react'
import { cn } from '@one-bear/ui'
import type { ChatRoom } from '@one-bear/shared-types'
import { useMarkAsSpam, useUpdateFollowUp, useRoomOrder } from '@/api/useRooms'
import { useSendMessage } from '@/api/useMessages'
import { useMemberName, useMembers } from '@/api/useMembers'
import { useAuthStore } from '@/stores/auth-store'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog'
import { PlatformIcon } from './PlatformIcon'
import { TimerDisplay } from './TimerDisplay'
import type { HubConnection } from '@microsoft/signalr'

interface Props {
	room: ChatRoom
	connection: HubConnection | null
}

// ─── Shared product catalogue (prototype mock) ────────────────────────────────
const SAMPLE_PRODUCTS = [
	{ id: 'p1', name: 'Teddy Bear (S)', price: 490 },
	{ id: 'p2', name: 'Teddy Bear (M)', price: 790 },
	{ id: 'p3', name: 'Teddy Bear (L)', price: 1290 },
	{ id: 'p4', name: 'Gift Box', price: 150 },
	{ id: 'p5', name: 'Ribbon Set', price: 99 },
]

interface LineItem { productId: string; productName: string; quantity: number; unitPrice: number }

function formatThb(n: number) {
	return `฿${n.toLocaleString('th-TH')}`
}

function SectionTitle({ children }: { children: React.ReactNode }) {
	return <h3 className="text-xs font-semibold text-t3 uppercase tracking-[0.06em] mb-2">{children}</h3>
}

function formatMs(ms: number): string {
	const totalSeconds = Math.floor(ms / 1000)
	if (totalSeconds < 60) return `${totalSeconds}s`
	const minutes = Math.floor(totalSeconds / 60)
	const seconds = totalSeconds % 60
	if (minutes < 60) return `${minutes}m ${seconds}s`
	const hours = Math.floor(minutes / 60)
	const mins = minutes % 60
	return `${hours}h ${mins}m`
}

function formatFollowUpDate(timestamp: number): string {
	const d = new Date(timestamp)
	return d.toLocaleString('th-TH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function toDatetimeLocalValue(timestamp: number): string {
	const d = new Date(timestamp)
	const offset = d.getTimezoneOffset()
	const local = new Date(d.getTime() - offset * 60_000)
	return local.toISOString().slice(0, 16)
}

// ─── Order Timeline ───────────────────────────────────────────────────────────
type StepStatus = 'done' | 'current' | 'pending'

interface TimelineStep {
	key: string
	label: string
	sub?: string
	isSlip?: boolean
	status: StepStatus
}

function buildSteps(status: string, orderId: string): TimelineStep[] {
	const isPaid = ['Paid', 'Shipped', 'Completed'].includes(status)
	const isVerified = ['Shipped', 'Completed'].includes(status)
	const isDone = ['Shipped', 'Completed'].includes(status)

	return [
		{
			key: 'created',
			label: 'สร้างออเดอร์',
			sub: orderId as string,
			status: 'done',
		},
		{
			key: 'payment',
			label: isPaid ? 'ชำระแล้ว' : 'รอชำระเงิน',
			status: isPaid ? 'done' : (status === 'PendingPayment' ? 'current' : 'pending'),
		},
		{
			key: 'slip',
			label: isVerified ? 'ตรวจสอบแล้ว' : 'รอตรวจสอบสลิป',
			isSlip: true,
			status: isVerified ? 'done' : (isPaid ? 'current' : 'pending'),
		},
		{
			key: 'success',
			label: 'สำเร็จ',
			status: isDone ? 'done' : 'pending',
		},
	]
}

function StepDot({ status }: { status: StepStatus }) {
	if (status === 'done') {
		return (
			<div className="h-3.5 w-3.5 shrink-0 rounded-full bg-primary flex items-center justify-center">
				<svg className="h-2 w-2" viewBox="0 0 8 8" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
					<path d="M1.5 4L3.5 6L6.5 2" />
				</svg>
			</div>
		)
	}
	if (status === 'current') {
		return (
			<div className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-primary flex items-center justify-center">
				<div className="h-1.5 w-1.5 rounded-full bg-primary" />
			</div>
		)
	}
	return <div className="h-3.5 w-3.5 shrink-0 rounded-full border border-border bg-bg-input" />
}

function OrderTimeline({ order, onViewSlip }: { order: Record<string, unknown>; onViewSlip: () => void }) {
	const steps = buildSteps(order.status as string, order.orderId as string)

	return (
		<div>
			{steps.map((step, idx) => (
				<div key={step.key}>
					<div className="flex items-center gap-2">
						<StepDot status={step.status} />
						<span className={cn(
							'flex-1 text-xs min-w-0',
							step.status === 'done' && 'font-medium text-t1',
							step.status === 'current' && 'font-semibold text-primary',
							step.status === 'pending' && 'text-t3',
						)}>
							{step.label}
							{step.sub && (
								<span className="ml-1.5 font-mono text-[10px] text-t3">{step.sub}</span>
							)}
						</span>
						{step.isSlip && step.status === 'current' && (
							<button
								type="button"
								onClick={onViewSlip}
								className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium text-primary border border-primary/40 hover:bg-primary/10 transition-colors"
							>
								ดูสลิป
							</button>
						)}
					</div>
					{idx < steps.length - 1 && (
						<div className={cn('ml-[6px] h-4 w-px', step.status === 'done' ? 'bg-primary' : 'bg-border')} />
					)}
				</div>
			))}
		</div>
	)
}

// ─── Responsible chip ─────────────────────────────────────────────────────────
function ResponsibleChip({ userId, onRemove }: { userId: string; onRemove: () => void }) {
	const name = useMemberName(userId)
	const initial = (name ?? '?').charAt(0).toUpperCase()
	return (
		<div className="flex items-center gap-1 rounded-full border border-border bg-bg-input pl-1 pr-1.5 py-0.5">
			<div className="h-4 w-4 shrink-0 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-semibold text-primary">
				{initial}
			</div>
			<span className="text-xs text-t1 max-w-[72px] truncate">{name}</span>
			<button type="button" onClick={onRemove} className="shrink-0 text-t3 hover:text-error transition-colors">
				<X className="h-2.5 w-2.5" />
			</button>
		</div>
	)
}

// ─── Customer Info Section ────────────────────────────────────────────────────

function InfoRow({ icon, value, placeholder, onClick }: {
	icon: React.ReactNode
	value?: string
	placeholder: string
	onClick: () => void
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="flex items-center gap-2.5 w-full text-left py-1 group rounded hover:bg-bg-hover px-1 -mx-1 transition-colors"
		>
			<span className="shrink-0 text-t3 group-hover:text-t2 transition-colors">{icon}</span>
			{value ? (
				<span className="text-sm text-t1 truncate">{value}</span>
			) : (
				<span className="text-sm text-primary/80 font-medium">+ {placeholder}</span>
			)}
		</button>
	)
}

function ResponsibleViewChip({ userId }: { userId: string }) {
	const name = useMemberName(userId)
	const initial = (name ?? '?').charAt(0).toUpperCase()
	return (
		<div className="flex items-center gap-1 rounded-full border border-border bg-bg-input pl-1 pr-2 py-0.5">
			<div className="h-4 w-4 shrink-0 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-semibold text-primary">
				{initial}
			</div>
			<span className="text-xs text-t1 max-w-[80px] truncate">{name}</span>
		</div>
	)
}

function CustomerInfoSection({ room }: { room: ChatRoom }) {
	const { data: members = [] } = useMembers()

	const [isEditing, setIsEditing] = useState(false)
	const [phone, setPhone] = useState('')
	const [email, setEmail] = useState('')
	const [idNumber, setIdNumber] = useState('')
	const [address, setAddress] = useState('')
	const [tags, setTags] = useState<string[]>([])
	const [tagInput, setTagInput] = useState('')
	const [responsibles, setResponsibles] = useState<string[]>(
		room.assignToUserId ? [room.assignToUserId] : [],
	)
	const [showMemberPicker, setShowMemberPicker] = useState(false)

	const [saved, setSaved] = useState({
		phone: '', email: '', idNumber: '', address: '',
		tags: [] as string[],
		responsibles: room.assignToUserId ? [room.assignToUserId] : [] as string[],
	})

	const inputClass = cn(
		'w-full rounded-md border border-border-input bg-bg-input px-2.5 py-1.5 text-sm text-t1',
		'placeholder:text-t3 focus:outline-none focus:ring-1 focus:ring-primary',
	)

	function addTag() {
		const t = tagInput.trim()
		if (t && !tags.includes(t)) setTags((prev) => [...prev, t])
		setTagInput('')
	}

	function toggleResponsible(userId: string) {
		setResponsibles((prev) =>
			prev.includes(userId) ? prev.filter((x) => x !== userId) : [...prev, userId],
		)
	}

	function handleEdit() {
		setPhone(saved.phone)
		setEmail(saved.email)
		setIdNumber(saved.idNumber)
		setAddress(saved.address)
		setTags([...saved.tags])
		setResponsibles([...saved.responsibles])
		setIsEditing(true)
	}

	function handleSave() {
		setSaved({ phone, email, idNumber, address, tags: [...tags], responsibles: [...responsibles] })
		setIsEditing(false)
	}

	// ── View mode ──
	if (!isEditing) {
		return (
			<div className="flex flex-col">
				{/* Contact rows */}
				<InfoRow icon={<Hash className="h-3.5 w-3.5" />} value={saved.idNumber} placeholder="เพิ่มเลขบัตรประชาชน" onClick={handleEdit} />
				<InfoRow icon={<Phone className="h-3.5 w-3.5" />} value={saved.phone} placeholder="เพิ่มเบอร์โทร" onClick={handleEdit} />
				<InfoRow icon={<Mail className="h-3.5 w-3.5" />} value={saved.email} placeholder="เพิ่มอีเมล" onClick={handleEdit} />
				<InfoRow icon={<MapPin className="h-3.5 w-3.5" />} value={saved.address} placeholder="เพิ่มที่อยู่" onClick={handleEdit} />

				{/* Tags */}
				<div className="mt-2">
					<p className="text-[10px] font-semibold text-t3 uppercase tracking-[0.06em] mb-1.5">แท็ก</p>
					{saved.tags.length > 0 ? (
						<div className="flex flex-wrap gap-1 mb-1">
							{saved.tags.map((t) => (
								<span key={t} className="inline-flex items-center gap-1 rounded-full bg-bg-input border border-border px-2 py-0.5 text-xs text-t2">
									<Tag className="h-2.5 w-2.5 text-t3" />{t}
								</span>
							))}
						</div>
					) : null}
					<button type="button" onClick={handleEdit} className="flex items-center gap-1.5 text-sm text-primary/80 font-medium py-0.5">
						<Tag className="h-3.5 w-3.5 text-t3" />
						<span>+ เพิ่มแท็ก</span>
					</button>
				</div>

				{/* Responsibles */}
				<div className="mt-2">
					<p className="text-[10px] font-semibold text-t3 uppercase tracking-[0.06em] mb-1.5">ผู้รับผิดชอบ</p>
					{saved.responsibles.length > 0 ? (
						<div className="flex flex-wrap gap-1 mb-1">
							{saved.responsibles.map((uid) => (
								<ResponsibleViewChip key={uid} userId={uid} />
							))}
						</div>
					) : null}
					<button type="button" onClick={handleEdit} className="flex items-center gap-1.5 text-sm text-primary/80 font-medium py-0.5">
						<Users className="h-3.5 w-3.5 text-t3" />
						<span>+ เพิ่มผู้รับผิดชอบ</span>
					</button>
				</div>
			</div>
		)
	}

	// ── Edit mode ──
	return (
		<div className="flex flex-col gap-3">
			<div>
				<label className="text-[10px] font-semibold text-t3 uppercase tracking-[0.06em] block mb-0.5">เลขที่บัตรประชาชน</label>
				<input type="text" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} placeholder="X-XXXX-XXXXX-XX-X" maxLength={17} className={inputClass} />
			</div>
			<div>
				<label className="text-[10px] font-semibold text-t3 uppercase tracking-[0.06em] block mb-0.5">เบอร์โทร</label>
				<input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0X-XXXX-XXXX" className={inputClass} />
			</div>
			<div>
				<label className="text-[10px] font-semibold text-t3 uppercase tracking-[0.06em] block mb-0.5">อีเมล</label>
				<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" className={inputClass} />
			</div>
			<div>
				<label className="text-[10px] font-semibold text-t3 uppercase tracking-[0.06em] block mb-0.5">ที่อยู่</label>
				<textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="ที่อยู่สำหรับจัดส่ง..." rows={2} className={cn(inputClass, 'resize-none')} />
			</div>

			{/* Tags */}
			<div>
				<label className="text-[10px] font-semibold text-t3 uppercase tracking-[0.06em] block mb-1">แท็ก</label>
				{tags.length > 0 && (
					<div className="flex flex-wrap gap-1 mb-1.5">
						{tags.map((t) => (
							<span key={t} className="inline-flex items-center gap-1 rounded-full bg-bg-input border border-border px-2 py-0.5 text-xs text-t2">
								{t}
								<button type="button" onClick={() => setTags((p) => p.filter((x) => x !== t))} className="text-t3 hover:text-error">
									<X className="h-2.5 w-2.5" />
								</button>
							</span>
						))}
					</div>
				)}
				<div className="flex gap-1.5">
					<input
						type="text"
						value={tagInput}
						onChange={(e) => setTagInput(e.target.value)}
						onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
						placeholder="พิมพ์แท็ก แล้วกด Enter"
						className="flex-1 min-w-0 rounded-md border border-border-input bg-bg-input px-2 py-1 text-xs text-t1 placeholder:text-t3 focus:outline-none focus:ring-1 focus:ring-primary"
					/>
					<button type="button" onClick={addTag} className="shrink-0 flex items-center justify-center h-[30px] w-[30px] rounded-md border border-border-input bg-bg-input text-t2 hover:text-t1">
						<Plus className="h-3 w-3" />
					</button>
				</div>
			</div>

			{/* Responsibles */}
			<div>
				<label className="text-[10px] font-semibold text-t3 uppercase tracking-[0.06em] block mb-1">ผู้รับผิดชอบ</label>
				<div className="flex flex-wrap items-center gap-1.5 min-h-[28px]">
					{responsibles.map((userId) => (
						<ResponsibleChip key={userId} userId={userId} onRemove={() => toggleResponsible(userId)} />
					))}
					<div className="relative">
						<button
							type="button"
							onClick={() => setShowMemberPicker((p) => !p)}
							className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-border text-t3 hover:border-primary hover:text-primary transition-colors"
						>
							<Plus className="h-3 w-3" />
						</button>
						{showMemberPicker && (
							<>
								<div className="fixed inset-0 z-30" onClick={() => setShowMemberPicker(false)} />
								<div className="absolute left-0 top-7 z-40 w-52 rounded-lg border border-border bg-bg-card shadow-lg py-1">
									{members.length === 0 ? (
										<p className="px-3 py-2 text-xs text-t3">ไม่มีสมาชิก</p>
									) : members.map((m) => {
										const isSelected = responsibles.includes(m.keycloakUserId)
										const label = m.displayName ?? m.email ?? '?'
										return (
											<button
												key={m.id}
												type="button"
												onClick={() => toggleResponsible(m.keycloakUserId)}
												className={cn(
													'flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-bg-hover transition-colors',
													isSelected ? 'text-primary' : 'text-t1',
												)}
											>
												<div className="h-5 w-5 shrink-0 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-semibold text-primary">
													{label.charAt(0).toUpperCase()}
												</div>
												<span className="flex-1 truncate text-left">{label}</span>
												{isSelected && (
													<svg className="h-3 w-3 shrink-0" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
														<path d="M2 6l3 3 5-5" />
													</svg>
												)}
											</button>
										)
									})}
								</div>
							</>
						)}
					</div>
				</div>
			</div>

			<div className="flex gap-2 pt-1">
				<Button variant="outline" size="sm" className="flex-1" onClick={handleSave}>บันทึก</Button>
				<Button variant="ghost" size="sm" className="flex-1" onClick={() => setIsEditing(false)}>ยกเลิก</Button>
			</div>
		</div>
	)
}

// ─── Inline Order Panel ───────────────────────────────────────────────────────
function OrderPanel({ customerName, onClose, onSend }: {
	customerName: string
	onClose: () => void
	onSend: (text: string) => void
}) {
	const [items, setItems] = useState<LineItem[]>([
		{ productId: '', productName: '', quantity: 1, unitPrice: 0 },
	])

	const subtotal = items.reduce((s, it) => s + it.quantity * it.unitPrice, 0)

	function updateItem(idx: number, patch: Partial<LineItem>) {
		setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)))
	}

	function selectProduct(idx: number, productId: string) {
		const p = SAMPLE_PRODUCTS.find((x) => x.id === productId)
		if (p) updateItem(idx, { productId: p.id, productName: p.name, unitPrice: p.price })
	}

	function addItem() {
		setItems((prev) => [...prev, { productId: '', productName: '', quantity: 1, unitPrice: 0 }])
	}

	function removeItem(idx: number) {
		if (items.length === 1) return
		setItems((prev) => prev.filter((_, i) => i !== idx))
	}

	function handleSend() {
		const valid = items.filter((it) => it.productId && it.quantity > 0)
		if (valid.length === 0) return
		const lines = valid.map((it) => `• ${it.productName} x${it.quantity} = ${formatThb(it.quantity * it.unitPrice)}`)
		const msg = `📦 สรุปออเดอร์\n\n${lines.join('\n')}\n\nยอดรวม: ${formatThb(subtotal)}`
		onSend(msg)
		onClose()
	}

	const hasValidItem = items.some((it) => it.productId && it.quantity > 0)

	return (
		<div className="absolute inset-0 z-10 flex flex-col bg-bg-page">
			<div className="flex items-center gap-2 border-b border-border px-4 py-3">
				<button type="button" onClick={onClose} className="rounded-md p-1 text-t3 hover:bg-bg-hover hover:text-t1">
					<svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
				</button>
				<h3 className="text-sm font-semibold text-t1">สร้างออเดอร์</h3>
			</div>

			<div className="flex-1 overflow-y-auto p-4 space-y-4">
				<div>
					<p className="mb-1 text-xs font-medium text-t3">ลูกค้า</p>
					<div className="flex items-center gap-2 rounded-md border border-border-input bg-bg-input px-3 py-2">
						<span className="text-sm text-t1">{customerName}</span>
					</div>
				</div>

				<div>
					<p className="mb-1.5 text-xs font-medium text-t3">รายการสินค้า</p>
					<div className="space-y-2">
						{items.map((item, idx) => (
							<div key={idx} className="flex items-center gap-1.5">
								<select
									value={item.productId}
									onChange={(e) => selectProduct(idx, e.target.value)}
									className="min-w-0 flex-1 rounded-md border border-border-input bg-bg-input px-2 py-1.5 text-sm text-t1 focus:border-primary focus:outline-none"
								>
									<option value="">เลือกสินค้า</option>
									{SAMPLE_PRODUCTS.map((p) => (
										<option key={p.id} value={p.id}>{p.name}</option>
									))}
								</select>
								<div className="flex items-center gap-0.5 shrink-0">
									<button type="button" onClick={() => updateItem(idx, { quantity: Math.max(1, item.quantity - 1) })} className="rounded p-0.5 text-t3 hover:text-t1">
										<Minus className="h-3.5 w-3.5" />
									</button>
									<span className="w-7 text-center text-sm tabular-nums text-t1">{item.quantity}</span>
									<button type="button" onClick={() => updateItem(idx, { quantity: item.quantity + 1 })} className="rounded p-0.5 text-t3 hover:text-t1">
										<Plus className="h-3.5 w-3.5" />
									</button>
								</div>
								<span className="w-[60px] shrink-0 text-right text-xs tabular-nums text-t2">
									{item.productId ? formatThb(item.quantity * item.unitPrice) : '—'}
								</span>
								<button type="button" onClick={() => removeItem(idx)} disabled={items.length === 1} className="shrink-0 rounded p-0.5 text-t3 hover:text-error disabled:opacity-30">
									<X className="h-3.5 w-3.5" />
								</button>
							</div>
						))}
						<button type="button" onClick={addItem} className="flex items-center gap-1 text-xs text-primary hover:underline">
							<Plus className="h-3 w-3" />เพิ่มสินค้า
						</button>
					</div>
				</div>

				{subtotal > 0 && (
					<div className="flex items-center justify-between rounded-lg bg-bg-input px-3 py-2.5 text-sm font-semibold">
						<span className="text-t2">ยอดรวม</span>
						<span className="text-t1">{formatThb(subtotal)}</span>
					</div>
				)}

				{hasValidItem && (
					<div>
						<p className="mb-1 text-xs font-medium text-t3">ตัวอย่างข้อความที่จะส่ง</p>
						<div className="rounded-lg bg-bg-input px-3 py-2.5 text-xs text-t2 whitespace-pre-wrap leading-relaxed">
							{`📦 สรุปออเดอร์\n\n${items.filter((it) => it.productId).map((it) => `• ${it.productName} x${it.quantity} = ${formatThb(it.quantity * it.unitPrice)}`).join('\n')}\n\nยอดรวม: ${formatThb(subtotal)}`}
						</div>
					</div>
				)}
			</div>

			<div className="border-t border-border p-4">
				<Button className="w-full" onClick={handleSend} disabled={!hasValidItem}>
					สร้างและส่งสรุปในแช็ต
				</Button>
			</div>
		</div>
	)
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────────
export function ChatSidebar({ room, connection }: Props) {
	const user = useAuthStore((s) => s.user)
	const companyId = user?.companyId ?? ''

	const updateFollowUp = useUpdateFollowUp(companyId, room.id)
	const markAsSpam = useMarkAsSpam(companyId)
	const sendMessage = useSendMessage(companyId, room.id)
	const { data: roomOrder } = useRoomOrder(companyId, room.id)

	const [confirmSpam, setConfirmSpam] = useState(false)
	const [showOrderPanel, setShowOrderPanel] = useState(false)
	const [showSlipDialog, setShowSlipDialog] = useState(false)
	const [showFollowUpDialog, setShowFollowUpDialog] = useState(false)
	const [followUpDate, setFollowUpDate] = useState('')
	const [followUpNote, setFollowUpNote] = useState('')

	const hasFollowUp = room.followupTimestamp != null && room.followupTimestamp > 0
	const isFollowUpPast = hasFollowUp && room.followupTimestamp! < Date.now()
	const customerName = room.customerName ?? 'Unknown Customer'

	function openFollowUpDialog() {
		setFollowUpDate(hasFollowUp ? toDatetimeLocalValue(room.followupTimestamp!) : '')
		setFollowUpNote(room.followupContent ?? '')
		setShowFollowUpDialog(true)
	}

	function saveFollowUp() {
		if (!followUpDate) return
		updateFollowUp.mutate(
			{ followupTimestamp: new Date(followUpDate).getTime(), content: followUpNote || undefined },
			{ onSuccess: () => setShowFollowUpDialog(false) },
		)
	}

	function removeFollowUp() {
		updateFollowUp.mutate(
			{ followupTimestamp: null, content: null },
			{ onSuccess: () => setShowFollowUpDialog(false) },
		)
	}

	return (
		<div className="relative flex flex-col h-full bg-bg-page border-l border-border overflow-y-auto">

			{/* ── Inline Order Panel (overlay) ── */}
			{showOrderPanel && (
				<OrderPanel
					customerName={customerName}
					onClose={() => setShowOrderPanel(false)}
					onSend={(text) => sendMessage.mutate({ content: text, messageType: 'Text' })}
				/>
			)}

			{/* ── Customer header ── */}
			<div className="px-[18px] py-5 border-b border-border">
				<div className="flex flex-col items-center text-center">
					<Avatar
						src={room.customerAvatar ?? undefined}
						fallback={customerName.charAt(0)}
						size="lg"
						className="mb-2"
					/>
					<h2 className="text-sm font-semibold text-t1">{customerName}</h2>
					<div className="flex items-center gap-1.5 mt-1">
						<PlatformIcon platform={room.platform} size="sm" />
						<Badge platform={room.platform} className="text-[10px]">{room.platform}</Badge>
					</div>
				</div>
			</div>

			{/* ── Quick Actions ── */}
			<div className="px-4 py-3 border-b border-border">
				<SectionTitle>Actions</SectionTitle>
				<div className="grid grid-cols-3 gap-2">
					{/* Follow-up */}
					<button
						type="button"
						onClick={openFollowUpDialog}
						className={cn(
							'flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center transition-colors',
							hasFollowUp
								? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
								: 'border-border bg-bg-card text-t2 hover:bg-bg-hover hover:text-t1',
						)}
					>
						<Calendar className="h-4 w-4" />
						<span className="text-[11px] font-medium leading-tight">ติดตาม</span>
					</button>

					{/* Create Order */}
					<button
						type="button"
						onClick={() => setShowOrderPanel(true)}
						className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-bg-card px-2 py-3 text-center text-t2 transition-colors hover:bg-bg-hover hover:text-t1"
					>
						<ShoppingCart className="h-4 w-4" />
						<span className="text-[11px] font-medium leading-tight">ออเดอร์</span>
					</button>

					{/* Spam */}
					<button
						type="button"
						onClick={() => setConfirmSpam(true)}
						className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-bg-card px-2 py-3 text-center text-t2 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
					>
						<AlertOctagon className="h-4 w-4" />
						<span className="text-[11px] font-medium leading-tight">Spam</span>
					</button>
				</div>
			</div>

			{/* ── Order Timeline ── */}
			{roomOrder && (
				<div className="px-4 py-3 border-b border-border">
					<SectionTitle>ออเดอร์</SectionTitle>
					<OrderTimeline order={roomOrder} onViewSlip={() => setShowSlipDialog(true)} />
				</div>
			)}

			{/* ── Response Times ── */}
			{room.frtStartTimestamp && (
				<div className="p-4 border-b border-border">
					<SectionTitle>Response Times</SectionTitle>
					{room.isResolved ? (
						<div className="flex flex-col gap-2">
							{room.frtDurationMs != null && (
								<div className="flex items-center justify-between text-sm">
									<span className="text-t3">Latest FRT</span>
									<span className="font-medium text-t1 tabular-nums">{formatMs(room.frtDurationMs)}</span>
								</div>
							)}
							{room.rtDurationMs != null && (
								<div className="flex items-center justify-between text-sm">
									<span className="text-t3">Latest RT</span>
									<span className="font-medium text-t1 tabular-nums">{formatMs(room.rtDurationMs)}</span>
								</div>
							)}
							{(room.sessionTimings?.length ?? 0) > 1 && (() => {
								const sessions = room.sessionTimings!
								const avgFrt = Math.round(sessions.reduce((acc, s) => acc + s.frtMs, 0) / sessions.length)
								const avgRt = Math.round(sessions.reduce((acc, s) => acc + s.rtMs, 0) / sessions.length)
								return (
									<div className="mt-1 border-t border-border pt-1 space-y-1">
										<div className="flex items-center justify-between text-sm">
											<span className="text-t3">Avg FRT</span>
											<span className="font-medium text-t1 tabular-nums">{formatMs(avgFrt)}</span>
										</div>
										<div className="flex items-center justify-between text-sm">
											<span className="text-t3">Avg RT</span>
											<span className="font-medium text-t1 tabular-nums">{formatMs(avgRt)}</span>
										</div>
									</div>
								)
							})()}
						</div>
					) : (
						<div className="flex items-center gap-2">
							<span className="text-sm text-t3">
								{!room.isFrtStopped ? 'First Response Time' : 'Resolved Time'}
							</span>
							{!room.isFrtStopped ? (
								<TimerDisplay startTimestamp={room.frtStartTimestamp} />
							) : (
								<TimerDisplay startTimestamp={room.frtStartTimestamp} stoppedAt={room.frtEndTimestamp} />
							)}
						</div>
					)}
				</div>
			)}

			{/* ── Customer Info ── */}
			<div className="p-4 border-b border-border">
				<SectionTitle>ข้อมูลลูกค้า</SectionTitle>
				<CustomerInfoSection room={room} />
			</div>

			{/* ── Notes ── */}
			<div className="p-4">
				<SectionTitle>Notes</SectionTitle>
				<textarea
					placeholder="เพิ่มโน้ต..."
					rows={3}
					className={cn(
						'w-full resize-none rounded-lg border border-border-input bg-bg-input px-3 py-2 text-sm',
						'placeholder:text-t3',
						'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
					)}
				/>
			</div>

			{/* ── Spam Confirmation Dialog ── */}
			<Dialog open={confirmSpam} onOpenChange={() => setConfirmSpam(false)}>
				<DialogHeader>
					<DialogTitle>ย้ายไป Spam</DialogTitle>
					<DialogDescription>
						ย้ายแช็ตนี้ไปยัง Spam Folder? จะถูกซ่อนจากรายการหลักจนกว่าจะมีการปลด Spam
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="ghost" size="sm" onClick={() => setConfirmSpam(false)} disabled={markAsSpam.isPending}>
						ยกเลิก
					</Button>
					<Button
						size="sm"
						onClick={() => markAsSpam.mutate(room.id, { onSuccess: () => setConfirmSpam(false) })}
						loading={markAsSpam.isPending}
						className="bg-red-600 hover:bg-red-700"
					>
						ย้ายไป Spam
					</Button>
				</DialogFooter>
			</Dialog>

			{/* ── Slip Viewer Dialog ── */}
			<Dialog open={showSlipDialog} onOpenChange={setShowSlipDialog}>
				<DialogHeader>
					<DialogTitle>สลิปการชำระเงิน</DialogTitle>
					<DialogDescription>
						รูปสลิปที่ลูกค้าส่งมา
					</DialogDescription>
				</DialogHeader>
				<div className="px-4 py-6 flex flex-col items-center justify-center gap-3 min-h-[160px] bg-bg-input rounded-lg mx-4 mb-2">
					<svg className="h-10 w-10 text-t3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
						<rect x="3" y="3" width="18" height="18" rx="2" />
						<circle cx="8.5" cy="8.5" r="1.5" />
						<path d="m21 15-5-5L5 21" />
					</svg>
					<p className="text-sm text-t3">ยังไม่มีสลิปในระบบ</p>
				</div>
				<DialogFooter>
					<Button variant="outline" size="sm" onClick={() => setShowSlipDialog(false)}>
						ปิด
					</Button>
				</DialogFooter>
			</Dialog>

			{/* ── Follow-up Dialog ── */}
			<Dialog open={showFollowUpDialog} onOpenChange={setShowFollowUpDialog}>
				<DialogHeader>
					<DialogTitle>
						{hasFollowUp ? 'แก้ไข Follow-up' : 'ตั้งเวลา Follow-up'}
					</DialogTitle>
					{hasFollowUp && (
						<DialogDescription>
							<span className={cn('text-xs font-medium', isFollowUpPast ? 'text-red-500' : 'text-amber-600')}>
								{isFollowUpPast ? '⚠ เกินกำหนด · ' : ''}
								{formatFollowUpDate(room.followupTimestamp!)}
							</span>
						</DialogDescription>
					)}
				</DialogHeader>
				<div className="px-4 pb-2 flex flex-col gap-3">
					<div>
						<label className="text-[11px] font-medium text-t3 mb-0.5 block">วันและเวลา</label>
						<input
							type="datetime-local"
							value={followUpDate}
							onChange={(e) => setFollowUpDate(e.target.value)}
							className="w-full rounded-md border border-border-input bg-bg-input px-2.5 py-1.5 text-sm text-t1 focus:outline-none focus:ring-1 focus:ring-primary"
						/>
					</div>
					<div>
						<label className="text-[11px] font-medium text-t3 mb-0.5 block">หมายเหตุ (ไม่บังคับ)</label>
						<textarea
							value={followUpNote}
							onChange={(e) => setFollowUpNote(e.target.value)}
							placeholder="จะ follow up เรื่องอะไร..."
							rows={2}
							className="w-full resize-none rounded-md border border-border-input bg-bg-input px-2.5 py-1.5 text-sm placeholder:text-t3 focus:outline-none focus:ring-1 focus:ring-primary"
						/>
					</div>
				</div>
				<DialogFooter>
					{hasFollowUp && (
						<Button variant="ghost" size="sm" onClick={removeFollowUp} loading={updateFollowUp.isPending} className="mr-auto text-error hover:bg-red-50">
							ลบ
						</Button>
					)}
					<Button variant="ghost" size="sm" onClick={() => setShowFollowUpDialog(false)} disabled={updateFollowUp.isPending}>
						ยกเลิก
					</Button>
					<Button size="sm" onClick={saveFollowUp} loading={updateFollowUp.isPending} disabled={!followUpDate}>
						บันทึก
					</Button>
				</DialogFooter>
			</Dialog>
		</div>
	)
}
