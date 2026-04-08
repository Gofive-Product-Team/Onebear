import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { cn } from '@one-bear/ui'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { useCustomers, useSegmentCounts, useSnoozeCustomer, type SegmentCounts, type CustomerListItem } from '@/api/useCustomers'
import { CustomerCard } from '@/components/customer/CustomerCard'
import { CustomerDetailModal } from '@/components/customer/CustomerDetailModal'
import { FilterChips } from '@/components/customer/FilterChips'
import { SortDropdown } from '@/components/customer/SortDropdown'
import { CustomerSearch } from '@/components/customer/CustomerSearch'
import { AddCustomerPanel } from '@/components/customer/AddCustomerPanel'
import { FloatingActionButton } from '@/components/customer/FloatingActionButton'
import { KpiSnapshotBar } from '@/components/customer/KpiSnapshotBar'
import { SelectionModeToolbar } from '@/components/customer/SelectionModeToolbar'
import { BulkFollowupSheet } from '@/components/customer/BulkFollowupSheet'
import { CustomerContextMenu } from '@/components/customer/CustomerContextMenu'
import { CustomerLongPressSheet } from '@/components/customer/CustomerLongPressSheet'
import { SwipeableCard } from '@/components/customer/SwipeableCard'
import {
	AdvancedFilterPanel,
	ActiveFilterChips,
	EMPTY_FILTERS,
	type AdvancedFilters,
} from '@/components/customer/AdvancedFilterPanel'

// ─── Empty segment counts fallback ────────────────────────────────────────────

const EMPTY_COUNTS: SegmentCounts = { all: 0, hot: 0, vip: 0, atRisk: 0, new: 0, cold: 0, organization: 0 }

// ─── View toggle persistence ──────────────────────────────────────────────────

const VIEW_PREF_KEY = 'ob-customer-view'

function getSavedView(): 'table' | 'card' {
	try {
		const v = localStorage.getItem(VIEW_PREF_KEY)
		if (v === 'card' || v === 'table') return v
	} catch {
		// ignore
	}
	return 'table'
}

// ─── Platform badge ───────────────────────────────────────────────────────────

const PLATFORM_COLORS: Record<string, string> = {
	line: 'bg-[#06C755] text-white',
	facebook: 'bg-[#1877F2] text-white',
	instagram: 'bg-[#E1306C] text-white',
	whatsapp: 'bg-[#25D366] text-white',
	email: 'bg-blue-500 text-white',
	tiktok: 'bg-gray-900 text-white',
	lazada: 'bg-[#F7542B] text-white',
	shopee: 'bg-[#EE4D2D] text-white',
}

const PLATFORM_LABELS: Record<string, string> = {
	line: 'LINE',
	facebook: 'FB',
	instagram: 'IG',
	whatsapp: 'WA',
	email: 'Email',
	tiktok: 'TikTok',
	lazada: 'Lazada',
	shopee: 'Shopee',
}

function PlatformBadge({ platform }: { platform: string }) {
	const key = platform.toLowerCase()
	const color = PLATFORM_COLORS[key] ?? 'bg-bg-input text-t2'
	const label = PLATFORM_LABELS[key] ?? platform
	return (
		<span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold', color)}>
			{label}
		</span>
	)
}

// ─── Segment badge ────────────────────────────────────────────────────────────

function getSegment(customer: CustomerListItem): { label: string; icon: string; cls: string } | null {
	const ltv = customer.ltv
	const daysSince = customer.daysSinceLastPurchase
	if (customer.isAtRisk) return { label: 'At-risk', icon: '⚠️', cls: 'bg-orange-100 text-orange-700' }
	if (customer.orderCount === 0) return { label: 'New', icon: '🌱', cls: 'bg-green-100 text-green-700' }
	if (ltv >= 50000) return { label: 'VIP', icon: '💎', cls: 'bg-purple-100 text-purple-700' }
	if (ltv >= 5000 || (customer.orderCount >= 3 && (daysSince ?? 999) < 60)) return { label: 'Hot', icon: '🔥', cls: 'bg-red-100 text-red-700' }
	if ((daysSince ?? 0) > 180) return { label: 'Cold', icon: '❄️', cls: 'bg-blue-100 text-blue-700' }
	return null
}

// ─── Avatar bubble ────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
	'bg-violet-500', 'bg-indigo-500', 'bg-blue-500', 'bg-teal-500',
	'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-pink-500',
]

