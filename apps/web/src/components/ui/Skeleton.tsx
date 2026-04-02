import { type HTMLAttributes } from 'react'
import { cn } from '@one-bear/ui'

interface Props extends HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: Props) {
	return <div className={cn('animate-pulse rounded-md bg-gray-200', className)} {...props} />
}
