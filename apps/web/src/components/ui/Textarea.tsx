import { forwardRef, useId, type TextareaHTMLAttributes } from 'react'
import { cn } from '@one-bear/ui'

interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {
	label?: string
	error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, Props>(function Textarea(
	{ label, error, className, id, ...props },
	ref,
) {
	const generatedId = useId()
	const textareaId = id ?? generatedId

	return (
		<div className="flex flex-col gap-1.5">
			{label && (
				<label htmlFor={textareaId} className="text-sm font-medium text-gray-700">
					{label}
				</label>
			)}
			<textarea
				ref={ref}
				id={textareaId}
				className={cn(
					'flex min-h-[80px] w-full rounded-md border bg-white px-3 py-2 text-sm transition-colors',
					'placeholder:text-gray-400 resize-y',
					'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1',
					'disabled:cursor-not-allowed disabled:opacity-50',
					error ? 'border-red-500 focus-visible:ring-red-500' : 'border-gray-300',
					className,
				)}
				aria-invalid={error ? 'true' : undefined}
				aria-describedby={error ? `${textareaId}-error` : undefined}
				{...props}
			/>
			{error && (
				<p id={`${textareaId}-error`} className="text-xs text-red-600">
					{error}
				</p>
			)}
		</div>
	)
})