function initials(name: string) {
	return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

function avatarColor(id: string) {
	let hash = 0
	for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0
	return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function AvatarBubble({ customer, size = 'md' }: { customer: CustomerListItem; size?: 'sm' | 'md' }) {
	const sz = size === 'sm' ? 'h-7 w-7 text-xs' : 'h-9 w-9 text-sm'
	if (customer.avatar) {
		return <img src={customer.avatar} alt={customer.name} className={cn('rounded-full object-cover', sz)} />
	}
	return (
		<div className={cn('flex flex-shrink-0 items-center justify-center rounded-full font-semibold text-white', sz, avatarColor(customer.id))}>
			{initials(customer.name)}
		</div>
	)
}

// ─── Simple initials avatar (for merge modal mock contacts) ───────────────────

function SimpleAvatar({ name, colorClass }: { name: string; colorClass: string }) {
	const inits = name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
	return (
		<div className={cn('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-semibold text-white text-sm', colorClass)}>
			{inits}
		</div>
	)
}

// ─── Relative time ────────────────────────────────────────────────────────────

function relTime(ts: number | null): string {
	if (!ts) return '—'
	const diff = Date.now() - ts
	const mins = Math.floor(diff / 60_000)
	if (mins < 60) return mins <= 1 ? 'เมื่อกี้' : `${mins} นาทีที่แล้ว`
	const hrs = Math.floor(diff / 3_600_000)
	if (hrs < 24) return `${hrs} ชม.ที่แล้ว`
	const days = Math.floor(diff / 86_400_000)
	if (days < 30) return `${days} วันที่แล้ว`
	const months = Math.floor(days / 30)
	if (months < 12) return `${months} เดือนที่แล้ว`
	return `${Math.floor(months / 12)} ปีที่แล้ว`
}

// ─── Customer Table View ──────────────────────────────────────────────────────

function CustomerTableView({
	customers,
	onClickCustomer,
	onNavigateToChat,
}: {
	customers: CustomerListItem[]
	onClickCustomer: (id: string) => void
	onNavigateToChat: (id: string) => void
}) {
	return (
		<div className="overflow-x-auto rounded-xl border border-border bg-bg-card shadow-sm">
			<table className="w-full text-left text-sm">
				<thead className="sticky top-0 z-10 border-b border-border bg-bg-input text-xs font-medium uppercase text-t3">
					<tr>
						<th className="px-4 py-3">ลูกค้า</th>
						<th className="px-4 py-3">ช่องทาง</th>
						<th className="px-4 py-3">กลุ่ม</th>
						<th className="px-4 py-3 text-right">ออเดอร์</th>
						<th className="px-4 py-3 text-right">ยอดรวม</th>
						<th className="px-4 py-3">ออเดอร์ล่าสุด</th>
						<th className="px-4 py-3">ข้อความล่าสุด</th>
						<th className="px-4 py-3">ผู้ดูแล</th>
						<th className="px-4 py-3 text-right"></th>
					</tr>
				</thead>
				<tbody className="divide-y divide-border">
					{customers.map((c) => {
						const seg = getSegment(c)
						const primaryChannel = c.channels[0]
						return (
							<tr
								key={c.id}
								className="cursor-pointer transition-colors hover:bg-bg-hover"
								onClick={() => onClickCustomer(c.id)}
							>
								{/* Avatar + name */}
								<td className="px-4 py-3">
									<div className="flex items-center gap-3">
										<AvatarBubble customer={c} />
										<div>
											<div className="font-medium text-t1">{c.name}</div>
											{c.email && <div className="text-xs text-t3">{c.email}</div>}
										</div>
									</div>
								</td>
								{/* Channel */}
								<td className="px-4 py-3">
									{primaryChannel ? (
										<PlatformBadge platform={primaryChannel.platform} />
									) : (
										<span className="text-t3">—</span>
									)}
								</td>
								{/* Segment */}
								<td className="px-4 py-3">
									{seg ? (
										<span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', seg.cls)}>
											{seg.icon} {seg.label}
										</span>
									) : (
										<span className="text-t3 text-xs">—</span>
									)}
								</td>
								{/* Order count */}
								<td className="px-4 py-3 text-right font-medium text-t1">
									{c.orderCount}
								</td>
								{/* Total spent */}
								<td className="px-4 py-3 text-right font-medium text-t1">
									{c.ltv > 0 ? `฿${c.ltv.toLocaleString('th-TH')}` : '—'}
								</td>
								{/* Last order date */}
								<td className="px-4 py-3 text-t2">
									{relTime(c.lastOrderTimestamp)}
								</td>
								{/* Last message date */}
								<td className="px-4 py-3 text-t2">
									{relTime(c.lastActivityTimestamp)}
								</td>
								{/* Assigned agent — placeholder (no agent data on list item) */}
								<td className="px-4 py-3 text-t3 text-xs">—</td>
								{/* Action */}
								<td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
									<Button
										variant="outline"
										onClick={() => onNavigateToChat(c.id)}
										className="h-7 px-2 text-xs"
									>
										ดูแชท
									</Button>
								</td>
							</tr>
						)
					})}
				</tbody>
			</table>
		</div>
	)
}

// ─── View toggle icons ────────────────────────────────────────────────────────

function GridIcon({ className }: { className?: string }) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<rect x="3" y="3" width="7" height="7" />
			<rect x="14" y="3" width="7" height="7" />
			<rect x="3" y="14" width="7" height="7" />
			<rect x="14" y="14" width="7" height="7" />
		</svg>
	)
}

function ListIcon({ className }: { className?: string }) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<line x1="8" y1="6" x2="21" y2="6" />
			<line x1="8" y1="12" x2="21" y2="12" />
			<line x1="8" y1="18" x2="21" y2="18" />
			<line x1="3" y1="6" x2="3.01" y2="6" />
			<line x1="3" y1="12" x2="3.01" y2="12" />
			<line x1="3" y1="18" x2="3.01" y2="18" />
		</svg>
	)
}

// ─── Skeleton grid ────────────────────────────────────────────────────────────

