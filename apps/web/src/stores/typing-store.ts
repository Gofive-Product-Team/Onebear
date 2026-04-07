import { create } from 'zustand'

interface TypingEntry {
	userId: string
	timestamp: number
}

interface TypingState {
	typingRooms: Map<string, TypingEntry>
	setTyping: (roomId: string, userId: string) => void
	clearTyping: (roomId: string) => void
}

export const useTypingStore = create<TypingState>()((set) => ({
	typingRooms: new Map(),

	setTyping: (roomId, userId) =>
		set((state) => {
			const next = new Map(state.typingRooms)
			next.set(roomId, { userId, timestamp: Date.now() })
			return { typingRooms: next }
		}),

	clearTyping: (roomId) =>
		set((state) => {
			const next = new Map(state.typingRooms)
			next.delete(roomId)
			return { typingRooms: next }
		}),
}))
