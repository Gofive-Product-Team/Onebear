import { useCallback, useEffect, useState } from 'react'
import type { HubConnection } from '@microsoft/signalr'

interface AttendingUser {
	userId: string
	displayName: string
}

export function usePresence(connection: HubConnection | null, roomId: string | null) {
	const [attendingUsers, setAttendingUsers] = useState<AttendingUser[]>([])

	useEffect(() => {
		if (!connection || !roomId) return

		connection.invoke('AttendRoom', roomId).catch(console.error)

		connection.on('AttendanceChanged', (data: { userId: string; displayName: string; roomId: string; isAttending: boolean }) => {
			if (data.roomId !== roomId) return

			setAttendingUsers((prev) => {
				if (data.isAttending) {
					if (prev.some((u) => u.userId === data.userId)) return prev
					return [...prev, { userId: data.userId, displayName: data.displayName }]
				}
				return prev.filter((u) => u.userId !== data.userId)
			})
		})

		return () => {
			connection.invoke('ExitRoom', roomId).catch(console.error)
			connection.off('AttendanceChanged')
			setAttendingUsers([])
		}
	}, [connection, roomId])

	return { attendingUsers }
}