function SkeletonCard() {
	return (
		<div className="flex flex-col gap-3 rounded-xl border border-border bg-bg-card p-4 shadow-sm">
			<div className="flex items-center gap-3">
				<Skeleton className="h-10 w-10 rounded-full" />
				<div className="flex-1 space-y-1.5">
					<Skeleton className="h-3.5 w-28" />
					<Skeleton className="h-2.5 w-16" />
				</div>
			</div>
			<div className="flex gap-2">
				<Skeleton className="h-5 w-14 rounded-full" />
				<Skeleton className="h-5 w-14 rounded-full" />
			</div>
			<Skeleton className="h-12 rounded-lg" />
			<div className="flex gap-2">
				<Skeleton className="h-7 flex-1 rounded-md" />
				<Skeleton className="h-7 flex-1 rounded-md" />
				<Skeleton className="h-7 flex-1 rounded-md" />
			</div>
		</div>
	)
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ search, onAdd }: { search: string; onAdd: () => void }) {
	if (search) {
		return (
			<div className="col-span-full flex flex-col items-center justify-center gap-4 py-20 text-center">
				<div className="flex h-16 w-16 items-center justify-center rounded-full bg-bg-input text-t3">
					<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
						<circle cx="11" cy="11" r="8" />
						<path d="m21 21-4.35-4.35" />
					</svg>
				</div>
				<div>
					<p className="text-sm font-medium text-t1">No customers found for &ldquo;{search}&rdquo;</p>
					<p className="mt-1 text-xs text-t2">Try different search terms or add a new customer.</p>
				</div>
			</div>
		)
	}

	return (
		<div className="col-span-full flex flex-col items-center justify-center gap-4 py-24 text-center">
			<div className="flex h-20 w-20 items-center justify-center rounded-full bg-bg-input text-t3">
				<svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
					<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
					<circle cx="9" cy="7" r="4" />
					<path d="M23 21v-2a4 4 0 0 0-3-3.87" />
					<path d="M16 3.13a4 4 0 0 1 0 7.75" />
				</svg>
			</div>
			<div>
				<p className="text-base font-semibold text-t1">No customers yet</p>
				<p className="mt-1 text-sm text-t2">Add your first customer to get started.</p>
			</div>
			<Button onClick={onAdd}>Add your first customer</Button>
		</div>
	)
}

// ─── Merge Modal Types ────────────────────────────────────────────────────────

interface MergeContact {
	name: string
	platform: string
	email: string
	phone: string
	since: string
	ltv: string
	lineId?: string
	colorClass: string
}

interface DuplicatePair {
	id: string
	primary: MergeContact
	duplicate: MergeContact
	similarity: number
}

const MOCK_DUPLICATE_PAIRS: DuplicatePair[] = [
	{
		id: 'pair-1',
		similarity: 92,
		primary: {
			name: 'สมชาย ใจดี',
			platform: 'line',
			email: 'somchai@example.com',
			phone: '081-234-5678',
			since: '12 ม.ค. 2566',
			ltv: '฿24,500',
			lineId: '@somchai_j',
			colorClass: 'bg-teal-500',
		},
		duplicate: {
			name: 'Somchai Jaidee',
			platform: 'facebook',
			email: 'somchai.j@gmail.com',
			phone: '081-234-5678',
			since: '3 มี.ค. 2566',
			ltv: '฿8,200',
			colorClass: 'bg-blue-500',
		},
	},
	{
		id: 'pair-2',
		similarity: 87,
		primary: {
			name: 'นิดา รักสวย',
			platform: 'instagram',
			email: 'nida.r@hotmail.com',
			phone: '089-876-5432',
			since: '5 เม.ย. 2566',
			ltv: '฿41,000',
			colorClass: 'bg-rose-500',
		},
		duplicate: {
			name: 'Nida Raksawee',
			platform: 'whatsapp',
			email: 'nida.raksawee@gmail.com',
			phone: '089-876-5432',
			since: '18 เม.ย. 2566',
			ltv: '฿3,100',
			colorClass: 'bg-emerald-500',
		},
	},
	{
		id: 'pair-3',
		similarity: 78,
		primary: {
			name: 'John Smith',
			platform: 'email',
			email: 'john.smith@company.com',
			phone: '02-345-6789',
			since: '20 ก.พ. 2566',
			ltv: '฿15,750',
			colorClass: 'bg-indigo-500',
		},
		duplicate: {
			name: 'จอห์น สมิธ',
			platform: 'line',
			email: 'johnsmith.th@gmail.com',
			phone: '02-345-6789',
			since: '2 มี.ค. 2566',
			ltv: '฿9,300',
			lineId: '@john_smith_th',
			colorClass: 'bg-violet-500',
		},
	},
]

// ─── Merge Modal ──────────────────────────────────────────────────────────────

type MergeStep = 'list' | 'pick-fields'

interface FieldChoice {
	name: 'primary' | 'duplicate'
	phone: 'primary' | 'duplicate'
	email: 'primary' | 'duplicate'
	lineId: 'primary' | 'duplicate'
}

