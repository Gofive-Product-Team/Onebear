import { useState } from 'react'
import { cn } from '@one-bear/ui'

const CHANNEL_OPTIONS = ['LINE', 'Facebook', 'Instagram', 'WhatsApp', 'Email', 'TikTok', 'Lazada', 'Shopee']
const SEGMENT_OPTIONS = ['Hot', 'At-risk', 'New', 'VIP', 'Loyal', 'Cold', 'Organization']
const DATE_PRESETS = [
	{ label: 'Last 7 days', value: '7d' },
	{ label: 'Last 30 days', value: '30d' },
	{ label: 'Last 90 days', value: '90d' },
]

export interface AdvancedFilters {
	segments: string[]
	channels: string[]
	dateRange: string | null
	ltvMin: number | null
	ltvMax: number | null
	tagSearch: string
}

export const EMPTY_FILTERS: AdvancedFilters = {
	segments: [],
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
}

export function AdvancedFilterPanel({ filters, onApply, onClear }: Props) {
	const [isOpen, setIsOpen] = useState(false)
	const [draft, setDraft] = useState<AdvancedFilters>(filters)

	const activeCount =
		draft.segments.length +
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

	function toggleSegment(seg: string) {
		setDraft((d) => ({
			...d,
			segments: d.segments.includes(seg) ? d.segments.filter((s) => s !== seg) : [...d.segments, seg],
		}))
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
					'flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm transition-colors',
					activeCount > 0
						? 'border-primary bg-primary/5 text-primary'
						: 'border-border text-t2 hover:bg-bg-hover',
				)}
			>
				<svg
					className="h-4 w-4"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7m0-18H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7m0-18v18" />
				</svg>
				Filters
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
						<h3 className="mb-3 text-sm font-semibold text-t1">Advanced Filters</h3>

						{/* Segments (multi-select) */}
						<div className="mb-4">
							<p className="mb-1.5 text-xs font-medium text-t2">Segments</p>
							<div className="flex flex-wrap gap-1.5">
								{SEGMENT_OPTIONS.map((seg) => (
									<button
										key={seg}
										type="button"
										onClick={() => toggleSegment(seg)}
										className={cn(
											'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
											draft.segments.includes(seg)
												? 'border-primary bg-primary/10 text-primary'
												: 'border-border text-t3 hover:bg-bg-hover',
										)}
									>
										{seg}
									</button>
								))}
							</div>
						</div>

						{/* Tag search */}
						<div className="mb-4">
							<p className="mb-1.5 text-xs font-medium text-t2">Tag Search</p>
							<input
								type="text"
								value={draft.tagSearch}
								onChange={(e) => setDraft((d) => ({ ...d, tagSearch: e.target.value }))}
								placeholder="Search tags..."
								className="w-full rounded-lg border border-border bg-bg-input px-3 py-1.5 text-sm"
							/>
						</div>

						{/* Date range */}
						<div className="mb-4">
							<p className="mb-1.5 text-xs font-medium text-t2">Last Purchase</p>
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

						{/* LTV range */}
						<div className="mb-4">
							<p className="mb-1.5 text-xs font-medium text-t2">LTV Range (฿)</p>
							<div className="flex items-center gap-2">
								<input
									type="number"
									value={draft.ltvMin ?? ''}
									onChange={(e) =>
										setDraft((d) => ({ ...d, ltvMin: e.target.value ? Number(e.target.value) : null }))
									}
									placeholder="Min"
									className="w-full rounded-lg border border-border bg-bg-input px-3 py-1.5 text-sm"
								/>
								<span className="text-t3">&mdash;</span>
								<input
									type="number"
									value={draft.ltvMax ?? ''}
									onChange={(e) =>
										setDraft((d) => ({ ...d, ltvMax: e.target.value ? Number(e.target.value) : null }))
									}
									placeholder="Max"
									className="w-full rounded-lg border border-border bg-bg-input px-3 py-1.5 text-sm"
								/>
							</div>
						</div>

						{/* Channels */}
						<div className="mb-4">
							<p className="mb-1.5 text-xs font-medium text-t2">Channels</p>
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
												: 'border-border text-t3 hover:bg-bg-hover',
										)}
									>
										{ch}
									</button>
								))}
							</div>
						</div>

						{/* Actions */}
						<div className="flex gap-2 border-t border-border pt-2">
							<button
								type="button"
								onClick={handleClear}
								className="flex-1 rounded-lg border border-border px-3 py-2 text-sm font-medium text-t2 hover:bg-bg-hover"
							>
								Clear all
							</button>
							<button
								type="button"
								onClick={handleApply}
								className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary/90"
							>
								Apply
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
	for (const seg of filters.segments) chips.push({ key: 'segment', label: seg, value: seg })
	for (const ch of filters.channels) chips.push({ key: 'channel', label: ch, value: ch })
	if (filters.dateRange) chips.push({ key: 'dateRange', label: `Last purchase: ${filters.dateRange}` })
	if (filters.ltvMin !== null) chips.push({ key: 'ltvMin', label: `LTV >= ${filters.ltvMin}` })
	if (filters.ltvMax !== null) chips.push({ key: 'ltvMax', label: `LTV <= ${filters.ltvMax}` })
	if (filters.tagSearch) chips.push({ key: 'tagSearch', label: `Tag: ${filters.tagSearch}` })

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
						className="ml-0.5 hover:text-primary/70"
					>
						x
					</button>
				</span>
			))}
		</div>
	)
}
