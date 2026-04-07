import { cn } from '@one-bear/ui'
import type { ChatMessage } from '@one-bear/shared-types'

// Simplified LINE Flex Message renderer — read-only agent view

type FlexNodeType = 'text' | 'image' | 'box' | 'separator' | 'button' | 'bubble' | 'carousel'
type FlexLayout = 'horizontal' | 'vertical' | 'baseline'

interface FlexNodeRaw {
	type: FlexNodeType
	// text
	text?: string
	size?: string
	weight?: string
	color?: string
	// image
	url?: string
	aspectRatio?: string
	// box
	layout?: FlexLayout
	contents?: FlexNodeRaw[]
	// button
	action?: { label?: string }
	// carousel
	bubbles?: FlexBubbleRaw[]
	// hero / body / footer
	hero?: FlexNodeRaw
	body?: FlexNodeRaw
	footer?: FlexNodeRaw
}

interface FlexBubbleRaw {
	hero?: FlexNodeRaw
	body?: FlexNodeRaw
	footer?: FlexNodeRaw
}

function textSizeClass(size: string | undefined): string {
	switch (size) {
		case 'xxs': return 'text-[9px]'
		case 'xs': return 'text-[10px]'
		case 'sm': return 'text-xs'
		case 'md': return 'text-sm'
		case 'lg': return 'text-base'
		case 'xl': return 'text-lg'
		case 'xxl': return 'text-xl'
		case '3xl': return 'text-2xl'
		case '4xl': return 'text-3xl'
		case '5xl': return 'text-4xl'
		default: return 'text-sm'
	}
}

function FlexNode({ node, depth = 0 }: { node: FlexNodeRaw; depth?: number }) {
	switch (node.type) {
		case 'text':
			return (
				<span
					className={cn(
						textSizeClass(node.size),
						node.weight === 'bold' && 'font-bold',
					)}
					style={node.color ? { color: node.color } : undefined}
				>
					{node.text ?? ''}
				</span>
			)

		case 'image':
			return node.url ? (
				<img
					src={node.url}
					alt="Flex image"
					className="w-full rounded object-cover"
					loading="lazy"
				/>
			) : null

		case 'separator':
			return <hr className="my-1 border-gray-200" />

		case 'button':
			return (
				<span className="block w-full rounded border border-gray-300 px-3 py-1.5 text-center text-xs text-blue-500">
					{node.action?.label ?? 'Button'}
				</span>
			)

		case 'box': {
			const isRow = node.layout === 'horizontal' || node.layout === 'baseline'
			return (
				<div className={cn('flex gap-1', isRow ? 'flex-row flex-wrap items-baseline' : 'flex-col', depth === 0 && 'p-1')}>
					{node.contents?.map((child, i) => <FlexNode key={i} node={child} depth={depth + 1} />)}
				</div>
			)
		}

		default:
			return null
	}
}

function FlexBubble({ bubble }: { bubble: FlexBubbleRaw }) {
	return (
		<div className="flex w-56 flex-shrink-0 snap-start flex-col overflow-hidden rounded-lg border border-gray-200 bg-white">
			{bubble.hero && <FlexNode node={bubble.hero} />}
			{bubble.body && (
				<div className="p-2">
					<FlexNode node={bubble.body} />
				</div>
			)}
			{bubble.footer && (
				<div className="border-t border-gray-100 p-2">
					<FlexNode node={bubble.footer} />
				</div>
			)}
		</div>
	)
}

function parseFlexRoot(raw: unknown): FlexNodeRaw | null {
	if (raw === null || typeof raw !== 'object') return null
	return raw as FlexNodeRaw
}

interface Props {
	message: ChatMessage
}

export function FlexMessage({ message }: Props) {
	const meta = message.metadata ?? {}
	const root = parseFlexRoot(meta.flex)

	if (!root) {
		return <span className="text-gray-400 italic">{message.content ?? 'Flex message unavailable'}</span>
	}

	// Carousel of bubbles
	if (root.type === 'carousel' && Array.isArray(root.bubbles)) {
		return (
			<div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-1">
				{root.bubbles.map((bubble, i) => (
					<FlexBubble key={i} bubble={bubble} />
				))}
			</div>
		)
	}

	// Single bubble
	if (root.type === 'bubble') {
		return <FlexBubble bubble={root as FlexBubbleRaw} />
	}

	// Any other root node
	return (
		<div className="rounded-lg border border-gray-200 bg-white p-2">
			<FlexNode node={root} />
		</div>
	)
}
