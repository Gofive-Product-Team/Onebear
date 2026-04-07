import type { ActivityLogItem } from '@/api/useActivityLog'

// ─── Icon map ─────────────────────────────────────────────────────────────────

const TYPE_ICONS: Record<string, string> = {
	chat: '💬',
	order: '📦',
	payment: '💳',
	note: '📝',
	tag_change: '🏷️',
	status_change: '🔄',
	followup: '📋',
}

function getIcon(type: string): string {
	return TYPE_ICONS[type.toLowerCase()] ?? '🔵'
}

// ─── Relative time from unix ms timestamp ─────────────────────────────────────

function formatRelativeFromTimestamp(timestamp: number): string {
	const diffMs = Date.now() - timestamp
	const diffMin = Math.floor(diffMs / 60_000)
	const diffHr = Math.floor(diffMin / 60)
	const diffDay = Math.floor(diffHr / 24)

	if (diffMin < 1) return 'just now'
	if (diffMin < 60) return `${diffMin}m ago`
	if (diffHr < 24) return `${diffHr}h ago`
	if (diffDay < 7) return `${diffDay}d ago`
	return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
	item: ActivityLogItem
	isLast?: boolean
}

export function ActivityTimelineItem({ item, isLast = false }: Props) {
	const actor = item.actorName ?? (item.actorId === 'system' ? 'System' : item.actorId === 'ai' ? 'AI' : 'System')

	return (
		<div className="flex gap-3">
			{/* Timeline dot + line */}
			<div className="flex flex-col items-center">
				<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bg-input text-sm">
					{getIcon(item.type)}
				</div>
				{!isLast && <div className="mt-1 flex-1 w-px bg-border" />}
			</div>

			{/* Content */}
			<div className={`min-w-0 flex-1 pb-5 ${isLast ? '' : ''}`}>
				<p className="text-sm text-t1">{item.description}</p>
				<div className="mt-1 flex items-center gap-2 text-xs text-t3">
					<span>by {actor}</span>
					<span aria-hidden="true">·</span>
					<span>{formatRelativeFromTimestamp(item.timestamp)}</span>
				</div>
			</div>
		</div>
	)
}
