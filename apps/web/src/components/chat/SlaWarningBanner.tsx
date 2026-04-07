import { useEffect, useState } from 'react'
import { cn } from '@one-bear/ui'

interface Props {
	frtStartTimestamp: number | null
	isFrtStopped: boolean
}

const LEVEL1_MS = 15 * 60 * 1000 // 15 minutes
const LEVEL2_MS = 30 * 60 * 1000 // 30 minutes
const LEVEL3_MS = 60 * 60 * 1000 // 60 minutes
const POLL_INTERVAL_MS = 10_000 // 10 seconds

function formatElapsed(ms: number): string {
	const totalMinutes = Math.floor(ms / 60_000)
	if (totalMinutes < 60) return `${totalMinutes}m`
	const hours = Math.floor(totalMinutes / 60)
	const minutes = totalMinutes % 60
	return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
}

interface WarningLevel {
	label: string
	bannerClass: string
	iconClass: string
}

function getWarningLevel(elapsedMs: number): WarningLevel | null {
	if (elapsedMs >= LEVEL3_MS) {
		return {
			label: `SLA: Response time exceeds ${formatElapsed(elapsedMs)}`,
			bannerClass: 'border-red-200 bg-red-50',
			iconClass: 'text-red-600',
		}
	}
	if (elapsedMs >= LEVEL2_MS) {
		return {
			label: `SLA: Response time exceeds ${formatElapsed(elapsedMs)}`,
			bannerClass: 'border-orange-200 bg-orange-50',
			iconClass: 'text-orange-600',
		}
	}
	if (elapsedMs >= LEVEL1_MS) {
		return {
			label: `SLA: Response time exceeds ${formatElapsed(elapsedMs)}`,
			bannerClass: 'border-yellow-200 bg-yellow-50',
			iconClass: 'text-yellow-600',
		}
	}
	return null
}

export function SlaWarningBanner({ frtStartTimestamp, isFrtStopped }: Props) {
	const [elapsedMs, setElapsedMs] = useState<number>(() => {
		if (!frtStartTimestamp || isFrtStopped) return 0
		return Date.now() - frtStartTimestamp
	})

	useEffect(() => {
		if (!frtStartTimestamp || isFrtStopped) {
			setElapsedMs(0)
			return
		}

		// Calculate immediately
		setElapsedMs(Date.now() - frtStartTimestamp)

		// Then poll every 10 seconds
		const interval = setInterval(() => {
			setElapsedMs(Date.now() - frtStartTimestamp)
		}, POLL_INTERVAL_MS)

		return () => clearInterval(interval)
	}, [frtStartTimestamp, isFrtStopped])

	const level = getWarningLevel(elapsedMs)

	if (!level) return null

	return (
		<div
			className={cn(
				'flex items-center gap-2 border-b px-4 py-2',
				level.bannerClass,
			)}
			role="alert"
		>
			<span className={cn('shrink-0 text-sm font-semibold', level.iconClass)} aria-hidden="true">
				⚠️
			</span>
			<p className={cn('text-xs font-medium', level.iconClass)}>{level.label}</p>
		</div>
	)
}
