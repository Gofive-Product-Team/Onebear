import { cn } from '@one-bear/ui'
import type { SocialPlatform } from '@one-bear/shared-types'

const platformConfig: Record<
	SocialPlatform,
	{ label: string; icon: string; bg: string; text: string }
> = {
	Line: { label: 'LINE', icon: 'L', bg: 'bg-[#06C755]', text: 'text-white' },
	Facebook: { label: 'Facebook', icon: 'f', bg: 'bg-[#1877F2]', text: 'text-white' },
	Instagram: { label: 'Instagram', icon: 'IG', bg: 'bg-gradient-to-br from-[#f09433] via-[#dc2743] to-[#bc1888]', text: 'text-white' },
	WhatsApp: { label: 'WhatsApp', icon: 'W', bg: 'bg-[#25D366]', text: 'text-white' },
	Email: { label: 'Email', icon: '@', bg: 'bg-[#3B82F6]', text: 'text-white' },
	TikTok: { label: 'TikTok', icon: 'T', bg: 'bg-gray-900', text: 'text-white' },
	Lazada: { label: 'Lazada', icon: 'Lz', bg: 'bg-[#0F146D]', text: 'text-white' },
	Shopee: { label: 'Shopee', icon: 'S', bg: 'bg-[#EE4D2D]', text: 'text-white' },
}

interface Props {
	platform: string
	size?: 'sm' | 'md' | 'lg'
	className?: string
}

const sizeClasses = {
	sm: 'h-4 w-4 text-[8px]',
	md: 'h-5 w-5 text-[10px]',
	lg: 'h-6 w-6 text-xs',
} as const

export function PlatformIcon({ platform, size = 'md', className }: Props) {
	const config = platformConfig[platform as SocialPlatform]

	if (!config) {
		return (
			<span
				className={cn(
					'inline-flex items-center justify-center rounded-full bg-bg-input text-t3 font-bold',
					sizeClasses[size],
					className,
				)}
			>
				?
			</span>
		)
	}

	return (
		<span
			className={cn(
				'inline-flex items-center justify-center rounded-full font-bold leading-none',
				config.bg,
				config.text,
				sizeClasses[size],
				className,
			)}
			title={config.label}
		>
			{config.icon}
		</span>
	)
}
