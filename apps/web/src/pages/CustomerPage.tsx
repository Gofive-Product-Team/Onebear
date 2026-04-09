import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { cn } from '@one-bear/ui'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { useCustomers, useSegmentCounts, type SegmentCounts, type CustomerListItem } from '@/api/useCustomers'
import { CustomerDetailModal } from '@/components/customer/CustomerDetailModal'
import { FilterChips } from '@/components/customer/FilterChips'
import { SortDropdown } from '@/components/customer/SortDropdown'
import { CustomerSearch } from '@/components/customer/CustomerSearch'
import { AddCustomerPanel } from '@/components/customer/AddCustomerPanel'
import { FloatingActionButton } from '@/components/customer/FloatingActionButton'
import { KpiSnapshotBar } from '@/components/customer/KpiSnapshotBar'
import {
	AdvancedFilterPanel,
	ActiveFilterChips,
	EMPTY_FILTERS,
	type AdvancedFilters,
} from '@/components/customer/AdvancedFilterPanel'

// ─── Empty segment counts fallback ────────────────────────────────────────────

const EMPTY_COUNTS: SegmentCounts = { all: 0, hot: 0, vip: 0, atRisk: 0, new: 0, cold: 0, organization: 0, repeat: 0, churned: 0 }

// ─── Lead types ───────────────────────────────────────────────────────────────

interface LeadItem {
	id: string
	name: string
	phone: string | null
	email: string | null
	channels: { platform: string; displayName: string }[]
	status: string
	lastMessagePreview: string | null
	lastActivityTimestamp: number | null
	assignedAgentId: string | null
	assignedAgentName: string | null
	tags: { name: string; isAiAssigned: boolean }[]
	createdTimestamp: number
}

const LEAD_STATUS_CONFIG: Record<string, { label: string; bar: string; dot: string }> = {
	'New':            { label: 'New',           bar: 'bg-yellow-400', dot: 'bg-yellow-400' },
	'Contacted':      { label: 'Contacted',     bar: 'bg-blue-500',   dot: 'bg-blue-500'   },
	'Interested':     { label: 'Interested',    bar: 'bg-green-500',  dot: 'bg-green-500'  },
	'Followed-up':    { label: 'ติดตามแล้ว',   bar: 'bg-teal-500',   dot: 'bg-teal-500'   },
	'Not Interested': { label: 'ไม่สนใจ',      bar: 'bg-gray-400',   dot: 'bg-gray-400'   },
}

const LEAD_STATUSES = ['All', 'New', 'Contacted', 'Interested', 'Followed-up', 'Not Interested']

