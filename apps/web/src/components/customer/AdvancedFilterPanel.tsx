import { useState } from 'react'
import { cn } from '@one-bear/ui'

const CHANNEL_OPTIONS = ['LINE', 'Facebook', 'Instagram', 'WhatsApp', 'Email', 'TikTok', 'Lazada', 'Shopee']

const DATE_PRESETS = [
	{ label: '7 วันล่าสุด', value: '7d' },
	{ label: '30 วันล่าสุด', value: '30d' },
	{ label: '90 วันล่าสุด', value: '90d' },
]

export interface AdvancedFilters {
	channels: string[]
	dateRange: string | null
	ltvMin: number | null
	ltvMax: number | null
	tagSearch: string
}

export const EMPTY_FILTERS: AdvancedFilters = {
	channels: [],
	dateRange: null,
	ltvMin: null,
	ltvMax: null,
	tagSearch: '',
}

interface Props {
	filters: AdvancedFilters
	onApply: (filters: AdvancedFilters) => void
	onClear: () => void
	/** 'customer' shows LTV range; 'lead' hides it. Default: 'customer' */
	variant?: 'customer' | 'lead'
}

export function AdvancedFilterPanel({ filters, onApply, onClear, variant = 'customer' }: Props) {
	const [isOpen, setIsOpen] = useState(false)
	const [draft, setDraft] = useState<AdvancedFilters>(filters)

	const activeCount =
		draft.channels.length +
		(draft.dateRange ? 1 : 0) +
		(draft.ltvMin !== null ? 1 : 0) +
		(draft.ltvMax !== null ? 1 : 0) +
		(draft.tagSearch ? 1 : 0)

	function handleApply() {
		onApply(draft)
		setIsOpen(false)
	}

	function handleClear() {
		setDraft(EMPTY_FILTERS)
		onClear()
		setIsOpen(false)
	}

	function toggleChannel(ch: string) {
		setDraft((d) => ({
			...d,
			channels: d.channels.includes(ch) ? d.channels.filter((c) => c !== ch) : [...d.channels, ch],
		}))
	}

	return (
		<div className="relative">
			{/* Trigger button */}
			<button
				type="button"
				onClick={() => {
					setDraft(filters)
					setIsOpen(!isOpen)
				}}
				className={cn(
					'flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm font-medium shadow-sm transition-colors',
					activeCount > 0
						? 'border-primary bg-primary/5 text-primary'
						: 'border-border-input bg-bg-input text-t2 hover:bg-bg-hover',
				)}
			>
				<svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
					<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
				</svg>
				ตัวกรอง
				{activeCount > 0 && (
					<span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
						{activeCount}
					</span>
				)}
			</button>

			{/* Panel */}
			{isOpen && (
				<>
					<div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
					<div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-border bg-bg-card p-4 shadow-xl max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:top-auto max-md:w-full max-md:rounded-b-none max-md:rounded-t-2xl max-md:max-h-[85vh] max-md:overflow-y-auto">
						<h3 className="mb-4 text-sm font-semibold text-t1">ตัวกรอง</h3>

						{/* Tag search */}
						<div className="mb-4">
							<p className="mb-1.5 text-xs font-medium text-t2">แท็ก</p>
							<input
								type="text"
								value={draft.tagSearch}
								onChange={(e) => setDraft((d) => ({ ...d, tagSearch: e.target.value }))}
								placeholder="ค้นหาแท็ก..."
								className="h-9 w-full rounded-md border border-border-input bg-bg-input px-3 text-sm text-t1 placeholder:text-t3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
							/>
						</div>

						{/* Channels */}
						<div className="mb-4">
							<p className="mb-1.5 text-xs font-medium text-t2">ช่องทาง</p>
							<div className="flex flex-wrap gap-1.5">
								{CHANNEL_OPTIONS.map((ch) => (
									<button
										key={ch}
										type="button"
										onClick={() => toggleChannel(ch)}
										className={cn(
											'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
											draft.channels.includes(ch)
												? 'border-primary bg-primary/10 text-primary'
												: 'border-border text-t3 hover:bg-bg-hover hover:text-t2',
										)}
									>
										{ch}
									</button>
								))}
							</div>
						</div>

						{/* Date range — "กิจกรรมล่าสุด" for leads, "ซื้อล่าสุด" for customers */}
						<div className="mb-4">
							<p className="mb-1.5 text-xs font-medium text-t2">
								{variant === 'lead' ? 'กิจกรรมล่าสุด' : 'ซื้อล่าสุด'}
							</p>
							<div className="flex gap-1.5">
								{DATE_PRESETS.map((preset) => (
									<button
										key={preset.value}
										type="button"
										onClick={() =>
											setDraft((d) => ({
												...d,
												dateRange: d.dateRange === preset.value ? null : preset.value,
											}))
										}
										className={cn(
											'rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors',
											draft.dateRange === preset.value
												? 'border-primary bg-primary/10 text-primary'
												: 'border-border text-t3 hover:bg-bg-hover',
										)}
									>
										{preset.label}
									</button>
								))}
							</div>
						</div>

						{/* LTV range — customers only */}
						{variant === 'customer' && (
							<div className="mb-4">
								<p className="mb-1.5 text-xs font-medium text-t2">ยอดซื้อสะสม (฿)</p>
								<div className="flex items-center gap-2">
									<input
										type="number"
										value={draft.ltvMin ?? ''}
										onChange={(e) =>
											setDraft((d) => ({ ...d, ltvMin: e.target.value ? Number(e.target.value) : null }))
										}
										placeholder="ต่ำสุด"
										className="h-9 w-full rounded-md border border-border-input bg-bg-input px-3 text-sm placeholder:text-t3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
									/>
									<span className="shrink-0 text-t3">—</span>
									<input
										type="number"
										value={draft.ltvMax ?? ''}
										onChange={(e) =>
											setDraft((d) => ({ ...d, ltvMax: e.target.value ? Number(e.target.value) : null }))
										}
										placeholder="สูงสุด"
										className="h-9 w-full rounded-md border border-border-input bg-bg-input px-3 text-sm placeholder:text-t3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
									/>
								</div>
							</div>
						)}

						{/* Actions */}
						<div className="flex gap-2 border-t border-border pt-3">
							<button
								type="button"
								onClick={handleClear}
								className="flex-1 rounded-lg border border-border px-3 py-2 text-sm font-medium text-t2 hover:bg-bg-hover"
							>
								ล้างทั้งหมด
							</button>
							<button
								type="button"
								onClick={handleApply}
								className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary/90"
							>
								ใช้ตัวกรอง
							</button>
						</div>
					</div>
				</>
			)}
		</div>
	)
}

