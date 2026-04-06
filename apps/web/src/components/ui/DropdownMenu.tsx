import {
	createContext,
	useContext,
	useState,
	useCallback,
	useEffect,
	useRef,
	type ReactNode,
	type HTMLAttributes,
	type ButtonHTMLAttributes,
} from 'react'
import { cn } from '@one-bear/ui'

interface DropdownContextValue {
	open: boolean
	setOpen: (open: boolean) => void
	close: () => void
}

const DropdownContext = createContext<DropdownContextValue | null>(null)

function useDropdownContext() {
	const ctx = useContext(DropdownContext)
	if (!ctx) throw new Error('DropdownMenu components must be used within a DropdownMenu provider')
	return ctx
}

interface DropdownMenuProps {
	children: ReactNode
}

export function DropdownMenu({ children }: DropdownMenuProps) {
	const [open, setOpen] = useState(false)
	const close = useCallback(() => setOpen(false), [])
	const containerRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (!open) return

		function handleClickOutside(e: MouseEvent) {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setOpen(false)
			}
		}

		function handleEscape(e: KeyboardEvent) {
			if (e.key === 'Escape') setOpen(false)
		}

		document.addEventListener('mousedown', handleClickOutside)
		document.addEventListener('keydown', handleEscape)
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
			document.removeEventListener('keydown', handleEscape)
		}
	}, [open])

	return (
		<DropdownContext.Provider value={{ open, setOpen, close }}>
			<div ref={containerRef} className="relative inline-block">
				{children}
			</div>
		</DropdownContext.Provider>
	)
}

interface DropdownMenuTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	children: ReactNode
}

export function DropdownMenuTrigger({ children, className, ...props }: DropdownMenuTriggerProps) {
	const { open, setOpen } = useDropdownContext()

	return (
		<button
			type="button"
			aria-expanded={open}
			aria-haspopup="true"
			className={className}
			onClick={() => setOpen(!open)}
			{...props}
		>
			{children}
		</button>
	)
}

interface DropdownMenuContentProps extends HTMLAttributes<HTMLDivElement> {
	align?: 'start' | 'center' | 'end'
	children: ReactNode
}

export function DropdownMenuContent({ align = 'end', children, className, ...props }: DropdownMenuContentProps) {
	const { open } = useDropdownContext()

	if (!open) return null

	return (
		<div
			role="menu"
			className={cn(
				'absolute z-50 mt-1 min-w-[8rem] overflow-hidden rounded-md border border-border bg-bg-card p-1 shadow-md',
				'animate-in fade-in-0 zoom-in-95',
				align === 'start' && 'left-0',
				align === 'center' && 'left-1/2 -translate-x-1/2',
				align === 'end' && 'right-0',
				className,
			)}
			{...props}
		>
			{children}
		</div>
	)
}

interface DropdownMenuItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	children: ReactNode
	destructive?: boolean
}

export function DropdownMenuItem({ children, destructive = false, className, onClick, ...props }: DropdownMenuItemProps) {
	const { close } = useDropdownContext()

	return (
		<button
			type="button"
			role="menuitem"
			className={cn(
				'flex w-full items-center rounded-sm px-2 py-1.5 text-sm transition-colors',
				'focus-visible:outline-none',
				destructive
					? 'text-error hover:bg-error-bg focus:bg-error-bg'
					: 'text-t1 hover:bg-bg-hover focus:bg-bg-hover',
				className,
			)}
			onClick={(e) => {
				onClick?.(e)
				close()
			}}
			{...props}
		>
			{children}
		</button>
	)
}

interface DropdownMenuSeparatorProps extends HTMLAttributes<HTMLDivElement> {}

export function DropdownMenuSeparator({ className, ...props }: DropdownMenuSeparatorProps) {
	return <div role="separator" className={cn('-mx-1 my-1 h-px bg-border', className)} {...props} />
}

interface DropdownMenuLabelProps extends HTMLAttributes<HTMLDivElement> {
	children: ReactNode
}

export function DropdownMenuLabel({ children, className, ...props }: DropdownMenuLabelProps) {
	return (
		<div className={cn('px-2 py-1.5 text-xs font-semibold text-t3', className)} {...props}>
			{children}
		</div>
	)
}
