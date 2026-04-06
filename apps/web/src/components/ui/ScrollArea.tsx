import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@one-bear/ui'

interface Props extends HTMLAttributes<HTMLDivElement> {
	orientation?: 'vertical' | 'horizontal' | 'both'
}

export const ScrollArea = forwardRef<HTMLDivElement, Props>(function ScrollArea(
	{ orientation = 'vertical', className, children, ...props },
	ref,
) {
	return (
		<div
			ref={ref}
			className={cn(
				'relative',
				orientation === 'vertical' && 'overflow-y-auto overflow-x-hidden',
				orientation === 'horizontal' && 'overflow-x-auto overflow-y-hidden',
				orientation === 'both' && 'overflow-auto',
				'scrollbar-thin scrollbar-thumb-scrollbar scrollbar-track-transparent',
				'[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-scrollbar hover:[&::-webkit-scrollbar-thumb]:bg-scrollbar',
				className,
			)}
			{...props}
		>
			{children}
		</div>
	)
})
