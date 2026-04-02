export function formatRelativeTime(isoDate: string): string {
	const date = new Date(isoDate)
	const now = new Date()
	const diffMs = now.getTime() - date.getTime()
	const diffMin = Math.floor(diffMs / 60000)
	const diffHr = Math.floor(diffMin / 60)
	const diffDay = Math.floor(diffHr / 24)

	if (diffMin < 1) return 'just now'
	if (diffMin < 60) return `${diffMin}m ago`
	if (diffHr < 24) return `${diffHr}h ago`
	if (diffDay < 7) return `${diffDay}d ago`
	return date.toLocaleDateString()
}

export function formatTime(isoDate: string): string {
	return new Date(isoDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function formatDate(isoDate: string): string {
	return new Date(isoDate).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	})
}

export function formatDateSeparator(isoDate: string): string {
	const date = new Date(isoDate)
	const now = new Date()
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
	const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())
	const diffDays = Math.floor((today.getTime() - target.getTime()) / 86400000)

	if (diffDays === 0) return 'Today'
	if (diffDays === 1) return 'Yesterday'
	if (diffDays < 7) {
		return date.toLocaleDateString('en-US', { weekday: 'long' })
	}
	return formatDate(isoDate)
}
