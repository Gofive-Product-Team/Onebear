import { useState, useRef, useCallback, type ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { cn } from '@one-bear/ui'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useUpdateCustomer } from '@/api/useCustomers'
import { PinnedNoteEditor } from './PinnedNoteEditor'
import { TagManager } from './TagManager'
import type { CustomerListItem } from '@/api/useCustomers'

// ─── Long-press hook ───────────────────────────────────────────────────────────

const LONG_PRESS_DELAY = 500

interface LongPressOptions {
	onLongPress: () => void
	delay?: number
}

function useLongPress({ onLongPress, delay = LONG_PRESS_DELAY }: LongPressOptions) {
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const didLongPressRef = useRef(false)

	const start = useCallback(() => {
		didLongPressRef.current = false
		timerRef.current = setTimeout(() => {
			didLongPressRef.current = true
			navigator.vibrate?.(50)
			onLongPress()
		}, delay)
	}, [onLongPress, delay])

	const cancel = useCallback(() => {
		if (timerRef.current) clearTimeout(timerRef.current)
	}, [])

	return {
		onTouchStart: start,
		onTouchEnd: cancel,
		onTouchMove: cancel,
		/** True after the long-press fires — use to suppress the subsequent click */
		get didLongPress() {
			return didLongPressRef.current
		},
	}
}

// ─── Sheet action type ──────────────────────────────────────────────────────────

type SheetAction = 'menu' | 'editName' | 'addNote' | 'changeTag'

// ─── Bottom sheet content ───────────────────────────────────────────────────────

interface SheetProps {
	open: boolean
	onClose: () => void
	customer: CustomerListItem
}

function LongPressBottomSheet({ open, onClose, customer }: SheetProps) {
	const navigate = useNavigate()
	const [view, setView] = useState<SheetAction>('menu')
	const [editName, setEditName] = useState(customer.name)
	const [savedVisible, setSavedVisible] = useState(false)
	const updateCustomer = useUpdateCustomer()

	function resetAndClose() {
		setView('menu')
		onClose()
	}

	function showSaved() {
		setSavedVisible(true)
		setTimeout(() => setSavedVisible(false), 1000)
	}

	function handleSaveName() {
		const trimmed = editName.trim()
		if (trimmed && trimmed !== customer.name) {
			updateCustomer.mutate(
				{ id: customer.id, body: { name: trimmed } },
				{ onSuccess: () => { showSaved(); resetAndClose() } },
			)
		} else {
			resetAndClose()
		}
	}

	if (!open) return null

	return (
		<div className="fixed inset-0 z-50 md:hidden">
			{/* Backdrop */}
			<div className="fixed inset-0 bg-black/50" onClick={resetAndClose} aria-hidden="true" />

			{/* Sheet */}
			<div
				className={cn(
					'fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-bg-card shadow-xl',
					'animate-in slide-in-from-bottom-4',
				)}
				role="dialog"
				aria-modal="true"
				aria-label="Customer actions"
			>
				{/* Drag handle */}
				<div className="flex justify-center pt-3 pb-1">
					<div className="h-1 w-10 rounded-full bg-border" aria-hidden="true" />
				</div>

				{/* Customer name header */}
				<div className="border-b border-border px-5 py-3">
					<p className="text-base font-semibold text-t1">{customer.name}</p>
					{savedVisible && (
						<p className="mt-0.5 text-xs text-green-600" role="status">Updated</p>
					)}
				</div>

				{/* Content */}
				<div className="px-4 py-3">
					{view === 'menu' && (
						<div className="flex flex-col gap-1">
							{[
								{
									label: 'Edit Name',
									action: () => setView('editName'),
									icon: (
										<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
											<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
											<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z" />
										</svg>
									),
								},
								{
									label: 'Add Note',
									action: () => setView('addNote'),
									icon: (
										<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
											<path d="M12 20h9" />
											<path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
										</svg>
									),
								},
								{
									label: 'Change Tag',
									action: () => setView('changeTag'),
									icon: (
										<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
											<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
											<line x1="7" y1="7" x2="7.01" y2="7" />
										</svg>
									),
								},
								{
									label: 'View Profile',
									action: () => {
										navigate({ to: '/customer/$customerId', params: { customerId: customer.id } })
										resetAndClose()
									},
									icon: (
										<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
											<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
											<circle cx="12" cy="7" r="4" />
										</svg>
									),
								},
							].map((item) => (
								<button
									key={item.label}
									type="button"
									onClick={item.action}
									className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-base text-t1 transition-colors active:bg-bg-hover"
								>
									<span className="text-t2">{item.icon}</span>
									{item.label}
								</button>
							))}
						</div>
					)}

					{view === 'editName' && (
						<div className="flex flex-col gap-3 py-2">
							<p className="text-sm font-medium text-t2">Edit customer name</p>
							<Input
								value={editName}
								onChange={(e) => setEditName(e.target.value)}
								onBlur={handleSaveName}
								onKeyDown={(e) => {
									if (e.key === 'Enter') e.currentTarget.blur()
									if (e.key === 'Escape') resetAndClose()
								}}
								autoFocus
								aria-label="Customer name"
							/>
							<div className="flex gap-2">
								<Button variant="outline" className="flex-1" onClick={resetAndClose}>Cancel</Button>
								<Button
									className="flex-1"
									onClick={handleSaveName}
									loading={updateCustomer.isPending}
									disabled={!editName.trim()}
								>
									Save
								</Button>
							</div>
						</div>
					)}

					{view === 'addNote' && (
						<div className="py-2">
							<PinnedNoteEditor
								customerId={customer.id}
								currentNote={customer.pinnedNote}
								onClose={resetAndClose}
							/>
						</div>
					)}

					{view === 'changeTag' && (
						<div className="py-2">
							<p className="mb-3 text-sm font-medium text-t2">Manage tags</p>
							<TagManager customerId={customer.id} tags={customer.tags} />
							<Button variant="outline" className="mt-4 w-full" onClick={resetAndClose}>Done</Button>
						</div>
					)}
				</div>

				{/* Safe area spacer */}
				<div className="h-safe-area-inset-bottom" />
			</div>
		</div>
	)
}

// ─── Main wrapper ──────────────────────────────────────────────────────────────

interface Props {
	customer: CustomerListItem
	children: ReactNode
}

export function CustomerLongPressSheet({ customer, children }: Props) {
	const [sheetOpen, setSheetOpen] = useState(false)
	const suppressNextClickRef = useRef(false)

	const { onTouchStart, onTouchEnd, onTouchMove } = useLongPress({
		onLongPress: () => {
			suppressNextClickRef.current = true
			setSheetOpen(true)
		},
	})

	function handleClick(e: React.MouseEvent) {
		if (suppressNextClickRef.current) {
			suppressNextClickRef.current = false
			e.stopPropagation()
			e.preventDefault()
		}
	}

	return (
		<>
			{/* Capture phase click so we can suppress before CustomerCard's onClick fires */}
			<div
				onTouchStart={onTouchStart}
				onTouchEnd={onTouchEnd}
				onTouchMove={onTouchMove}
				onClickCapture={handleClick}
				className="contents"
			>
				{children}
			</div>

			<LongPressBottomSheet
				open={sheetOpen}
				onClose={() => setSheetOpen(false)}
				customer={customer}
			/>
		</>
	)
}
