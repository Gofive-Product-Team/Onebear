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

const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
const THAI_DAYS = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์']

function isToday(date: Date, now: Date): boolean {
	return (
		date.getDate() === now.getDate() &&
		date.getMonth() === now.getMonth() &&
		date.getFullYear() === now.getFullYear()
	)
}

export function formatSmartTimestamp(unixMs: number): string {
	const now = new Date()
	const date = new Date(unixMs)
	const diffMs = now.getTime() - date.getTime()
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

	// Today → HH:mm
	if (isToday(date, now)) {
		return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
	}

	// This week (1-6 days ago) → Thai day name
	if (diffDays < 7) {
		return THAI_DAYS[date.getDay()]
	}

	// This year → day + Thai month (e.g., "12 ม.ค.")
	if (date.getFullYear() === now.getFullYear()) {
		return `${date.getDate()} ${THAI_MONTHS[date.getMonth()]}`
	}

	// Older → day + month + 2-digit Buddhist year (e.g., "12 ม.ค. 67")
	const buddhistYear = (date.getFullYear() + 543) % 100
	return `${date.getDate()} ${THAI_MONTHS[date.getMonth()]} ${String(buddhistYear).padStart(2, '0')}`
}

export function formatFullThaiDatetime(unixMs: number): string {
	const date = new Date(unixMs)
	const day = THAI_DAYS[date.getDay()]
	const buddhistYear = date.getFullYear() + 543
	const month = THAI_MONTHS[date.getMonth()]
	const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
	return `${day} ${date.getDate()} ${month} ${buddhistYear} เวลา ${time}`
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
