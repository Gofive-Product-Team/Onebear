import { useState, useRef, useCallback, type ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { cn } from '@one-bear/ui'
import { Input } from '@/components/ui/Input'
import { useUpdateCustomer } from '@/api/useCustomers'
import { PinnedNoteEditor } from './PinnedNoteEditor'
import { TagManager } from './TagManager'
import type { CustomerListItem } from '@/api/useCustomers'

// ─── Toast ─────────────────────────────────────────────────────────────────────

function useSavedToast() {
	const [visible, setVisible] = useState(false)
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	function show() {
		setVisible(true)
		if (timerRef.current) clearTimeout(timerRef.current)
		timerRef.current = setTimeout(() => setVisible(false), 1000)
	}

	return { visible, show }
}

// ─── Menu panel ────────────────────────────────────────────────────────────────

type MenuAction = 'editName' | 'addNote' | 'changeTag' | null

interface MenuPanelProps {
	x: number
	y: number
	customer: CustomerListItem
	onClose: () => void
}

function ContextMenuPanel({ x, y, customer, onClose }: MenuPanelProps) {
	const navigate = useNavigate()
	const [activeAction, setActiveAction] = useState<MenuAction>(null)
	const [editName, setEditName] = useState(customer.name)
	const savedToast = useSavedToast()
	const updateCustomer = useUpdateCustomer()

	// Clamp panel to viewport
	const panelRef = useRef<HTMLDivElement>(null)

	function handleEditNameBlur() {
		const trimmed = editName.trim()
		if (trimmed && trimmed !== customer.name) {
			updateCustomer.mutate(
				{ id: customer.id, body: { name: trimmed } },
				{ onSuccess: () => { savedToast.show(); onClose() } },
			)
		} else {
			onClose()
		}
	}

	function handleEditNameKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		if (e.key === 'Enter') {
			e.currentTarget.blur()
		} else if (e.key === 'Escape') {
			onClose()
		}
	}

	// Base menu items
	const menuItems = [
		{
			label: 'Edit Name',
			icon: (
				<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
					<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
					<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z" />
				</svg>
			),
			action: () => setActiveAction('editName'),
		},
		{
			label: 'Add Note',
			icon: (
				<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
					<path d="M12 20h9" />
					<path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
				</svg>
			),
			action: () => setActiveAction('addNote'),
		},
		{
			label: 'Change Tag',
			icon: (
				<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
					<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
					<line x1="7" y1="7" x2="7.01" y2="7" />
				</svg>
			),
			action: () => setActiveAction('changeTag'),
		},
		{
			label: 'View Profile',
			icon: (
				<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
					<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
					<circle cx="12" cy="7" r="4" />
				</svg>
			),
			action: () => {
				navigate({ to: '/customer/$customerId', params: { customerId: customer.id } })
				onClose()
			},
		},
	]

	return (
		<div
			ref={panelRef}
			className={cn(
				'fixed z-[100] min-w-[220px] rounded-lg border border-border bg-bg-card shadow-xl',
				'animate-in fade-in-0 zoom-in-95',
			)}
			style={{ top: y, left: x }}
			role="menu"
			aria-label="Customer options"
			onClick={(e) => e.stopPropagation()}
		>
			{/* "Saved" toast */}
			{savedToast.visible && (
				<div className="absolute -top-8 left-0 rounded-md bg-green-600 px-2 py-1 text-xs text-white shadow" role="status">
					Saved
				</div>
			)}

			{/* Edit Name inline */}
			{activeAction === 'editName' ? (
				<div className="p-3">
					<p className="mb-1.5 text-xs font-medium text-t2">Edit name</p>
					<Input
						value={editName}
						onChange={(e) => setEditName(e.target.value)}
						onBlur={handleEditNameBlur}
						onKeyDown={handleEditNameKeyDown}
						autoFocus
						className="text-sm"
						aria-label="Customer name"
					/>
				</div>
			) : activeAction === 'addNote' ? (
				<div className="p-3">
					<PinnedNoteEditor
						customerId={customer.id}
						currentNote={customer.pinnedNote}
						onClose={onClose}
					/>
				</div>
			) : activeAction === 'changeTag' ? (
				<div className="p-3">
					<p className="mb-2 text-xs font-medium text-t2">Tags</p>
					<TagManager customerId={customer.id} tags={customer.tags} />
					<button
						type="button"
						onClick={onClose}
						className="mt-3 w-full rounded-md py-1.5 text-center text-xs font-medium text-t3 hover:bg-bg-hover"
					>
						Done
					</button>
				</div>
			) : (
				<div className="p-1">
					{menuItems.map((item) => (
						<button
							key={item.label}
							type="button"
							role="menuitem"
							onClick={item.action}
							className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-t1 transition-colors hover:bg-bg-hover"
						>
							<span className="text-t3">{item.icon}</span>
							{item.label}
						</button>
					))}
				</div>
			)}
		</div>
	)
}

// ─── Main wrapper ──────────────────────────────────────────────────────────────

interface Props {
	customer: CustomerListItem
	children: ReactNode
}

export function CustomerContextMenu({ customer, children }: Props) {
	const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null)

	const handleContextMenu = useCallback((e: React.MouseEvent) => {
		e.preventDefault()
		// Clamp so panel doesn't go off-screen
		const panelWidth = 220
		const panelHeight = 180
		const x = Math.min(e.clientX, window.innerWidth - panelWidth - 8)
		const y = Math.min(e.clientY, window.innerHeight - panelHeight - 8)
		setMenuPos({ x, y })
	}, [])

	function close() {
		setMenuPos(null)
	}

	return (
		<>
			{/* Wrapper — only right-click, no visual change on desktop */}
			<div onContextMenu={handleContextMenu} className="contents">
				{children}
			</div>

			{/* Backdrop + panel */}
			{menuPos && (
				<>
					<div className="fixed inset-0 z-[99]" onClick={close} aria-hidden="true" />
					<ContextMenuPanel x={menuPos.x} y={menuPos.y} customer={customer} onClose={close} />
				</>
			)}
		</>
	)
}
