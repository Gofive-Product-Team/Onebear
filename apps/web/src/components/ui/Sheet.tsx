import { useEffect, useCallback, type ReactNode, type HTMLAttributes } from 'react'
import { cn } from '@one-bear/ui'

interface Props {
	open: boolean
	onOpenChange: (open: boolean) => void
	side?: 'left' | 'right' | 'bottom'
	children: ReactNode
}

export function Sheet({ open, onOpenChange, side = 'right', children }: Props) {
	const handleEscape = useCallback(
		(e: KeyboardEvent) => {
			if (e.key === 'Escape') onOpenChange(false)
		},
		[onOpenChange],
	)

	useEffect(() => {
		if (open) {
			document.addEventListener('keydown', handleEscape)
			document.body.style.overflow = 'hidden'
		}
		return () => {
			document.removeEventListener('keydown', handleEscape)
			document.body.style.overflow = ''
		}
	}, [open, handleEscape])

	if (!open) return null

	return (
		<div className="fixed inset-0 z-50">
			<div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
			<div
				className={cn(
					'fixed z-50 flex flex-col bg-bg-page shadow-xl transition-transform duration-300',
					side === 'right' && 'inset-y-0 right-0 w-[500px] max-w-[90vw] animate-in slide-in-from-right',
					side === 'left' && 'inset-y-0 left-0 w-[500px] max-w-[90vw] animate-in slide-in-from-left',
					side === 'bottom' &&
						'inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl animate-in slide-in-from-bottom',
				)}
			>
				{children}
			</div>
		</div>
	)
}

interface SheetHeaderProps extends HTMLAttributes<HTMLDivElement> {
	children: ReactNode
}

export function SheetHeader({ children, className, ...props }: SheetHeaderProps) {
	return (
		<div className={cn('flex items-center justify-between border-b border-border px-4 py-3', className)} {...props}>
			{children}
		</div>
	)
}

interface SheetTitleProps extends HTMLAttributes<HTMLHeadingElement> {
	children: ReactNode
}

export function SheetTitle({ children, className, ...props }: SheetTitleProps) {
	return (
		<h2 className={cn('text-lg font-semibold text-t1', className)} {...props}>
			{children}
		</h2>
	)
}

interface SheetContentProps extends HTMLAttributes<HTMLDivElement> {
	children: ReactNode
}

export function SheetContent({ children, className, ...props }: SheetContentProps) {
	return (
		<div className={cn('flex-1 overflow-y-auto', className)} {...props}>
			{children}
		</div>
	)
}

interface SheetCloseProps extends HTMLAttributes<HTMLButtonElement> {
	onClose: () => void
}

export function SheetClose({ onClose, className, ...props }: SheetCloseProps) {
	return (
		<button
			type="button"
			onClick={onClose}
			className={cn(
				'rounded-sm p-1 text-t3 transition-colors hover:text-t2',
				'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
				className,
			)}
			aria-label="Close"
			{...props}
		>
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
				<path d="M18 6 6 18" />
				<path d="m6 6 12 12" />
			</svg>
		</button>
	)
}
