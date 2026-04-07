import { lazy, Suspense } from 'react'
import type { ChatMessage } from '@one-bear/shared-types'

import { TextMessage } from './TextMessage'
import { UnknownMessage } from './UnknownMessage'

// Lazy-loaded renderers — loaded only when the message type is encountered
const ImageMessage = lazy(() => import('./ImageMessage').then((m) => ({ default: m.ImageMessage })))
const VideoMessage = lazy(() => import('./VideoMessage').then((m) => ({ default: m.VideoMessage })))
const AudioMessage = lazy(() => import('./AudioMessage').then((m) => ({ default: m.AudioMessage })))
const FileMessage = lazy(() => import('./FileMessage').then((m) => ({ default: m.FileMessage })))
const StickerMessage = lazy(() => import('./StickerMessage').then((m) => ({ default: m.StickerMessage })))
const LocationMessage = lazy(() => import('./LocationMessage').then((m) => ({ default: m.LocationMessage })))
const NoteMessage = lazy(() => import('./NoteMessage').then((m) => ({ default: m.NoteMessage })))
const SystemMessage = lazy(() => import('./SystemMessage').then((m) => ({ default: m.SystemMessage })))
const CommentMessage = lazy(() => import('./CommentMessage').then((m) => ({ default: m.CommentMessage })))
const StoryMessage = lazy(() => import('./StoryMessage').then((m) => ({ default: m.StoryMessage })))
const EmailMessage = lazy(() => import('./EmailMessage').then((m) => ({ default: m.EmailMessage })))
const OrderMessage = lazy(() => import('./OrderMessage').then((m) => ({ default: m.OrderMessage })))
const ProductMessage = lazy(() => import('./ProductMessage').then((m) => ({ default: m.ProductMessage })))
const TemplateMessage = lazy(() => import('./TemplateMessage').then((m) => ({ default: m.TemplateMessage })))
const CarouselMessage = lazy(() => import('./CarouselMessage').then((m) => ({ default: m.CarouselMessage })))
const FlexMessage = lazy(() => import('./FlexMessage').then((m) => ({ default: m.FlexMessage })))
const ReactionMessage = lazy(() => import('./ReactionMessage').then((m) => ({ default: m.ReactionMessage })))

interface Props {
	message: ChatMessage
}

function RendererFallback() {
	return <span className="inline-block h-4 w-16 animate-pulse rounded bg-gray-200" />
}

export function MessageRenderer({ message }: Props) {
	const type = message.type

	// Direct imports — most common types, no lazy overhead
	if (type === 'Text' || type === 'text') {
		return <TextMessage message={message} />
	}

	if (type === 'System' || type === 'system') {
		return (
			<Suspense fallback={<RendererFallback />}>
				<SystemMessage message={message} />
			</Suspense>
		)
	}

	return (
		<Suspense fallback={<RendererFallback />}>
			{(() => {
				switch (type) {
					case 'Image':
					case 'image':
						return <ImageMessage message={message} />
					case 'Video':
					case 'video':
						return <VideoMessage message={message} />
					case 'Audio':
					case 'audio':
						return <AudioMessage message={message} />
					case 'File':
					case 'file':
						return <FileMessage message={message} />
					case 'Sticker':
					case 'sticker':
						return <StickerMessage message={message} />
					case 'Location':
					case 'location':
						return <LocationMessage message={message} />
					case 'Note':
					case 'note':
						return <NoteMessage message={message} />
					case 'Comment':
					case 'comment':
						return <CommentMessage message={message} />
					case 'Story':
					case 'story':
						return <StoryMessage message={message} />
					case 'Email':
					case 'email':
						return <EmailMessage message={message} />
					case 'Order':
					case 'order':
						return <OrderMessage message={message} />
					case 'Product':
					case 'product':
						return <ProductMessage message={message} />
					case 'TemplateMessage':
					case 'templateMessage':
						return <TemplateMessage message={message} />
					case 'Carousel':
					case 'carousel':
						return <CarouselMessage message={message} />
					case 'Flex':
					case 'flex':
						return <FlexMessage message={message} />
					case 'ReactionAdded':
					case 'ReactionRemoved':
					case 'reactionAdded':
					case 'reactionRemoved':
						return <ReactionMessage message={message} />
					default:
						return <UnknownMessage message={message} />
				}
			})()}
		</Suspense>
	)
}