// Mock lead data (self-contained — backend integration in next sprint)
const MOCK_LEADS: LeadItem[] = [
	{ id: 'pr1', name: 'อารีย์ สุขใจ', phone: '086-111-2233', email: null, channels: [{ platform: 'LINE', displayName: 'ary_sukjai' }], status: 'New', lastMessagePreview: 'สวัสดีค่ะ สนใจสินค้า', lastActivityTimestamp: Date.now() - 300000, assignedAgentId: null, assignedAgentName: null, tags: [], createdTimestamp: Date.now() - 3600000 },
	{ id: 'pr2', name: 'Tanawat K.', phone: null, email: 'tanawat@email.com', channels: [{ platform: 'Facebook', displayName: 'Tanawat K.' }], status: 'Contacted', lastMessagePreview: 'ราคาเท่าไรครับ?', lastActivityTimestamp: Date.now() - 1800000, assignedAgentId: 'u1', assignedAgentName: 'สมชาย ใจดี', tags: [], createdTimestamp: Date.now() - 7200000 },
	{ id: 'pr3', name: 'ปิยะ วงศ์ดี', phone: '089-333-4455', email: null, channels: [{ platform: 'Instagram', displayName: 'piyawong_d' }], status: 'Interested', lastMessagePreview: 'อยากสั่งซื้อค่ะ มีส่วนลดไหม', lastActivityTimestamp: Date.now() - 3600000, assignedAgentId: 'u1', assignedAgentName: 'สมชาย ใจดี', tags: [{ name: 'สนใจ', isAiAssigned: true }], createdTimestamp: Date.now() - 86400000 },
	{ id: 'pr4', name: 'Somsri T.', phone: '081-555-6677', email: null, channels: [{ platform: 'LINE', displayName: 'somsri_t' }], status: 'Followed-up', lastMessagePreview: 'ติดต่อกลับหน่อยนะคะ', lastActivityTimestamp: Date.now() - 86400000, assignedAgentId: 'u2', assignedAgentName: 'วิไล รักษา', tags: [], createdTimestamp: Date.now() - 86400000 * 2 },
	{ id: 'pr5', name: 'นคร เพชรดี', phone: null, email: 'nakorn@email.com', channels: [{ platform: 'WhatsApp', displayName: 'Nakorn' }], status: 'Not Interested', lastMessagePreview: 'ขอบคุณครับ ไม่สนใจแล้ว', lastActivityTimestamp: Date.now() - 86400000 * 3, assignedAgentId: null, assignedAgentName: null, tags: [], createdTimestamp: Date.now() - 86400000 * 5 },
	{ id: 'pr6', name: 'มาลี ดอกไม้', phone: '083-777-8899', email: null, channels: [{ platform: 'LINE', displayName: 'mali_flower' }], status: 'New', lastMessagePreview: 'สินค้ามีสีอะไรบ้างคะ?', lastActivityTimestamp: Date.now() - 600000, assignedAgentId: null, assignedAgentName: null, tags: [], createdTimestamp: Date.now() - 1800000 },
	{ id: 'pr7', name: 'Krit N.', phone: '087-000-1234', email: null, channels: [{ platform: 'Facebook', displayName: 'Krit N.' }], status: 'Contacted', lastMessagePreview: 'ขอบคุณสำหรับข้อมูลครับ', lastActivityTimestamp: Date.now() - 10800000, assignedAgentId: 'u2', assignedAgentName: 'วิไล รักษา', tags: [], createdTimestamp: Date.now() - 86400000 },
]

// Convert LeadItem to CustomerDetail shape for CustomerDetailModal
function leadToCustomerDetail(lead: LeadItem): import('@/api/useCustomers').CustomerDetail {
	return {
		id: lead.id,
		customerType: 'Lead',
		name: lead.name,
		email: lead.email,
		phone: lead.phone,
		avatar: null,
		addresses: [],
		channels: lead.channels,
		tags: lead.tags,
		ltv: 0,
		orderCount: 0,
		aov: 0,
		lastOrderTimestamp: null,
		lastActivityTimestamp: lead.lastActivityTimestamp,
		lastMessagePreview: lead.lastMessagePreview,
		pinnedNote: null,
		isAtRisk: false,
		daysSinceLastPurchase: null,
		suggestedAction: null,
		suggestedActionType: null,
		nationalId: null,
		taxId: null,
		pinnedNoteBy: null,
		pinnedNoteTimestamp: null,
		organizationId: null,
		contactIds: [],
		isPromoted: false,
		promotedTimestamp: null,
		createdTimestamp: lead.createdTimestamp,
		updatedTimestamp: null,
	}
}

// ─── Lead KPI bar ─────────────────────────────────────────────────────────────

