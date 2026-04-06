import { forwardRef, useId, type InputHTMLAttributes } from 'react'
import { cn } from '@one-bear/ui'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
	label?: string
	error?: string
}

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
	{ label, error, className, id, ...props },
	ref,
) {
	const generatedId = useId()
	const inputId = id ?? generatedId

	return (
		<div className="flex flex-col gap-1.5">
			{label && (
				<label htmlFor={inputId} className="text-sm font-medium text-t3">
					{label}
				</label>
			)}
			<input
				ref={ref}
				id={inputId}
				className={cn(
					'flex h-9 w-full rounded-md border bg-bg-input px-3 py-1 text-sm text-t1 transition-colors',
					'placeholder:text-t3',
					'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
					'disabled:cursor-not-allowed disabled:opacity-50',
					error ? 'border-error focus-visible:ring-error' : 'border-border-input',
					className,
				)}
				aria-invalid={error ? 'true' : undefined}
				aria-describedby={error ? `${inputId}-error` : undefined}
				{...props}
			/>
			{error && (
				<p id={`${inputId}-error`} className="text-xs text-error">
					{error}
				</p>
			)}
		</div>
	)
})
