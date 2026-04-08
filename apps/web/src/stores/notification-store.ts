import { create } from 'zustand'

interface Notification {
	id: string
	title: string
	message: string
	roomId?: string
	platform?: string
	timestamp: number
}

interface NotificationState {
	notifications: Notification[]
	addNotification: (n: Omit<Notification, 'id' | 'timestamp'>) => void
	removeNotification: (id: string) => void
	clearAll: () => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
	notifications: [],
	addNotification: (n) =>
		set((s) => ({
			notifications: [
				...s.notifications,
				{
					...n,
					id: crypto.randomUUID(),
					timestamp: Date.now(),
				},
			].slice(-3), // Keep max 3 visible
		})),
	removeNotification: (id) =>
		set((s) => ({
			notifications: s.notifications.filter((n) => n.id !== id),
		})),
	clearAll: () => set({ notifications: [] }),
}))