function MergeModal({ onClose }: { onClose: () => void }) {
	const [pairs, setPairs] = useState<DuplicatePair[]>(MOCK_DUPLICATE_PAIRS)
	const [step, setStep] = useState<MergeStep>('list')
	const [activePairId, setActivePairId] = useState<string | null>(null)
	const [fieldChoice, setFieldChoice] = useState<FieldChoice>({
		name: 'primary',
		phone: 'primary',
		email: 'primary',
		lineId: 'primary',
	})
	const [successToast, setSuccessToast] = useState(false)

	const activePair = pairs.find((p) => p.id === activePairId) ?? null

	function handleMerge(pairId: string) {
		setActivePairId(pairId)
		setFieldChoice({ name: 'primary', phone: 'primary', email: 'primary', lineId: 'primary' })
		setStep('pick-fields')
	}

	function handleNotDuplicate(pairId: string) {
		setPairs((prev) => prev.filter((p) => p.id !== pairId))
	}

	function handleSkip(pairId: string) {
		setPairs((prev) => prev.filter((p) => p.id !== pairId))
	}

	function handleConfirmMerge() {
		if (!activePairId) return
		setPairs((prev) => prev.filter((p) => p.id !== activePairId))
		setActivePairId(null)
		setStep('list')
		setSuccessToast(true)
		setTimeout(() => setSuccessToast(false), 3000)
	}

	function handleBackToList() {
		setStep('list')
		setActivePairId(null)
	}

	const allDone = pairs.length === 0

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
			<div className="relative flex h-full max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl border border-border bg-bg-card shadow-2xl">
				{/* Header */}
				<div className="flex flex-shrink-0 items-center justify-between border-b border-border px-6 py-4">
					<div className="flex items-center gap-2">
						{step === 'pick-fields' && (
							<button
								type="button"
								onClick={handleBackToList}
								className="mr-1 rounded-lg p-1 text-t3 transition-colors hover:bg-bg-hover hover:text-t1"
							>
								<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
									<path d="m15 18-6-6 6-6" />
								</svg>
							</button>
						)}
						<h2 className="text-lg font-semibold text-t1">
							{step === 'list' ? 'รวมรายชื่อลูกค้าซ้ำ' : 'เลือกข้อมูลหลัก'}
						</h2>
						{step === 'list' && pairs.length > 0 && (
							<span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
								{pairs.length} คู่
							</span>
						)}
					</div>
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg p-1.5 text-t3 transition-colors hover:bg-bg-hover hover:text-t1"
					>
						<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							<path d="M18 6 6 18" />
							<path d="m6 6 12 12" />
						</svg>
					</button>
				</div>

				{/* Body */}
				<div className="flex-1 overflow-y-auto p-6">
					{/* All done state */}
					{allDone && (
						<div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
							<div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
								<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
									<path d="M20 6 9 17l-5-5" />
								</svg>
							</div>
							<div>
								<p className="text-base font-semibold text-t1">✅ ไม่มีรายชื่อซ้ำแล้ว</p>
								<p className="mt-1 text-sm text-t2">ระบบจะแจ้งเตือนเมื่อพบรายชื่อซ้ำใหม่</p>
							</div>
							<Button onClick={onClose}>ปิด</Button>
						</div>
					)}

					{/* Pair list step */}
					{!allDone && step === 'list' && (
						<div className="space-y-4">
							{pairs.map((pair) => (
								<div key={pair.id} className="rounded-xl border border-border bg-bg-card shadow-sm overflow-hidden">
									{/* Similarity badge row */}
									<div className="flex items-center justify-center gap-2 border-b border-border bg-amber-50 px-4 py-2">
										<span className="text-xs font-medium text-amber-700">คล้ายกัน</span>
										<span className="rounded-full bg-amber-200 px-2.5 py-0.5 text-sm font-bold text-amber-800">
											{pair.similarity}%
										</span>
									</div>

									{/* Two contacts side by side */}
									<div className="grid grid-cols-2 divide-x divide-border">
										{/* Primary */}
										<div className="space-y-2 p-4">
											<div className="flex items-center gap-2.5">
												<SimpleAvatar name={pair.primary.name} colorClass={pair.primary.colorClass} />
												<div className="min-w-0">
													<div className="truncate font-semibold text-t1 text-sm">{pair.primary.name}</div>
													<PlatformBadge platform={pair.primary.platform} />
												</div>
											</div>
											<div className="space-y-1 text-xs text-t2">
												<div className="flex items-center gap-1.5">
													<span className="text-t3">✉</span>
													<span className="truncate">{pair.primary.email}</span>
												</div>
												<div className="flex items-center gap-1.5">
													<span className="text-t3">📞</span>
													<span>{pair.primary.phone}</span>
												</div>
												{pair.primary.lineId && (
													<div className="flex items-center gap-1.5">
														<span className="text-t3">LINE</span>
														<span>{pair.primary.lineId}</span>
													</div>
												)}
												<div className="flex items-center gap-1.5">
													<span className="text-t3">ตั้งแต่</span>
													<span>{pair.primary.since}</span>
												</div>
												<div className="flex items-center gap-1.5">
													<span className="text-t3">LTV</span>
													<span className="font-medium text-t1">{pair.primary.ltv}</span>
												</div>
											</div>
										</div>

										{/* Duplicate */}
										<div className="space-y-2 p-4">
											<div className="flex items-center gap-2.5">
												<SimpleAvatar name={pair.duplicate.name} colorClass={pair.duplicate.colorClass} />
												<div className="min-w-0">
													<div className="truncate font-semibold text-t1 text-sm">{pair.duplicate.name}</div>
													<PlatformBadge platform={pair.duplicate.platform} />
												</div>
											</div>
											<div className="space-y-1 text-xs text-t2">
												<div className="flex items-center gap-1.5">
													<span className="text-t3">✉</span>
													<span className="truncate">{pair.duplicate.email}</span>
												</div>
												<div className="flex items-center gap-1.5">
													<span className="text-t3">📞</span>
													<span>{pair.duplicate.phone}</span>
												</div>
												{pair.duplicate.lineId && (
													<div className="flex items-center gap-1.5">
														<span className="text-t3">LINE</span>
														<span>{pair.duplicate.lineId}</span>
													</div>
												)}
												<div className="flex items-center gap-1.5">
													<span className="text-t3">ตั้งแต่</span>
													<span>{pair.duplicate.since}</span>
												</div>
												<div className="flex items-center gap-1.5">
													<span className="text-t3">LTV</span>
													<span className="font-medium text-t1">{pair.duplicate.ltv}</span>
												</div>
											</div>
										</div>
									</div>

									{/* Action buttons */}
									<div className="flex gap-2 border-t border-border px-4 py-3">
										<Button
											className="flex-1 bg-primary text-white hover:opacity-90"
											onClick={() => handleMerge(pair.id)}
										>
											รวมเป็นหนึ่ง
										</Button>
										<Button
											variant="ghost"
											className="flex-1"
											onClick={() => handleNotDuplicate(pair.id)}
										>
											ไม่ใช่ซ้ำกัน
										</Button>
										<Button
											variant="ghost"
											className="flex-1"
											onClick={() => handleSkip(pair.id)}
										>
											ข้าม
										</Button>
									</div>
								</div>
							))}
						</div>
					)}

					{/* Pick fields step */}
					{!allDone && step === 'pick-fields' && activePair && (
						<div className="space-y-4">
							<p className="text-sm text-t2">
								เลือกข้อมูลที่ต้องการเก็บไว้เป็นข้อมูลหลัก หลังการรวม
							</p>

							{/* Field rows */}
							{(
								[
									{ key: 'name' as const, label: 'ชื่อ', primary: activePair.primary.name, duplicate: activePair.duplicate.name },
									{ key: 'phone' as const, label: 'เบอร์โทร', primary: activePair.primary.phone, duplicate: activePair.duplicate.phone },
									{ key: 'email' as const, label: 'อีเมล', primary: activePair.primary.email, duplicate: activePair.duplicate.email },
									{
										key: 'lineId' as const,
										label: 'LINE ID',
										primary: activePair.primary.lineId ?? '—',
										duplicate: activePair.duplicate.lineId ?? '—',
									},
								] satisfies { key: keyof FieldChoice; label: string; primary: string; duplicate: string }[]
							).map(({ key, label, primary, duplicate }) => (
								<div key={key} className="rounded-xl border border-border bg-bg-input p-4">
									<div className="mb-3 text-xs font-semibold uppercase tracking-wide text-t3">{label}</div>
									<div className="space-y-2">
										{/* Primary option */}
										<label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-bg-card px-3 py-2.5 transition-colors hover:bg-bg-hover">
											<input
												type="radio"
												name={`field-${key}`}
												value="primary"
												checked={fieldChoice[key] === 'primary'}
												onChange={() => setFieldChoice((prev) => ({ ...prev, [key]: 'primary' }))}
												className="accent-primary"
											/>
											<div className="min-w-0 flex-1">
												<div className="truncate text-sm font-medium text-t1">{primary}</div>
												<div className="mt-0.5 flex items-center gap-1">
													<PlatformBadge platform={activePair.primary.platform} />
													<span className="text-xs text-t3">(ข้อมูลหลัก)</span>
												</div>
											</div>
										</label>
										{/* Duplicate option */}
										<label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-bg-card px-3 py-2.5 transition-colors hover:bg-bg-hover">
											<input
												type="radio"
												name={`field-${key}`}
												value="duplicate"
												checked={fieldChoice[key] === 'duplicate'}
												onChange={() => setFieldChoice((prev) => ({ ...prev, [key]: 'duplicate' }))}
												className="accent-primary"
											/>
											<div className="min-w-0 flex-1">
												<div className="truncate text-sm font-medium text-t1">{duplicate}</div>
												<div className="mt-0.5 flex items-center gap-1">
													<PlatformBadge platform={activePair.duplicate.platform} />
													<span className="text-xs text-t3">(รายชื่อซ้ำ)</span>
												</div>
											</div>
										</label>
									</div>
								</div>
							))}

							<Button
								className="w-full bg-primary text-white hover:opacity-90"
								onClick={handleConfirmMerge}
							>
								ยืนยันการรวม
							</Button>
						</div>
					)}
				</div>

				{/* Success toast inside modal */}
				{successToast && (
					<div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-gray-800 px-5 py-2.5 text-sm font-medium text-white shadow-lg">
						✅ รวมรายชื่อสำเร็จ
					</div>
				)}
			</div>
		</div>
	)
}

