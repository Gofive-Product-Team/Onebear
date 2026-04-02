import { cn } from '@one-bear/ui'
import type { SocialPlatform } from '@one-bear/shared-types'

const platformConfig: Record<
	SocialPlatform,
	{ label: string; icon: string; bg: string; text: string }
> = {
	Line: { label: 'LINE', icon: 'L', bg: 'bg-green-500', text: 'text-white' },
	Facebook: { label: 'Facebook', icon: 'f', bg: 'bg-blue-600', text: 'text-white' },
	Instagram: { label: 'Instagram', icon: 'IG', bg: 'bg-gradient-to-br from-purple-500 to-pink-500', text: 'text-white' },
	WhatsApp: { label: 'WhatsApp', icon: 'W', bg: 'bg-green-600', text: 'text-white' },
	Email: { label: 'Email', icon: '@', bg: 'bg-gray-500', text: 'text-white' },
	TikTok: { label: 'TikTok', icon: 'T', bg: 'bg-gray-900', text: 'text-white' },
	Lazada: { label: 'Lazada', icon: 'Lz', bg: 'bg-blue-500', text: 'text-white' },
	Shopee: { label: 'Shopee', icon: 'S', bg: 'bg-orange-500', text: 'text-white' },
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
					'inline-flex items-center justify-center rounded-full bg-gray-400 text-white font-bold',
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
