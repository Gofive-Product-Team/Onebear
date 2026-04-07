import { useState, useRef, useCallback, useEffect, type ReactNode, type TouchEvent } from 'react'
import { cn } from '@one-bear/ui'

// ─── Constants ─────────────────────────────────────────────────────────────────

const SWIPE_LEFT_THRESHOLD = 120 // px to reveal follow-up + chat buttons
const SWIPE_RIGHT_THRESHOLD = 80 // px to trigger snooze
const SNAP_OPEN_LEFT = 160 // px offset when snapped open to the left
const HAPTIC_VIBRATION_MS = 30

// ─── Props ─────────────────────────────────────────────────────────────────────

interface Props {
	customerId: string
	onFollowup: () => void
	onChat: () => void
	onSnooze: () => void
	children: ReactNode
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function SwipeableCard({ onFollowup, onChat, onSnooze, children }: Props) {
	const [offset, setOffset] = useState(0)
	const [isAnimating, setIsAnimating] = useState(false)
	const [snoozeTriggered, setSnoozeTriggered] = useState(false)
	const [showHint, setShowHint] = useState(() => {
		if (typeof window === 'undefined') return false
		return !sessionStorage.getItem('swipe-hint-seen')
	})

	useEffect(() => {
		if (showHint) {
			const timer = setTimeout(() => {
				setShowHint(false)
				sessionStorage.setItem('swipe-hint-seen', '1')
			}, 3000)
			return () => clearTimeout(timer)
		}
	}, [showHint])

	const startXRef = useRef<number | null>(null)
	const startYRef = useRef<number | null>(null)
	const isScrollingRef = useRef<boolean | null>(null) // null = not yet determined
	const didReachThresholdRef = useRef(false)
	const currentOffsetRef = useRef(0)

	function springTo(targetOffset: number, onComplete?: () => void) {
		setIsAnimating(true)
		setOffset(targetOffset)
		currentOffsetRef.current = targetOffset
		setTimeout(() => {
			setIsAnimating(false)
			onComplete?.()
		}, 300)
	}

	const handleTouchStart = useCallback((e: TouchEvent<HTMLDivElement>) => {
		const touch = e.touches[0]
		if (!touch) return
		startXRef.current = touch.clientX
		startYRef.current = touch.clientY
		isScrollingRef.current = null
		didReachThresholdRef.current = false
		setIsAnimating(false)
	}, [])

	const handleTouchMove = useCallback((e: TouchEvent<HTMLDivElement>) => {
		if (startXRef.current === null || startYRef.current === null) return

		const touch = e.touches[0]
		if (!touch) return

		const dx = touch.clientX - startXRef.current
		const dy = touch.clientY - startYRef.current

		// Determine scroll vs swipe direction on first significant move
		if (isScrollingRef.current === null && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
			isScrollingRef.current = Math.abs(dy) > Math.abs(dx)
		}

		// If vertical scroll, don't interfere
		if (isScrollingRef.current) return

		// Prevent vertical scroll while swiping horizontally
		e.preventDefault()

		const newOffset = Math.max(-SNAP_OPEN_LEFT, Math.min(SWIPE_RIGHT_THRESHOLD + 20, dx))
		setOffset(newOffset)
		currentOffsetRef.current = newOffset

		// Haptic feedback at thresholds
		if (!didReachThresholdRef.current) {
			if (newOffset <= -SWIPE_LEFT_THRESHOLD || newOffset >= SWIPE_RIGHT_THRESHOLD) {
				navigator.vibrate?.(HAPTIC_VIBRATION_MS)
				didReachThresholdRef.current = true
			}
		} else if (Math.abs(newOffset) < SWIPE_LEFT_THRESHOLD && newOffset < SWIPE_RIGHT_THRESHOLD) {
			// Reset threshold flag when user swipes back
			didReachThresholdRef.current = false
		}
	}, [])

	const handleTouchEnd = useCallback(() => {
		if (isScrollingRef.current) return

		const finalOffset = currentOffsetRef.current

		if (finalOffset <= -SWIPE_LEFT_THRESHOLD) {
			// Snap open to reveal action buttons
			springTo(-SNAP_OPEN_LEFT)
		} else if (finalOffset >= SWIPE_RIGHT_THRESHOLD) {
			// Snooze action — snap right then reset
			setSnoozeTriggered(true)
			springTo(0, () => {
				onSnooze()
				setSnoozeTriggered(false)
			})
		} else {
			// Snap back to center
			springTo(0)
		}
	}, [onSnooze])

	function closeActions() {
		springTo(0)
	}

	function handleFollowup() {
		closeActions()
		onFollowup()
	}

	function handleChat() {
		closeActions()
		onChat()
	}

	const isOpenLeft = offset <= -SWIPE_LEFT_THRESHOLD
	const actionRevealRatio = Math.min(1, Math.abs(offset) / SNAP_OPEN_LEFT)

	return (
		<div className="relative overflow-hidden rounded-xl md:overflow-visible md:rounded-none">
			{/* Swipe hint arrow — shown once per session */}
			{showHint && (
				<div className="pointer-events-none absolute left-2 top-1/2 z-30 -translate-y-1/2 animate-pulse text-t3">
					<svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
						<path d="M19 12H5M5 12l7-7M5 12l7 7" />
					</svg>
				</div>
			)}

			{/* Snoozed overlay */}
			{snoozeTriggered && (
				<div className="absolute inset-0 z-30 flex items-center justify-center rounded-xl bg-white/80 backdrop-blur-sm">
					<span className="text-sm font-medium text-green-600">Snoozed 24h</span>
				</div>
			)}

			{/* Snooze indicator — revealed on swipe right */}
			<div
				className={cn(
					'absolute inset-y-0 left-0 flex items-center rounded-l-xl px-5 transition-opacity',
					offset > 0 ? 'opacity-100' : 'opacity-0',
					snoozeTriggered ? 'bg-green-500' : 'bg-green-400',
				)}
				aria-hidden="true"
			>
				<div className="flex flex-col items-center gap-1 text-white">
					<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
						<path d="M5 12h14" />
						<path d="m12 5 7 7-7 7" />
					</svg>
					<span className="text-xs font-semibold">Snooze</span>
				</div>
			</div>

			{/* Action buttons — revealed on swipe left */}
			<div
				className="absolute inset-y-0 right-0 flex items-stretch overflow-hidden rounded-r-xl"
				style={{ width: SNAP_OPEN_LEFT, opacity: actionRevealRatio }}
				aria-hidden="true"
			>
				{/* Follow-up button */}
				<button
					type="button"
					onClick={handleFollowup}
					className="flex flex-1 flex-col items-center justify-center gap-1 bg-orange-500 px-4 text-white transition-colors active:bg-orange-600"
					tabIndex={isOpenLeft ? 0 : -1}
				>
					<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
						<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
					</svg>
					<span className="text-xs font-semibold">Follow-up</span>
				</button>

				{/* Chat button */}
				<button
					type="button"
					onClick={handleChat}
					className="flex flex-1 flex-col items-center justify-center gap-1 bg-blue-500 px-4 text-white transition-colors active:bg-blue-600"
					tabIndex={isOpenLeft ? 0 : -1}
				>
					<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
						<path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z" />
					</svg>
					<span className="text-xs font-semibold">Chat</span>
				</button>
			</div>

			{/* Card content — transforms on swipe */}
			{/* Backdrop tap to close when actions are open */}
			{isOpenLeft && (
				<div
					className="fixed inset-0 z-10"
					onClick={closeActions}
					aria-hidden="true"
				/>
			)}
			<div
				className={cn('relative z-20', isAnimating && 'transition-transform duration-300 ease-out')}
				style={{ transform: `translateX(${offset}px)` }}
			>
				{children}
			</div>
		</div>
	)
}
