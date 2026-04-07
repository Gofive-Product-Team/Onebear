import { type HTMLAttributes } from 'react'
import { cn } from '@one-bear/ui'

const variants = {
	default: 'bg-primary-alpha text-primary border-primary/20',
	secondary: 'bg-bg-input text-t3 border-border-input',
	success: 'bg-success-bg text-success border-success/20',
	warning: 'bg-warning-bg text-warning border-warning/20',
	destructive: 'bg-error-bg text-error border-error/20',
	outline: 'bg-transparent text-t2 border-border-input',
} as const

const platformColors: Record<string, string> = {
	line: 'bg-[#06C755]/10 text-[#06C755] border-[#06C755]/20',
	facebook: 'bg-[#1877F2]/10 text-[#1877F2] border-[#1877F2]/20',
	instagram: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
	whatsapp: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
	email: 'bg-bg-input text-t3 border-border-input',
	tiktok: 'bg-bg-input text-t1 border-border-input',
	lazada: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
	shopee: 'bg-red-500/10 text-red-500 border-red-500/20',
}

interface Props extends HTMLAttributes<HTMLSpanElement> {
	variant?: keyof typeof variants
	platform?: string
}

export function Badge({ variant = 'default', platform, className, children, ...props }: Props) {
	const colorClass = platform ? platformColors[platform.toLowerCase()] ?? variants[variant] : variants[variant]

	return (
		<span
			className={cn(
				'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium transition-colors',
				colorClass,
				className,
			)}
			{...props}
		>
			{children}
		</span>
	)
}
