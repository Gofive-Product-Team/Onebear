import { type HTMLAttributes } from 'react'
import { cn } from '@one-bear/ui'

const variants = {
	default: 'bg-blue-100 text-blue-800 border-blue-200',
	secondary: 'bg-gray-100 text-gray-800 border-gray-200',
	success: 'bg-green-100 text-green-800 border-green-200',
	warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
	destructive: 'bg-red-100 text-red-800 border-red-200',
	outline: 'bg-transparent text-gray-700 border-gray-300',
} as const

const platformColors: Record<string, string> = {
	line: 'bg-green-100 text-green-800 border-green-200',
	facebook: 'bg-blue-100 text-blue-800 border-blue-200',
	instagram: 'bg-pink-100 text-pink-800 border-pink-200',
	whatsapp: 'bg-emerald-100 text-emerald-800 border-emerald-200',
	email: 'bg-gray-100 text-gray-800 border-gray-200',
	tiktok: 'bg-slate-100 text-slate-800 border-slate-200',
	lazada: 'bg-orange-100 text-orange-800 border-orange-200',
	shopee: 'bg-red-100 text-red-800 border-red-200',
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
