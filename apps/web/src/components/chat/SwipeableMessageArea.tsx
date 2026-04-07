import { useRef, useState, useCallback, type ReactNode } from 'react'
import { cn } from '@one-bear/ui'

const SWIPE_THRESHOLD = 150 // px required to trigger action
const MAX_TRANSLATE = 80 // px max rubber-band during swipe

interface Props {
	children: ReactNode
	onBack: () => void
	onOpenInfo: () => void
	/** Only enable on mobile — pass false on desktop to skip touch handlers */
	enabled?: boolean
}

interface SwipeState {
	startX: number
	startY: number
	currentX: number
	isHorizontal: boolean | null // null = undecided
}

export function SwipeableMessageArea({ children, onBack, onOpenInfo, enabled = true }: Props) {
	const swipeRef = useRef<SwipeState | null>(null)
	const containerRef = useRef<HTMLDivElement>(null)
	const [translateX, setTranslateX] = useState(0)
	const [hint, setHint] = useState<'left' | 'right' | null>(null)

	const handleTouchStart = useCallback(
		(e: React.TouchEvent) => {
			if (!enabled) return
			const touch = e.touches[0]
			if (!touch) return
			swipeRef.current = {
				startX: touch.clientX,
				startY: touch.clientY,
				currentX: touch.clientX,
				isHorizontal: null,
			}
		},
		[enabled],
	)

	const handleTouchMove = useCallback(
		(e: React.TouchEvent) => {
			if (!enabled || !swipeRef.current) return
			const touch = e.touches[0]
			if (!touch) return

			const state = swipeRef.current
			const dx = touch.clientX - state.startX
			const dy = touch.clientY - state.startY

			// Determine gesture direction on first move > 8px
			if (state.isHorizontal === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
				state.isHorizontal = Math.abs(dx) > Math.abs(dy)
			}

			if (!state.isHorizontal) return

			// Prevent vertical scroll when doing horizontal swipe
			e.preventDefault()

			state.currentX = touch.clientX

			// Apply rubber-band translate capped at MAX_TRANSLATE
			const rawTranslate = dx
			const clamped =
				rawTranslate > 0
					? Math.min(rawTranslate, MAX_TRANSLATE)
					: Math.max(rawTranslate, -MAX_TRANSLATE)

			setTranslateX(clamped)
			setHint(rawTranslate > 0 ? 'left' : 'right')
		},
		[enabled],
	)

	const handleTouchEnd = useCallback(() => {
		if (!enabled || !swipeRef.current) return
		const state = swipeRef.current
		const dx = state.currentX - state.startX

		if (state.isHorizontal) {
			if (dx > SWIPE_THRESHOLD) {
				// Swipe right → back to inbox
				onBack()
			} else if (dx < -SWIPE_THRESHOLD) {
				// Swipe left → open customer info
				onOpenInfo()
			}
		}

		// Reset state
		swipeRef.current = null
		setTranslateX(0)
		setHint(null)
	}, [enabled, onBack, onOpenInfo])

	const handleTouchCancel = useCallback(() => {
		swipeRef.current = null
		setTranslateX(0)
		setHint(null)
	}, [])

	const isMoving = translateX !== 0

	return (
		<div
			ref={containerRef}
			className="relative flex-1 flex flex-col min-h-0 overflow-hidden"
			onTouchStart={handleTouchStart}
			onTouchMove={handleTouchMove}
			onTouchEnd={handleTouchEnd}
			onTouchCancel={handleTouchCancel}
		>
			{/* Swipe hint — left arrow (swipe right = back) */}
			<div
				className={cn(
					'pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center',
					'h-10 w-10 rounded-r-full bg-primary/20 backdrop-blur-sm transition-opacity duration-150',
					hint === 'left' && translateX > 30 ? 'opacity-100' : 'opacity-0',
				)}
				aria-hidden
			>
				<svg className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
					<path
						fillRule="evenodd"
						d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
						clipRule="evenodd"
					/>
				</svg>
			</div>

			{/* Swipe hint — right arrow (swipe left = info) */}
			<div
				className={cn(
					'pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center',
					'h-10 w-10 rounded-l-full bg-primary/20 backdrop-blur-sm transition-opacity duration-150',
					hint === 'right' && translateX < -30 ? 'opacity-100' : 'opacity-0',
				)}
				aria-hidden
			>
				<svg className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
					<path
						fillRule="evenodd"
						d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
						clipRule="evenodd"
					/>
				</svg>
			</div>

			{/* Content with transform */}
			<div
				className={cn(
					'flex flex-col flex-1 min-h-0',
					isMoving ? '' : 'transition-transform duration-200 ease-out',
				)}
				style={{ transform: `translateX(${translateX}px)` }}
			>
				{children}
			</div>
		</div>
	)
}
