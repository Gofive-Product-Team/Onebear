import { createContext, useContext, useState, useCallback, type ReactNode, type HTMLAttributes } from 'react'
import { cn } from '@one-bear/ui'

interface TabsContextValue {
	activeTab: string
	setActiveTab: (value: string) => void
}

const TabsContext = createContext<TabsContextValue | null>(null)

function useTabsContext() {
	const ctx = useContext(TabsContext)
	if (!ctx) throw new Error('Tab components must be used within a Tabs provider')
	return ctx
}

interface TabsProps {
	defaultValue: string
	value?: string
	onValueChange?: (value: string) => void
	children: ReactNode
	className?: string
}

export function Tabs({ defaultValue, value, onValueChange, children, className }: TabsProps) {
	const [internalValue, setInternalValue] = useState(defaultValue)
	const activeTab = value ?? internalValue

	const setActiveTab = useCallback(
		(tab: string) => {
			if (value === undefined) setInternalValue(tab)
			onValueChange?.(tab)
		},
		[value, onValueChange],
	)

	return (
		<TabsContext.Provider value={{ activeTab, setActiveTab }}>
			<div className={className}>{children}</div>
		</TabsContext.Provider>
	)
}

interface TabListProps extends HTMLAttributes<HTMLDivElement> {
	children: ReactNode
}

export function TabList({ children, className, ...props }: TabListProps) {
	return (
		<div
			role="tablist"
			className={cn(
				'inline-flex h-10 items-center gap-1 rounded-lg bg-bg-input p-1',
				className,
			)}
			{...props}
		>
			{children}
		</div>
	)
}

interface TabProps extends HTMLAttributes<HTMLButtonElement> {
	value: string
	children: ReactNode
}

export function Tab({ value, children, className, ...props }: TabProps) {
	const { activeTab, setActiveTab } = useTabsContext()
	const isActive = activeTab === value

	return (
		<button
			role="tab"
			type="button"
			aria-selected={isActive}
			data-state={isActive ? 'active' : 'inactive'}
			className={cn(
				'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all',
				'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
				isActive ? 'bg-bg-card text-primary font-bold shadow-sm' : 'text-t3 hover:text-t2',
				className,
			)}
			onClick={() => setActiveTab(value)}
			{...props}
		>
			{children}
		</button>
	)
}

interface TabPanelProps extends HTMLAttributes<HTMLDivElement> {
	value: string
	children: ReactNode
}

export function TabPanel({ value, children, className, ...props }: TabPanelProps) {
	const { activeTab } = useTabsContext()

	if (activeTab !== value) return null

	return (
		<div
			role="tabpanel"
			data-state={activeTab === value ? 'active' : 'inactive'}
			className={cn('mt-2 focus-visible:outline-none', className)}
			{...props}
		>
			{children}
		</div>
	)
}