// ─── Custom Fields Tab ────────────────────────────────────────────────────────

interface CustomField {
	id: string
	name: string
	type: 'Text' | 'Number' | 'Date' | 'Dropdown' | 'Checkbox' | 'Textarea'
	required: boolean
}

const INITIAL_CUSTOM_FIELDS: CustomField[] = [
	{ id: 'cf-1', name: 'วันเกิด', type: 'Date', required: false },
	{ id: 'cf-2', name: 'ที่มาลูกค้า', type: 'Dropdown', required: false },
	{ id: 'cf-3', name: 'รหัสสมาชิก', type: 'Text', required: true },
	{ id: 'cf-4', name: 'หมายเหตุ', type: 'Textarea', required: false },
]

const FIELD_TYPES: CustomField['type'][] = ['Text', 'Number', 'Date', 'Dropdown', 'Checkbox', 'Textarea']

function AddFieldModal({ onClose, onSave }: { onClose: () => void; onSave: (field: Omit<CustomField, 'id'>) => void }) {
	const [name, setName] = useState('')
	const [type, setType] = useState<CustomField['type']>('Text')
	const [required, setRequired] = useState(false)

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (!name.trim()) return
		onSave({ name: name.trim(), type, required })
		onClose()
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
			<div className="w-full max-w-sm rounded-2xl border border-border bg-bg-card shadow-2xl">
				<div className="flex items-center justify-between border-b border-border px-5 py-4">
					<h3 className="font-semibold text-t1">เพิ่ม Field ใหม่</h3>
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg p-1 text-t3 transition-colors hover:bg-bg-hover hover:text-t1"
					>
						<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							<path d="M18 6 6 18" />
							<path d="m6 6 12 12" />
						</svg>
					</button>
				</div>
				<form onSubmit={handleSubmit} className="space-y-4 p-5">
					<div className="space-y-1.5">
						<label className="text-xs font-medium text-t2">ชื่อ Field</label>
						<input
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="เช่น วันเกิด, รหัสสมาชิก..."
							className="w-full rounded-lg border border-border bg-bg-input px-3 py-2 text-sm text-t1 placeholder:text-t3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
							required
						/>
					</div>
					<div className="space-y-1.5">
						<label className="text-xs font-medium text-t2">ประเภท</label>
						<select
							value={type}
							onChange={(e) => setType(e.target.value as CustomField['type'])}
							className="w-full rounded-lg border border-border bg-bg-input px-3 py-2 text-sm text-t1 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
						>
							{FIELD_TYPES.map((t) => (
								<option key={t} value={t}>{t}</option>
							))}
						</select>
					</div>
					<div className="flex items-center justify-between rounded-lg border border-border bg-bg-input px-3 py-2.5">
						<span className="text-sm text-t1">Required</span>
						<button
							type="button"
							role="switch"
							aria-checked={required}
							onClick={() => setRequired((r) => !r)}
							className={cn(
								'relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none',
								required ? 'bg-primary' : 'bg-bg-hover',
							)}
						>
							<span
								className={cn(
									'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform',
									required ? 'translate-x-4' : 'translate-x-0',
								)}
							/>
						</button>
					</div>
					<Button type="submit" className="w-full bg-primary text-white hover:opacity-90">
						บันทึก
					</Button>
				</form>
			</div>
		</div>
	)
}

