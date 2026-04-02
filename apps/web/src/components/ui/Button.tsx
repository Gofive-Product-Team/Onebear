import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@one-bear/ui'
import { Slot } from './Slot'

const variants = {
	default: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm',
	secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 shadow-sm',
	outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 shadow-sm',
	ghost: 'text-gray-700 hover:bg-gray-100',
	destructive: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
} as const

const sizes = {
	sm: 'h-8 px-3 text-xs rounded-md gap-1.5',
	md: 'h-9 px-4 text-sm rounded-md gap-2',
	lg: 'h-10 px-5 text-sm rounded-md gap-2',
} as const

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: keyof typeof variants
	size?: keyof typeof sizes
	loading?: boolean
	asChild?: boolean
	children: ReactNode
}

function Spinner() {
	return (
		<svg
			className="animate-spin h-4 w-4"
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
		>
			<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
			<path
				className="opacity-75"
				fill="currentColor"
				d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
			/>
		</svg>
	)
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
	{ variant = 'default', size = 'md', loading = false, asChild = false, className, disabled, children, ...props },
	ref,
) {
	const classes = cn(
		'inline-flex items-center justify-center font-medium transition-colors',
		'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
		'disabled:pointer-events-none disabled:opacity-50',
		variants[variant],
		sizes[size],
		className,
	)

	if (asChild) {
		return (
			<Slot ref={ref} className={classes} {...props}>
				{children}
			</Slot>
		)
	}

	return (
		<button ref={ref} className={classes} disabled={disabled || loading} {...props}>
			{loading && <Spinner />}
			{children}
		</button>
	)
})
