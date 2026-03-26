import { create } from 'zustand'

interface UIState {
  sidebarOpen: boolean
  selectedRoomId: string | null
  toggleSidebar: () => void
  setSelectedRoom: (roomId: string | null) => void
}

export const useUIStore = create<UIState>()((set) => ({
  sidebarOpen: true,
  selectedRoomId: null,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSelectedRoom: (roomId) => set({ selectedRoomId: roomId }),
}))
