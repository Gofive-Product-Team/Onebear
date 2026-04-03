import { useState } from 'react'
import { cn } from '@one-bear/ui'
import type { ChatMessage } from '@one-bear/shared-types'

interface Props {
	message: ChatMessage
}

function LightboxModal({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
			onClick={onClose}
			role="dialog"
			aria-modal="true"
			aria-label="Image preview"
		>
			<button
				type="button"
				className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
				onClick={onClose}
				aria-label="Close preview"
			>
				<svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
					<path
						fillRule="evenodd"
						d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
						clipRule="evenodd"
					/>
				</svg>
			</button>
			<img
				src={src}
				alt={alt}
				className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
				onClick={(e) => e.stopPropagation()}
			/>
		</div>
	)
}

export function ImageMessage({ message }: Props) {
	const [lightboxOpen, setLightboxOpen] = useState(false)
	const src = message.content ?? message.attachments?.[0]?.url

	if (!src) {
		return <span className="text-gray-400 italic">Image unavailable</span>
	}

	return (
		<>
			<img
				src={src}
				alt="Shared image"
				className={cn('max-w-[240px] cursor-pointer rounded-lg object-cover transition-opacity hover:opacity-90')}
				loading="lazy"
				onClick={() => setLightboxOpen(true)}
			/>
			{lightboxOpen && <LightboxModal src={src} alt="Shared image" onClose={() => setLightboxOpen(false)} />}
		</>
	)
}
