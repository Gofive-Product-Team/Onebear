import { useState, useRef, type ReactNode } from 'react'
import { cn } from '@one-bear/ui'

interface Props {
	content: ReactNode
	side?: 'top' | 'bottom' | 'left' | 'right'
	children: ReactNode
	className?: string
}

const sideStyles = {
	top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
	bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
	left: 'right-full top-1/2 -translate-y-1/2 mr-2',
	right: 'left-full top-1/2 -translate-y-1/2 ml-2',
} as const

export function Tooltip({ content, side = 'top', children, className }: Props) {
	const [visible, setVisible] = useState(false)
	const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null)

	const show = () => {
		if (timeoutRef.current) clearTimeout(timeoutRef.current)
		timeoutRef.current = setTimeout(() => setVisible(true), 200)
	}

	const hide = () => {
		if (timeoutRef.current) clearTimeout(timeoutRef.current)
		setVisible(false)
	}

	return (
		<div className="relative inline-flex" onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
			{children}
			{visible && (
				<div
					role="tooltip"
					className={cn(
						'absolute z-50 max-w-xs rounded-md bg-bg-card border border-border px-2.5 py-1.5 text-xs text-t1 shadow-md',
						'pointer-events-none animate-in fade-in-0',
						sideStyles[side],
						className,
					)}
				>
					{content}
				</div>
			)}
		</div>
	)
}
