import { useState, type ImgHTMLAttributes } from 'react'
import { cn } from '@one-bear/ui'

const sizes = {
	sm: 'h-8 w-8 text-xs',
	md: 'h-10 w-10 text-sm',
	lg: 'h-12 w-12 text-base',
} as const

interface Props extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
	src?: string | null
	fallback?: string
	size?: keyof typeof sizes
}

export function Avatar({ src, fallback = '?', size = 'md', className, alt, ...props }: Props) {
	const [imgError, setImgError] = useState(false)
	const showFallback = !src || imgError

	return (
		<span
			className={cn(
				'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-bg-input',
				sizes[size],
				className,
			)}
		>
			{showFallback ? (
				<span className="font-medium text-t3 uppercase select-none">{fallback.slice(0, 2)}</span>
			) : (
				<img
					src={src}
					alt={alt ?? fallback}
					className="h-full w-full object-cover"
					onError={() => setImgError(true)}
					{...props}
				/>
			)}
		</span>
	)
}
