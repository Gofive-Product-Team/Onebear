import { type ReactNode } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { cn } from '@one-bear/ui'
import { Sidebar } from './Sidebar'

function isChatPath(pathname: string): boolean {
  return pathname === '/chat' || pathname.startsWith('/chat/')
}

interface Props {
  children: ReactNode
}

export function AppShell({ children }: Props) {
  const currentPath = useRouterState().location.pathname
  const isChat = isChatPath(currentPath)

  return (
    <div className="flex h-screen overflow-hidden bg-bg-app">
      <Sidebar />

      {/* Main content area */}
      <main className={cn('flex-1 overflow-hidden', isChat ? '' : 'overflow-y-auto p-6')}>
        {children}
      </main>
    </div>
  )
}