function LeadKpiBar({ leads }: { leads: LeadItem[] }) {
	const total = leads.length
	const newCount = leads.filter(l => l.status === 'New').length
	const interestedCount = leads.filter(l => l.status === 'Interested').length
	const followedUpCount = leads.filter(l => l.status === 'Followed-up').length
	const notInterestedCount = leads.filter(l => l.status === 'Not Interested').length

	const stats = [
		{ label: 'ทั้งหมด',    value: total,              accent: 'default' as const },
		{ label: 'ใหม่',        value: newCount,           accent: 'blue'    as const },
		{ label: 'สนใจ',        value: interestedCount,    accent: 'green'   as const },
		{ label: 'ติดตามแล้ว', value: followedUpCount,    accent: 'default' as const },
		{ label: 'ไม่สนใจ',    value: notInterestedCount, accent: 'red'     as const },
	]

	return (
		<div className="flex gap-3 overflow-x-auto pb-1 md:overflow-x-visible">
			{stats.map(s => (
				<div
					key={s.label}
					className={cn(
						'flex min-w-[110px] shrink-0 flex-col items-center justify-center rounded-lg border px-4 py-2.5',
						s.accent === 'red'     && 'border-red-200 bg-red-50',
						s.accent === 'green'   && 'border-green-200 bg-green-50',
						s.accent === 'blue'    && 'border-blue-200 bg-blue-50',
						s.accent === 'default' && 'border-border bg-bg-card',
					)}
				>
					<p className={cn(
						'text-base font-bold',
						s.accent === 'red'     && 'text-red-700',
						s.accent === 'green'   && 'text-green-700',
						s.accent === 'blue'    && 'text-blue-700',
						s.accent === 'default' && 'text-t1',
					)}>
						{s.value}
					</p>
					<p className="mt-0.5 text-[11px] text-t3">{s.label}</p>
				</div>
			))}
		</div>
	)
}

// ─── Lead List View ───────────────────────────────────────────────────────────

