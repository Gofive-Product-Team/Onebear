import type { ChatMessage } from '@one-bear/shared-types'
import { useMembers } from '@/api/useMembers'

interface Props {
	message: ChatMessage
}

export function NoteMessage({ message }: Props) {
	const { data: members } = useMembers()

	// senderName could be a display name OR a Keycloak UUID — try to resolve both ways
	const senderId = message.senderName ?? ''
	const member = members?.find(
		(m) => m.keycloakUserId === senderId || m.displayName === senderId || m.email === senderId,
	)
	const authorName = member?.displayName ?? member?.email ?? (senderId || 'Unknown')

	return (
		<div>
			<p className="whitespace-pre-wrap text-sm">{message.content ?? ''}</p>
			<p className="mt-1 text-[10px] text-amber-500">— {authorName}</p>
		</div>
	)
}
