import { useState, useEffect } from 'react'
import { cn } from '@one-bear/ui'

interface Props {
	startTimestamp: number | null
	stoppedAt?: number | null
	label?: string
	className?: string
}

function formatDuration(ms: number): string {
	const totalSeconds = Math.floor(ms / 1000)
	if (totalSeconds < 60) return `${totalSeconds}s`
	const minutes = Math.floor(totalSeconds / 60)
	const seconds = totalSeconds % 60
	if (minutes < 60) return `${minutes}m ${seconds}s`
	const hours = Math.floor(minutes / 60)
	const mins = minutes % 60
	return `${hours}h ${mins}m`
}

function getColorClass(ms: number): string {
	const minutes = ms / 1000 / 60
	if (minutes < 5) return 'text-green-600'
	if (minutes < 15) return 'text-yellow-600'
	return 'text-red-600'
}

export function TimerDisplay({ startTimestamp, stoppedAt, label, className }: Props) {
	const [now, setNow] = useState(() => Date.now())

	const isStopped = stoppedAt != null

	useEffect(() => {
		if (isStopped) return
		const id = setInterval(() => setNow(Date.now()), 1000)
		return () => clearInterval(id)
	}, [isStopped])

	if (startTimestamp == null) return null

	const elapsed = (isStopped ? stoppedAt! : now) - startTimestamp
	const safeElapsed = Math.max(0, elapsed)

	return (
		<span className={cn('inline-flex items-center gap-1 text-xs font-medium tabular-nums', className)}>
			{label && <span className="text-t3">{label}</span>}
			<span className={getColorClass(safeElapsed)}>{formatDuration(safeElapsed)}</span>
		</span>
	)
}
