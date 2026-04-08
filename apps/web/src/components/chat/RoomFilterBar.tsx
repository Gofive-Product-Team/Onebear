import { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '@one-bear/ui'
import { Search, X, ChevronDown, ArrowUpDown } from 'lucide-react'
import { PlatformIcon } from './PlatformIcon'
import type { SocialPlatform } from '@one-bear/shared-types'

export interface RoomFilterState {
	state: string
	platform: string
	search: string
	sort: string
}

interface Props {
	filters: RoomFilterState
	onChange: (filters: RoomFilterState) => void
}

const STATE_TABS = [
	{ value: '', label: 'All' },
	{ value: 'New', label: 'New' },
	{ value: 'InProgress', label: 'In Progress' },
	{ value: 'Resolved', label: 'Resolved' },
] as const

const PLATFORMS: { value: string; label: string }[] = [
	{ value: '', label: 'All platforms' },
	{ value: 'Line', label: 'LINE' },
	{ value: 'Facebook', label: 'Facebook' },
	{ value: 'Instagram', label: 'Instagram' },
	{ value: 'WhatsApp', label: 'WhatsApp' },
	{ value: 'Email', label: 'Email' },
	{ value: 'TikTok', label: 'TikTok' },
	{ value: 'Lazada', label: 'Lazada' },
	{ value: 'Shopee', label: 'Shopee' },
]

const SORT_OPTIONS = [
	{ value: 'latest', label: 'Latest message' },
	{ value: 'unread', label: 'Unread first' },
	{ value: 'oldest', label: 'Oldest first' },
] as const

function MiniDropdown({
	value,
	options,
	onChange,
	renderOption,
}: {
	value: string
	options: { value: string; label: string }[]
	onChange: (value: string) => void
	renderOption?: (option: { value: string; label: string }) => React.ReactNode
}) {
	const [open, setOpen] = useState(false)
	const containerRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (!open) return
		function handleClick(e: MouseEvent) {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setOpen(false)
			}
		}
		function handleEscape(e: KeyboardEvent) {
			if (e.key === 'Escape') setOpen(false)
		}
		document.addEventListener('mousedown', handleClick)
		document.addEventListener('keydown', handleEscape)
		return () => {
			document.removeEventListener('mousedown', handleClick)
			document.removeEventListener('keydown', handleEscape)
		}
	}, [open])

	const selected = options.find((o) => o.value === value) ?? options[0]

	return (
		<div ref={containerRef} className="relative">
			<button
				type="button"
				onClick={() => setOpen(!open)}
				className={cn(
					'flex items-center gap-1 rounded-md border border-border-input bg-bg-input px-2 py-1 text-xs text-t2',
					'hover:bg-bg-hover transition-colors',
					'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
					open && 'ring-2 ring-primary',
				)}
			>
				{renderOption ? renderOption(selected) : <span className="truncate max-w-[80px]">{selected.label}</span>}
				<ChevronDown className={cn('h-3 w-3 shrink-0 text-t3 transition-transform', open && 'rotate-180')} />
			</button>
			{open && (
				<div className="absolute left-0 top-full z-50 mt-1 min-w-[140px] overflow-hidden rounded-md border border-border bg-bg-card py-1 shadow-md animate-in fade-in-0 zoom-in-95">
					{options.map((option) => (
						<button
							key={option.value}
							type="button"
							className={cn(
								'flex w-full items-center gap-2 px-2.5 py-1.5 text-xs transition-colors',
								'hover:bg-bg-hover',
								option.value === value ? 'text-primary font-medium bg-bg-active' : 'text-t1',
							)}
							onClick={() => {
								onChange(option.value)
								setOpen(false)
							}}
						>
							{renderOption ? renderOption(option) : option.label}
						</button>
					))}
				</div>
			)}
		</div>
	)
}

export function RoomFilterBar({ filters, onChange }: Props) {
	const [localSearch, setLocalSearch] = useState(filters.search)
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	const updateFilter = useCallback(
		(patch: Partial<RoomFilterState>) => {
			onChange({ ...filters, ...patch })
		},
		[filters, onChange],
	)

	// Debounced search
	const handleSearchChange = useCallback(
		(value: string) => {
			setLocalSearch(value)
			if (debounceRef.current) clearTimeout(debounceRef.current)
			debounceRef.current = setTimeout(() => {
				updateFilter({ search: value.trim() })
			}, 300)
		},
		[updateFilter],
	)

	// Sync local search state if parent resets it
	useEffect(() => {
		setLocalSearch(filters.search)
	}, [filters.search])

	// Cleanup debounce on unmount
	useEffect(() => {
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current)
		}
	}, [])

	return (
		<div className="flex flex-col gap-2">
			{/* State tabs */}
			<div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
				{STATE_TABS.map((tab) => (
					<button
						key={tab.value}
						type="button"
						onClick={() => updateFilter({ state: tab.value })}
						className={cn(
							'shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors',
							'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
							filters.state === tab.value
								? 'bg-primary text-white shadow-sm'
								: 'bg-bg-input text-t3 hover:bg-bg-hover hover:text-t2',
						)}
					>
						{tab.label}
					</button>
				))}
			</div>

			{/* Search input */}
			<div className="relative">
				<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-t3 pointer-events-none" />
				<input
					type="text"
					value={localSearch}
					onChange={(e) => handleSearchChange(e.target.value)}
					placeholder="Search customer..."
					className={cn(
						'w-full rounded-md border border-border-input bg-bg-input pl-8 pr-8 py-1.5 text-xs text-t1',
						'placeholder:text-t3 transition-colors',
						'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
					)}
				/>
				{localSearch && (
					<button
						type="button"
						onClick={() => handleSearchChange('')}
						className="absolute right-2 top-1/2 -translate-y-1/2 text-t3 hover:text-t1 transition-colors"
						aria-label="Clear search"
					>
						<X className="h-3.5 w-3.5" />
					</button>
				)}
			</div>

			{/* Platform + Sort dropdowns */}
			<div className="flex items-center gap-2">
				<MiniDropdown
					value={filters.platform}
					options={PLATFORMS}
					onChange={(platform) => updateFilter({ platform })}
					renderOption={(option) => (
						<span className="flex items-center gap-1.5">
							{option.value ? (
								<PlatformIcon platform={option.value} size="sm" />
							) : null}
							<span className="truncate">{option.label}</span>
						</span>
					)}
				/>
				<MiniDropdown
					value={filters.sort}
					options={[...SORT_OPTIONS]}
					onChange={(sort) => updateFilter({ sort })}
					renderOption={(option) => (
						<span className="flex items-center gap-1.5">
							{option.value === filters.sort && <ArrowUpDown className="h-3 w-3 shrink-0" />}
							<span className="truncate">{option.label}</span>
						</span>
					)}
				/>
			</div>
		</div>
	)
}
