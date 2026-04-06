import { useEffect, useCallback, useRef, type ReactNode, type HTMLAttributes } from 'react'
import { cn } from '@one-bear/ui'

interface Props {
	open: boolean
	onOpenChange: (open: boolean) => void
	children: ReactNode
}

export function Dialog({ open, onOpenChange, children }: Props) {
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
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<div className="fixed inset-0 bg-black/50 backdrop-blur-[4px] animate-in fade-in-0" onClick={() => onOpenChange(false)} />
			<div
				className={cn(
					'relative z-50 w-full max-w-lg rounded-2xl bg-bg-card p-6 shadow-md',
					'animate-in fade-in-0 zoom-in-95',
				)}
				role="dialog"
				aria-modal="true"
			>
				{children}
			</div>
		</div>
	)
}

interface DialogHeaderProps extends HTMLAttributes<HTMLDivElement> {
	children: ReactNode
}

export function DialogHeader({ children, className, ...props }: DialogHeaderProps) {
	return (
		<div className={cn('mb-4 flex flex-col gap-1.5', className)} {...props}>
			{children}
		</div>
	)
}

interface DialogTitleProps extends HTMLAttributes<HTMLHeadingElement> {
	children: ReactNode
}

export function DialogTitle({ children, className, ...props }: DialogTitleProps) {
	return (
		<h2 className={cn('text-lg font-semibold text-t1', className)} {...props}>
			{children}
		</h2>
	)
}

interface DialogDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
	children: ReactNode
}

export function DialogDescription({ children, className, ...props }: DialogDescriptionProps) {
	return (
		<p className={cn('text-sm text-t2', className)} {...props}>
			{children}
		</p>
	)
}

interface DialogContentProps extends HTMLAttributes<HTMLDivElement> {
	children: ReactNode
}

export function DialogContent({ children, className, ...props }: DialogContentProps) {
	return (
		<div className={cn('py-2', className)} {...props}>
			{children}
		</div>
	)
}

interface DialogFooterProps extends HTMLAttributes<HTMLDivElement> {
	children: ReactNode
}

export function DialogFooter({ children, className, ...props }: DialogFooterProps) {
	return (
		<div className={cn('mt-4 flex items-center justify-end gap-2', className)} {...props}>
			{children}
		</div>
	)
}

interface DialogCloseProps extends HTMLAttributes<HTMLButtonElement> {
	onClose: () => void
}

export function DialogClose({ onClose, className, ...props }: DialogCloseProps) {
	return (
		<button
			type="button"
			onClick={onClose}
			className={cn(
				'absolute right-4 top-4 rounded-sm p-1 text-t3 transition-colors hover:text-t2',
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