function CustomFieldsTab() {
	const [fields, setFields] = useState<CustomField[]>(INITIAL_CUSTOM_FIELDS)
	const [showAddModal, setShowAddModal] = useState(false)

	function handleSave(field: Omit<CustomField, 'id'>) {
		const id = `cf-${Date.now()}`
		setFields((prev) => [...prev, { id, ...field }])
	}

	function handleDelete(id: string) {
		setFields((prev) => prev.filter((f) => f.id !== id))
	}

	return (
		<div className="space-y-5">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-lg font-semibold text-t1">Custom Fields</h2>
					<p className="mt-0.5 text-sm text-t2">กำหนด field เพิ่มเติมสำหรับข้อมูลลูกค้า</p>
				</div>
				<Button
					onClick={() => setShowAddModal(true)}
					className="bg-primary text-white hover:opacity-90"
				>
					<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
						<path d="M12 5v14" />
						<path d="M5 12h14" />
					</svg>
					เพิ่ม Field ใหม่
				</Button>
			</div>

			{/* Table */}
			<div className="overflow-x-auto rounded-xl border border-border bg-bg-card shadow-sm">
				<table className="w-full text-left text-sm">
					<thead className="border-b border-border bg-bg-input text-xs font-medium uppercase text-t3">
						<tr>
							<th className="px-4 py-3">ชื่อ Field</th>
							<th className="px-4 py-3">ประเภท</th>
							<th className="px-4 py-3">Required</th>
							<th className="px-4 py-3 text-right">Actions</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-border">
						{fields.map((field) => (
							<tr key={field.id} className="transition-colors hover:bg-bg-hover">
								<td className="px-4 py-3 font-medium text-t1">{field.name}</td>
								<td className="px-4 py-3">
									<span className="rounded-md bg-bg-input px-2 py-0.5 text-xs font-medium text-t2">
										{field.type}
									</span>
								</td>
								<td className="px-4 py-3">
									{field.required ? (
										<span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
											<span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
											Yes
										</span>
									) : (
										<span className="text-xs text-t3">No</span>
									)}
								</td>
								<td className="px-4 py-3 text-right">
									<button
										type="button"
										onClick={() => handleDelete(field.id)}
										className="rounded-md px-2 py-1 text-xs text-t3 transition-colors hover:bg-red-50 hover:text-red-600"
									>
										ลบ
									</button>
								</td>
							</tr>
						))}
						{fields.length === 0 && (
							<tr>
								<td colSpan={4} className="px-4 py-10 text-center text-sm text-t3">
									ยังไม่มี Custom Fields — กด &quot;เพิ่ม Field ใหม่&quot; เพื่อเริ่มต้น
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>

			{showAddModal && (
				<AddFieldModal
					onClose={() => setShowAddModal(false)}
					onSave={handleSave}
				/>
			)}
		</div>
	)
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function CustomerPage() {
	const navigate = useNavigate()
	const [segment, setSegment] = useState('All')
	const [search, setSearch] = useState('')
	const [sort, setSort] = useState('recent')
	const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
	const [showAddPanel, setShowAddPanel] = useState(false)
	const [addInitialName, setAddInitialName] = useState<string | undefined>(undefined)
	const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>(EMPTY_FILTERS)
	const [viewMode, setViewMode] = useState<'table' | 'card'>(getSavedView)

	// Main tab: 'customers' | 'custom-fields'
	const [activeMainTab, setActiveMainTab] = useState<'customers' | 'custom-fields'>('customers')

	// Merge / dedup state
	const [showMergeBanner, setShowMergeBanner] = useState(true)
	const [showMergeModal, setShowMergeModal] = useState(false)

	function switchView(mode: 'table' | 'card') {
		setViewMode(mode)
		try { localStorage.setItem(VIEW_PREF_KEY, mode) } catch { /* ignore */ }
	}

	// Selection mode
	const [isSelectionMode, setIsSelectionMode] = useState(false)
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
	const [showBulkFollowupSheet, setShowBulkFollowupSheet] = useState(false)

	function toggleSelectionMode() {
		setIsSelectionMode((prev) => {
			if (prev) setSelectedIds(new Set())
			return !prev
		})
	}

	function toggleSelectCustomer(id: string) {
		setSelectedIds((prev) => {
			const next = new Set(prev)
			if (next.has(id)) {
				next.delete(id)
			} else {
				next.add(id)
			}
			return next
		})
	}

	function handleBulkFollowupSuccess() {
		setIsSelectionMode(false)
		setSelectedIds(new Set())
	}

	// Snooze
	const snooze = useSnoozeCustomer()
	const [snoozeToastVisible, setSnoozeToastVisible] = useState(false)

	function handleSnooze(customerId: string) {
		snooze.mutate(customerId, {
			onSuccess: () => {
				setSnoozeToastVisible(true)
				setTimeout(() => setSnoozeToastVisible(false), 3000)
			},
		})
	}

	// Follow-up from swipe — opens ChatDraftModal via BulkFollowupSheet with 1 customer
	const [swipeFollowupCustomerId, setSwipeFollowupCustomerId] = useState<string | null>(null)

	// Infinite query
	const { data, isLoading, isError, isFetchingNextPage, fetchNextPage, hasNextPage } = useCustomers({
		segment,
		search,
		sort,
	})

	// Segment counts for filter chips
	const { data: counts } = useSegmentCounts()

	const customers = data?.pages.flatMap((p) => p.data) ?? []
	const isEmpty = !isLoading && !isError && customers.length === 0

	// IntersectionObserver sentinel for infinite scroll
	const sentinelRef = useRef<HTMLDivElement>(null)
	useEffect(() => {
		if (!hasNextPage) return
		const sentinel = sentinelRef.current
		if (!sentinel) return

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting && !isFetchingNextPage) {
					fetchNextPage()
				}
			},
			{ rootMargin: '200px' },
		)
		observer.observe(sentinel)
		return () => observer.disconnect()
	}, [hasNextPage, isFetchingNextPage, fetchNextPage])

	const handleCardClick = useCallback((id: string) => {
		setSelectedCustomerId((prev) => (prev === id ? null : id))
	}, [])

	function openAddPanel(initialName?: string) {
		setAddInitialName(initialName)
		setShowAddPanel(true)
	}

	return (
		<div className="mx-auto max-w-7xl space-y-5 pb-20">
			{/* Tab bar + page header row */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-1 rounded-xl border border-border bg-bg-input p-1">
					<button
						type="button"
						onClick={() => setActiveMainTab('customers')}
						className={cn(
							'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
							activeMainTab === 'customers'
								? 'bg-bg-card text-primary shadow-sm'
								: 'text-t2 hover:text-t1',
						)}
					>
						ลูกค้า
					</button>
					<button
						type="button"
						onClick={() => setActiveMainTab('custom-fields')}
						className={cn(
							'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
							activeMainTab === 'custom-fields'
								? 'bg-bg-card text-primary shadow-sm'
								: 'text-t2 hover:text-t1',
						)}
					>
						Custom Fields
					</button>
				</div>

				{/* Right-side controls — only shown on customers tab */}
				{activeMainTab === 'customers' && (
					<div className="flex items-center gap-2">
						{/* View toggle buttons */}
						<div className="flex items-center rounded-lg border border-border bg-bg-input p-0.5">
							<button
								type="button"
								onClick={() => switchView('table')}
								className={cn(
									'rounded-md p-1.5 transition-colors',
									viewMode === 'table'
										? 'bg-bg-card text-primary shadow-sm'
										: 'text-t3 hover:text-t1',
								)}
								title="Table view"
							>
								<ListIcon className="h-4 w-4" />
							</button>
							<button
								type="button"
								onClick={() => switchView('card')}
								className={cn(
									'rounded-md p-1.5 transition-colors',
									viewMode === 'card'
										? 'bg-bg-card text-primary shadow-sm'
										: 'text-t3 hover:text-t1',
								)}
								title="Card view"
							>
								<GridIcon className="h-4 w-4" />
							</button>
						</div>
						{/* Selection mode toolbar — shows "Select" toggle or active selection controls */}
						<SelectionModeToolbar
							isSelectionMode={isSelectionMode}
							selectedCount={selectedIds.size}
							onToggleSelectionMode={toggleSelectionMode}
							onFollowup={() => setShowBulkFollowupSheet(true)}
						/>
						{/* "+ Add Customer" button — desktop only, hidden in selection mode */}
						{!isSelectionMode && (
							<Button
								onClick={() => openAddPanel()}
								className="hidden md:inline-flex"
							>
								<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
									<path d="M12 5v14" />
									<path d="M5 12h14" />
								</svg>
								Add Customer
							</Button>
						)}
					</div>
				)}
			</div>

			{/* ── Custom Fields tab content ── */}
			{activeMainTab === 'custom-fields' && <CustomFieldsTab />}

			{/* ── Customers tab content ── */}
			{activeMainTab === 'customers' && (
				<>
					{/* KPI Snapshot bar */}
					<KpiSnapshotBar />

					{/* Merge contacts banner */}
					{showMergeBanner && (
						<div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
							<div className="flex items-center gap-2 text-sm text-amber-800">
								<span className="text-base">⚠️</span>
								<span>พบ 3 ลูกค้าที่อาจซ้ำกัน —</span>
								<button
									type="button"
									onClick={() => setShowMergeModal(true)}
									className="font-semibold text-amber-900 underline underline-offset-2 hover:no-underline"
								>
									ดูและรวม →
								</button>
							</div>
							<button
								type="button"
								onClick={() => setShowMergeBanner(false)}
								className="ml-4 rounded-md p-1 text-amber-600 transition-colors hover:bg-amber-100 hover:text-amber-900"
								aria-label="ปิด"
							>
								<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
									<path d="M18 6 6 18" />
									<path d="m6 6 12 12" />
								</svg>
							</button>
						</div>
					)}

					{/* Filter chips */}
					<FilterChips
						counts={counts ?? EMPTY_COUNTS}
						selected={segment}
						onSelect={(s) => {
							setSegment(s)
							setSelectedCustomerId(null)
						}}
					/>

					{/* Search + Sort + Advanced Filters row */}
					<div className="flex gap-3">
						<div className="flex-1">
							<CustomerSearch
								value={search}
								onChange={setSearch}
								showAddNew={isEmpty && !!search}
								onAddNew={(name) => openAddPanel(name)}
							/>
						</div>
						<SortDropdown value={sort} onChange={setSort} />
						<AdvancedFilterPanel
							filters={advancedFilters}
							onApply={setAdvancedFilters}
							onClear={() => setAdvancedFilters(EMPTY_FILTERS)}
						/>
					</div>

					{/* Active advanced filter chips */}
					<ActiveFilterChips
						filters={advancedFilters}
						onRemove={(key, value) => {
							setAdvancedFilters((prev) => {
								const next = { ...prev }
								if (key === 'segment' && value) {
									next.segments = next.segments.filter((s) => s !== value)
								} else if (key === 'channel' && value) {
									next.channels = next.channels.filter((c) => c !== value)
								} else if (key === 'dateRange') {
									next.dateRange = null
								} else if (key === 'ltvMin') {
									next.ltvMin = null
								} else if (key === 'ltvMax') {
									next.ltvMax = null
								} else if (key === 'tagSearch') {
									next.tagSearch = ''
								}
								return next
							})
						}}
					/>

					{/* Error state */}
					{isError && (
						<div className="rounded-md border border-error bg-error-bg p-4 text-sm text-error">
							Failed to load customers.{' '}
							<button
								type="button"
								className="underline hover:no-underline"
								onClick={() => window.location.reload()}
							>
								Retry
							</button>
						</div>
					)}

					{/* Table view */}
					{viewMode === 'table' && !isLoading && !isEmpty && (
						<CustomerTableView
							customers={customers}
							onClickCustomer={handleCardClick}
							onNavigateToChat={(id) =>
								navigate({ to: '/customer/$customerId', params: { customerId: id } })
							}
						/>
					)}

					{/* Table loading skeleton */}
					{viewMode === 'table' && isLoading && (
						<div className="overflow-x-auto rounded-xl border border-border bg-bg-card shadow-sm">
							<div className="divide-y divide-border">
								{Array.from({ length: 6 }).map((_, i) => (
									<div key={i} className="flex items-center gap-4 px-4 py-3">
										<Skeleton className="h-9 w-9 rounded-full" />
										<Skeleton className="h-3.5 w-36" />
										<Skeleton className="ml-auto h-3.5 w-20" />
									</div>
								))}
							</div>
						</div>
					)}

					{/* Card grid */}
					{viewMode === 'card' && (
						<div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
							{/* Loading skeletons */}
							{isLoading &&
								Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}

							{/* Cards */}
							{!isLoading &&
								customers.map((customer) => {
									const card = (
										<CustomerCard
											key={customer.id}
											customer={customer}
											onClick={() => handleCardClick(customer.id)}
											onNavigateToProfile={(id) =>
												navigate({ to: '/customer/$customerId', params: { customerId: id } })
											}
											isSelectionMode={isSelectionMode}
											isSelected={selectedIds.has(customer.id)}
											onToggleSelect={toggleSelectCustomer}
										/>
									)

									if (isSelectionMode) {
										// No context menu / long-press in selection mode
										return card
									}

									const wrappedCard = (
										<SwipeableCard
											key={`swipe-${customer.id}`}
											customerId={customer.id}
											onFollowup={() => setSwipeFollowupCustomerId(customer.id)}
											onChat={() =>
												navigate({ to: '/customer/$customerId', params: { customerId: customer.id } })
											}
											onSnooze={() => handleSnooze(customer.id)}
										>
											{card}
										</SwipeableCard>
									)

									return (
										// Desktop: right-click context menu
										// Mobile: long-press bottom sheet (intercepts click capture to suppress after long-press)
										//         + swipe actions
										<CustomerContextMenu key={customer.id} customer={customer}>
											<CustomerLongPressSheet customer={customer}>
												{wrappedCard}
											</CustomerLongPressSheet>
										</CustomerContextMenu>
									)
								})}

							{/* Empty state (spans all cols) */}
							{isEmpty && (
								<EmptyState search={search} onAdd={() => openAddPanel()} />
							)}
						</div>
					)}

					{/* Empty state for table view */}
					{viewMode === 'table' && isEmpty && (
						<div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
							<EmptyState search={search} onAdd={() => openAddPanel()} />
						</div>
					)}

					{/* Infinite scroll sentinel */}
					<div ref={sentinelRef} className="h-4" aria-hidden="true" />

					{/* Fetching next page indicator */}
					{isFetchingNextPage && (
						<div className="mt-4 flex justify-center">
							<div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
						</div>
					)}
				</>
			)}

			{/* Customer detail modal */}
			<CustomerDetailModal
				customerId={selectedCustomerId}
				onClose={() => setSelectedCustomerId(null)}
			/>

			{/* Add customer panel */}
			<AddCustomerPanel
				open={showAddPanel}
				onOpenChange={setShowAddPanel}
				initialName={addInitialName}
			/>

			{/* Mobile FAB — hidden in selection mode, only on customers tab */}
			{!isSelectionMode && activeMainTab === 'customers' && (
				<FloatingActionButton onClick={() => openAddPanel()} />
			)}

			{/* Bulk follow-up sheet (from selection mode) */}
			<BulkFollowupSheet
				open={showBulkFollowupSheet}
				onOpenChange={setShowBulkFollowupSheet}
				customerIds={Array.from(selectedIds)}
				onSuccess={handleBulkFollowupSuccess}
			/>

			{/* Follow-up sheet triggered by swipe action (single customer) */}
			<BulkFollowupSheet
				open={swipeFollowupCustomerId !== null}
				onOpenChange={(open) => { if (!open) setSwipeFollowupCustomerId(null) }}
				customerIds={swipeFollowupCustomerId ? [swipeFollowupCustomerId] : []}
				onSuccess={() => setSwipeFollowupCustomerId(null)}
			/>

			{/* Snooze toast */}
			{snoozeToastVisible && (
				<div
					className={cn(
						'fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-full bg-gray-800 px-4 py-2 text-sm text-white shadow-lg',
						'animate-in fade-in-0 slide-in-from-bottom-2',
					)}
					role="status"
				>
					Snoozed for 24 hours
				</div>
			)}

			{/* Merge Modal */}
			{showMergeModal && (
				<MergeModal onClose={() => setShowMergeModal(false)} />
			)}
		</div>
	)
}