// Active filter chips display
export function ActiveFilterChips({
	filters,
	onRemove,
}: {
	filters: AdvancedFilters
	onRemove: (key: string, value?: string) => void
}) {
	const chips: { key: string; label: string; value?: string }[] = []
	for (const ch of filters.channels) chips.push({ key: 'channel', label: ch, value: ch })
	if (filters.dateRange) chips.push({ key: 'dateRange', label: `กิจกรรม: ${filters.dateRange}` })
	if (filters.ltvMin !== null) chips.push({ key: 'ltvMin', label: `LTV ≥ ฿${filters.ltvMin.toLocaleString()}` })
	if (filters.ltvMax !== null) chips.push({ key: 'ltvMax', label: `LTV ≤ ฿${filters.ltvMax.toLocaleString()}` })
	if (filters.tagSearch) chips.push({ key: 'tagSearch', label: `แท็ก: ${filters.tagSearch}` })

	if (chips.length === 0) return null

	return (
		<div className="flex flex-wrap gap-1.5">
			{chips.map((chip, i) => (
				<span
					key={`${chip.key}-${chip.value ?? i}`}
					className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
				>
					{chip.label}
					<button
						type="button"
						onClick={() => onRemove(chip.key, chip.value)}
						className="ml-0.5 opacity-70 hover:opacity-100"
						aria-label="ลบตัวกรอง"
					>
						<svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
							<path d="M18 6 6 18M6 6l12 12" />
						</svg>
					</button>
				</span>
			))}
		</div>
	)
}
