import { Link, useRouterState } from '@tanstack/react-router'
import { cn } from '@one-bear/ui'
import { Tooltip } from '@/components/ui/Tooltip'
import { type ReactNode } from 'react'

interface Props {
  to: string
  label: string
  icon: ReactNode
  hasNotification?: boolean
}

function isActive(currentPath: string, to: string): boolean {
  if (to === '/') return currentPath === '/'
  return currentPath === to || currentPath.startsWith(to + '/')
}

export function SidebarNavItem({ to, label, icon, hasNotification }: Props) {
  const currentPath = useRouterState().location.pathname
  const active = isActive(currentPath, to)

  return (
    <Tooltip content={label} side="right">
      <Link
        to={to}
        className={cn(
          'relative w-10 h-10 rounded-xl flex items-center justify-center text-t3 transition-all duration-150',
          'hover:bg-bg-hover hover:text-t2',
          active && 'bg-primary-alpha text-primary',
        )}
      >
        {active && (
          <span className="absolute left-[-11px] top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-[3px] bg-primary" />
        )}
        <span className="w-[17px] h-[17px]">{icon}</span>
        {hasNotification && (
          <span className="absolute top-[9px] right-[9px] w-1.5 h-1.5 rounded-full bg-primary border-[1.5px] border-bg-app animate-pulse-dot" />
        )}
      </Link>
    </Tooltip>
  )
}
