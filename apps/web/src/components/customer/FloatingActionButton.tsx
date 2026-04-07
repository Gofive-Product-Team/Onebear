import { useEffect, useRef, useState } from 'react'
import { cn } from '@one-bear/ui'

interface Props {
	onClick: () => void
}

export function FloatingActionButton({ onClick }: Props) {
	const [visible, setVisible] = useState(true)
	const lastScrollY = useRef(0)

	useEffect(() => {
		function onScroll() {
			const current = window.scrollY
			// Hide on scroll down, show on scroll up
			if (current > lastScrollY.current && current > 80) {
				setVisible(false)
			} else {
				setVisible(true)
			}
			lastScrollY.current = current
		}

		window.addEventListener('scroll', onScroll, { passive: true })
		return () => window.removeEventListener('scroll', onScroll)
	}, [])

	return (
		<button
			type="button"
			onClick={onClick}
			aria-label="Add customer"
			className={cn(
				// Only visible on mobile (hidden md+)
				'fixed bottom-6 right-6 z-40 md:hidden',
				'flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg',
				'transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
				'hover:bg-primary-light active:scale-95',
				visible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none',
			)}
		>
			<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
				<path d="M12 5v14" />
				<path d="M5 12h14" />
			</svg>
		</button>
	)
}
