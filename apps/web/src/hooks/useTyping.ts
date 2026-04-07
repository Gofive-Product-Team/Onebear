import { useCallback, useEffect, useState } from 'react'
import type { HubConnection } from '@microsoft/signalr'

interface TypingUser {
	userId: string
	displayName: string
}

export function useTyping(connection: HubConnection | null, roomId: string | null) {
	const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])

	useEffect(() => {
		if (!connection || !roomId) return

		connection.on('TypingIndicator', (data: { userId: string; displayName: string; roomId: string; isTyping: boolean }) => {
			if (data.roomId !== roomId) return

			setTypingUsers((prev) => {
				if (data.isTyping) {
					if (prev.some((u) => u.userId === data.userId)) return prev
					return [...prev, { userId: data.userId, displayName: data.displayName }]
				}
				return prev.filter((u) => u.userId !== data.userId)
			})
		})

		return () => {
			connection.off('TypingIndicator')
			setTypingUsers([])
		}
	}, [connection, roomId])

	const sendTyping = useCallback(
		(isTyping: boolean) => {
			if (connection && roomId) {
				connection.invoke('SendTyping', roomId, isTyping).catch(console.error)
			}
		},
		[connection, roomId],
	)

	return { typingUsers, sendTyping }
}
