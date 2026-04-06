import { type HTMLAttributes } from 'react'
import { cn } from '@one-bear/ui'

interface Props extends HTMLAttributes<HTMLDivElement> {
	orientation?: 'horizontal' | 'vertical'
}

export function Separator({ orientation = 'horizontal', className, ...props }: Props) {
	return (
		<div
			role="separator"
			aria-orientation={orientation}
			className={cn(
				'shrink-0 bg-border',
				orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
				className,
			)}
			{...props}
		/>
	)
}
