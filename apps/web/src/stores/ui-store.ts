import { create } from 'zustand'

type Theme = 'dark' | 'light'

interface UIState {
  sidebarOpen: boolean
  selectedRoomId: string | null
  theme: Theme
  toggleSidebar: () => void
  setSelectedRoom: (roomId: string | null) => void
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  const stored = localStorage.getItem('ob-theme')
  if (stored === 'light' || stored === 'dark') return stored
  return 'dark'
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('ob-theme', theme)
}

// Apply initial theme immediately
const initialTheme = getInitialTheme()
applyTheme(initialTheme)

export const useUIStore = create<UIState>()((set) => ({
  sidebarOpen: true,
  selectedRoomId: null,
  theme: initialTheme,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSelectedRoom: (roomId) => set({ selectedRoomId: roomId }),
  toggleTheme: () =>
    set((state) => {
      const next = state.theme === 'dark' ? 'light' : 'dark'
      applyTheme(next)
      return { theme: next }
    }),
  setTheme: (theme) => {
    applyTheme(theme)
    return set({ theme })
  },
}))
