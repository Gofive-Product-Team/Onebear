import { useEffect, useRef, useState } from 'react'
import { cn } from '@one-bear/ui'

interface Props {
	value: string
	onChange: (search: string) => void
	onAddNew?: (name: string) => void
	showAddNew?: boolean
	className?: string
}

export function CustomerSearch({ value, onChange, onAddNew, showAddNew = false, className }: Props) {
	// Local input state drives the debounce; parent value is the committed search
	const [local, setLocal] = useState(value)
	const timerRef = useRef<ReturnType<typeof setTimeout>>(null)

	// Sync outward if parent resets (e.g. clear button)
	useEffect(() => {
		setLocal(value)
	}, [value])

	function handleChange(raw: string) {
		setLocal(raw)
		if (timerRef.current) clearTimeout(timerRef.current)
		timerRef.current = setTimeout(() => onChange(raw), 300)
	}

	function handleClear() {
		setLocal('')
		onChange('')
	}

	return (
		<div className={cn('flex flex-col gap-2', className)}>
			<div className="relative">
				{/* Search icon */}
				<span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-t3">
					<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
						<circle cx="11" cy="11" r="8" />
						<path d="m21 21-4.35-4.35" />
					</svg>
				</span>

				<input
					type="search"
					value={local}
					onChange={(e) => handleChange(e.target.value)}
					placeholder="Search customers..."
					aria-label="Search customers"
					className={cn(
						'h-9 w-full rounded-md border border-border-input bg-bg-input py-2 pl-9 pr-8 text-sm text-t1 shadow-sm placeholder:text-t3',
						'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
					)}
				/>

				{/* Clear button */}
				{local && (
					<button
						type="button"
						onClick={handleClear}
						aria-label="Clear search"
						className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-t3 hover:text-t2"
					>
						<svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							<path d="M18 6 6 18" />
							<path d="m6 6 12 12" />
						</svg>
					</button>
				)}
			</div>

			{/* No results: add new customer prompt */}
			{showAddNew && local.trim() && onAddNew && (
				<button
					type="button"
					onClick={() => onAddNew(local.trim())}
					className="flex items-center gap-1.5 rounded-md border border-dashed border-border-input px-3 py-2 text-sm text-primary hover:bg-primary-alpha"
				>
					<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
						<path d="M12 5v14" />
						<path d="M5 12h14" />
					</svg>
					Add new customer &ldquo;{local.trim()}&rdquo;
				</button>
			)}
		</div>
	)
}