function LeadListView({ onAddLead }: { onAddLead: () => void }) {
	const [statusFilter, setStatusFilter] = useState('All')
	const [search, setSearch] = useState('')
	const [sort, setSort] = useState('recent')
	const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>(EMPTY_FILTERS)
	const [selectedLead, setSelectedLead] = useState<LeadItem | null>(null)
	const [leads, setLeads] = useState<LeadItem[]>(MOCK_LEADS)

	// Status counts
	const counts = LEAD_STATUSES.reduce((acc, s) => {
		acc[s] = s === 'All' ? leads.length : leads.filter(p => p.status === s).length
		return acc
	}, {} as Record<string, number>)

	const filtered = leads
		.filter(p => {
			const matchStatus = statusFilter === 'All' || p.status === statusFilter
			const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.phone?.includes(search)
			const matchChannel = advancedFilters.channels.length === 0 ||
				p.channels.some(c => advancedFilters.channels.includes(c.platform))
			const matchTag = !advancedFilters.tagSearch ||
				p.tags.some(t => t.name.toLowerCase().includes(advancedFilters.tagSearch.toLowerCase()))
			const matchDate = !advancedFilters.dateRange || (() => {
				const days = advancedFilters.dateRange === '7d' ? 7 : advancedFilters.dateRange === '30d' ? 30 : 90
				return p.lastActivityTimestamp !== null && p.lastActivityTimestamp >= Date.now() - days * 86400000
			})()
			return matchStatus && matchSearch && matchChannel && matchTag && matchDate
		})
		.sort((a, b) => {
			if (sort === 'name') return a.name.localeCompare(b.name, 'th')
			if (sort === 'newest') return b.createdTimestamp - a.createdTimestamp
			// 'recent' (default)
			return (b.lastActivityTimestamp ?? 0) - (a.lastActivityTimestamp ?? 0)
		})

	function handleConvert(id: string) {
		setLeads(prev => prev.filter(p => p.id !== id))
		setSelectedLead(null)
	}

	const leadInitials = (name: string) => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
	const avatarBg = (id: string) => {
		const colors = ['bg-violet-500', 'bg-indigo-500', 'bg-blue-500', 'bg-teal-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500']
		let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) | 0
		return colors[Math.abs(h) % colors.length]
	}

	return (
		<>
			<div className="space-y-4">
				{/* KPI bar — matches Customer tab's KpiSnapshotBar */}
				<LeadKpiBar leads={leads} />

				{/* Status filter chips */}
				<div className="flex gap-1.5 overflow-x-auto pb-2" role="tablist" style={{ scrollbarWidth: 'none' }}>
					{LEAD_STATUSES.map(s => {
						const cfg = s === 'All' ? null : LEAD_STATUS_CONFIG[s]
						const isActive = statusFilter === s
						const label = s === 'All' ? 'ทั้งหมด' : (cfg?.label ?? s)
						return (
							<button
								key={s}
								type="button"
								role="tab"
								aria-selected={isActive}
								onClick={() => setStatusFilter(s)}
								className={cn(
									'flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
									'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
									isActive
										? 'border-primary bg-primary text-white shadow-sm'
										: 'border-border bg-bg-card text-t2 hover:border-primary/50 hover:text-t1',
								)}
							>
								{cfg && <span className={cn('h-2 w-2 shrink-0 rounded-full', isActive ? 'bg-white/70' : cfg.dot)} />}
								{label}
								<span className={cn(
									'rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums',
									isActive ? 'bg-white/20 text-white' : 'bg-bg-input text-t3',
								)}>
									{counts[s] ?? 0}
								</span>
							</button>
						)
					})}
				</div>

				{/* Search + Sort + Filter */}
				<div className="flex gap-3">
					<div className="relative flex-1">
						<svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-t3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							<circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
						</svg>
						<input
							type="text"
							value={search}
							onChange={e => setSearch(e.target.value)}
							placeholder="ค้นหาชื่อหรือเบอร์โทร..."
							className="h-9 w-full rounded-md border border-border-input bg-bg-input py-2 pl-9 pr-8 text-sm text-t1 shadow-sm placeholder:text-t3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
						/>
						{search && (
							<button
								type="button"
								onClick={() => setSearch('')}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-t3 hover:text-t1"
							>
								<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
									<path d="M18 6 6 18" /><path d="m6 6 12 12" />
								</svg>
							</button>
						)}
					</div>
					<SortDropdown value={sort} onChange={setSort} variant="lead" />
					<AdvancedFilterPanel
						filters={advancedFilters}
						onApply={setAdvancedFilters}
						onClear={() => setAdvancedFilters(EMPTY_FILTERS)}
						variant="lead"
					/>
				</div>

				{/* Active filter chips */}
				<ActiveFilterChips
					filters={advancedFilters}
					onRemove={(key, value) => {
						setAdvancedFilters((prev) => {
							const next = { ...prev }
							if (key === 'channel' && value) {
								next.channels = next.channels.filter((c) => c !== value)
							} else if (key === 'dateRange') {
								next.dateRange = null
							} else if (key === 'tagSearch') {
								next.tagSearch = ''
							}
							return next
						})
					}}
				/>

				{/* Table */}
				<div className="overflow-x-auto rounded-xl border border-border bg-bg-card shadow-sm">
					<table className="w-full text-left text-sm">
						<thead className="sticky top-0 z-10 border-b border-border bg-bg-input text-xs font-medium uppercase text-t3">
							<tr>
								<th className="px-4 py-3">ชื่อ</th>
								<th className="px-4 py-3">เบอร์โทร</th>
								<th className="px-4 py-3">ช่องทาง</th>
								<th className="px-4 py-3">สถานะ</th>
								<th className="px-4 py-3">ข้อความล่าสุด</th>
								<th className="px-4 py-3">ผู้ดูแล</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border">
							{filtered.length === 0 ? (
								<tr>
									<td colSpan={6} className="px-4 py-16 text-center">
										<div className="flex flex-col items-center gap-2">
											<div className="flex h-12 w-12 items-center justify-center rounded-full bg-bg-input text-2xl">🎯</div>
											<p className="text-sm font-medium text-t2">ไม่พบผู้สนใจในสถานะนี้</p>
											<p className="text-xs text-t3">ลองเปลี่ยน filter หรือคำค้นหา</p>
										</div>
									</td>
								</tr>
							) : filtered.map(p => {
								const cfg = LEAD_STATUS_CONFIG[p.status] ?? LEAD_STATUS_CONFIG['New']
								const channel = p.channels[0]
								return (
									<tr
										key={p.id}
										className={cn(
											'cursor-pointer transition-colors hover:bg-bg-hover',
											selectedLead?.id === p.id && 'bg-primary/5',
										)}
										onClick={() => setSelectedLead(prev => prev?.id === p.id ? null : p)}
									>
										<td className="px-4 py-3">
											<div className="flex items-center gap-3">
												<div className={cn('flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white', avatarBg(p.id))}>
													{leadInitials(p.name)}
												</div>
												<span className="font-medium text-t1">{p.name}</span>
											</div>
										</td>
										<td className="px-4 py-3 text-t2">{p.phone ?? <span className="text-t3">—</span>}</td>
										<td className="px-4 py-3">
											{channel ? <PlatformBadge platform={channel.platform} /> : <span className="text-t3">—</span>}
										</td>
										<td className="px-4 py-3">
											<span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium', cfg.color)}>
												<span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
												{cfg.label}
											</span>
										</td>
										<td className="max-w-[200px] px-4 py-3">
											<div className="truncate text-t2 text-xs">{p.lastMessagePreview ?? '—'}</div>
											<div className="text-[11px] text-t3">{relTime(p.lastActivityTimestamp)}</div>
										</td>
										<td className="px-4 py-3 text-xs text-t2">{p.assignedAgentName ?? <span className="text-t3">—</span>}</td>
									</tr>
								)
							})}
						</tbody>
					</table>
				</div>
			</div>

			{/* Lead detail — reuses CustomerDetailModal with lead data */}
			{selectedLead && (
				<CustomerDetailModal
					customerId={null}
					initialData={leadToCustomerDetail(selectedLead)}
					leadStatus={selectedLead.status}
					onConvertLead={handleConvert}
					onClose={() => setSelectedLead(null)}
				/>
			)}
		</>
	)
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
	// Main tab: 'leads' | 'customers'
	const [activeMainTab, setActiveMainTab] = useState<'leads' | 'customers'>('leads')

	// Merge / dedup state
	const [showMergeBanner, setShowMergeBanner] = useState(true)
	const [showMergeModal, setShowMergeModal] = useState(false)

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
						onClick={() => setActiveMainTab('leads')}
						className={cn(
							'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
							activeMainTab === 'leads'
								? 'bg-bg-card text-primary shadow-sm'
								: 'text-t2 hover:text-t1',
						)}
					>
						🎯 ผู้สนใจ
					</button>
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
				</div>

				{/* Right-side controls */}
				<div className="flex items-center gap-2">
					{activeMainTab === 'leads' && (
						<Button onClick={() => setShowAddPanel(true)}>
							<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
								<path d="M12 5v14" /><path d="M5 12h14" />
							</svg>
							เพิ่มผู้สนใจ
						</Button>
					)}
					{activeMainTab === 'customers' && (
						<Button onClick={() => openAddPanel()}>
							<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
								<path d="M12 5v14" /><path d="M5 12h14" />
							</svg>
							เพิ่มลูกค้า
						</Button>
					)}
				</div>
			</div>

			{/* ── Leads tab content ── */}
			{activeMainTab === 'leads' && (
				<LeadListView onAddLead={() => setShowAddPanel(true)} />
			)}

			{/* ── Customers tab content ── */}
			{activeMainTab === 'customers' && (
				<>
					{/* KPI Snapshot bar */}
					<KpiSnapshotBar />

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
						<SortDropdown value={sort} onChange={setSort} variant="customer" />
						<AdvancedFilterPanel
							variant="customer"
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
								if (key === 'channel' && value) {
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
					{!isLoading && !isEmpty && (
						<CustomerTableView
							customers={customers}
							onClickCustomer={handleCardClick}
							onNavigateToChat={(id) =>
								navigate({ to: '/customer/$customerId', params: { customerId: id } })
							}
						/>
					)}

					{/* Table loading skeleton */}
					{isLoading && (
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

					{/* Empty state */}
					{isEmpty && (
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

			{/* Add customer / lead panel */}
			<AddCustomerPanel
				open={showAddPanel}
				onOpenChange={setShowAddPanel}
				initialName={addInitialName}
				isLead={activeMainTab === 'leads'}
			/>

			{/* Mobile FAB — only on customers tab */}
			{activeMainTab === 'customers' && (
				<FloatingActionButton onClick={() => openAddPanel()} />
			)}

			{/* Merge Modal */}
			{showMergeModal && (
				<MergeModal onClose={() => setShowMergeModal(false)} />
			)}
		</div>
	)
}
