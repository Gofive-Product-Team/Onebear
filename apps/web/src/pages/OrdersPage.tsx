import { useState, useMemo } from 'react'
import { cn } from '@one-bear/ui'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
	useOrders,
	useOrderSummary,
	useUpdateOrderStatus,
	type OrderItem,
} from '@/api/useOrders'
import {
	ShoppingCart,
	Search,
	X,
	Clock,
	CheckCircle2,
	XCircle,
	AlertTriangle,
	CreditCard,
	FileCheck,
	ChevronRight,
	RotateCcw,
} from 'lucide-react'

// ─── Status helpers ──────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive'; icon: React.ReactNode }> = {
	New: { label: 'New', variant: 'default', icon: <Clock className="h-3 w-3" /> },
	InProgress: { label: 'In Progress', variant: 'warning', icon: <Clock className="h-3 w-3" /> },
	PendingPayment: { label: 'Pending Payment', variant: 'warning', icon: <CreditCard className="h-3 w-3" /> },
	PendingVerify: { label: 'Pending Verify', variant: 'default', icon: <FileCheck className="h-3 w-3" /> },
	Completed: { label: 'Completed', variant: 'success', icon: <CheckCircle2 className="h-3 w-3" /> },
	Cancelled: { label: 'Cancelled', variant: 'secondary', icon: <XCircle className="h-3 w-3" /> },
	PaymentExpired: { label: 'Expired', variant: 'destructive', icon: <AlertTriangle className="h-3 w-3" /> },
	Refunded: { label: 'Refunded', variant: 'secondary', icon: <RotateCcw className="h-3 w-3" /> },
}

function StatusBadge({ status }: { status: string }) {
	const config = STATUS_CONFIG[status] ?? { label: status, variant: 'secondary' as const, icon: null }
	return <Badge variant={config.variant}>{config.icon}<span className="ml-1">{config.label}</span></Badge>
}

function formatThb(amount: number) {
	return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount)
}

function formatRelativeTime(timestamp: number) {
	const diff = Date.now() - timestamp
	const minutes = Math.floor(diff / 60000)
	if (minutes < 1) return 'Just now'
	if (minutes < 60) return `${minutes}m ago`
	const hours = Math.floor(minutes / 60)
	if (hours < 24) return `${hours}h ago`
	return `${Math.floor(hours / 24)}d ago`
}

// ─── Order Detail Modal ──────────────────────────────────────────────────────

function OrderDetailModal({ order, onClose }: { order: OrderItem; onClose: () => void }) {
	const updateStatus = useUpdateOrderStatus()

	function handleTransition(newStatus: string) {
		if (newStatus === 'Cancelled') {
			const reason = prompt('Cancellation reason:')
			if (!reason) return
			updateStatus.mutate({ orderId: order.id, body: { status: newStatus, cancellationReason: reason } }, { onSuccess: onClose })
		} else {
			updateStatus.mutate({ orderId: order.id, body: { status: newStatus } }, { onSuccess: onClose })
		}
	}

	const possibleTransitions: Record<string, string[]> = {
		New: ['InProgress', 'Cancelled'],
		InProgress: ['PendingPayment', 'Cancelled'],
		PendingPayment: ['PendingVerify', 'Cancelled'],
		PendingVerify: ['Completed', 'PendingPayment'],
		PaymentExpired: ['PendingPayment', 'Cancelled'],
		Completed: ['Refunded'],
	}
	const transitions = possibleTransitions[order.status] ?? []

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
			<div className="mx-4 w-full max-w-lg rounded-xl border border-border bg-bg-card p-6 shadow-md" onClick={(e) => e.stopPropagation()}>
				<div className="mb-4 flex items-center justify-between">
					<div>
						<h2 className="text-lg font-semibold text-t1">{order.orderId}</h2>
						<p className="text-sm text-t2">{order.customerName ?? 'No customer'}</p>
					</div>
					<button onClick={onClose} className="rounded-lg p-1.5 text-t3 hover:bg-bg-hover"><X className="h-4 w-4" /></button>
				</div>

				<div className="mb-4 flex items-center gap-2">
					<StatusBadge status={order.status} />
					{order.source === 'ai' && <Badge>AI</Badge>}
				</div>

				{/* Line Items */}
				<div className="mb-4 overflow-hidden rounded-lg border border-border">
					<table className="w-full text-sm">
						<thead className="border-b border-border bg-bg-input text-xs text-t3">
							<tr>
								<th className="px-3 py-2 text-left">Item</th>
								<th className="px-3 py-2 text-right">Qty</th>
								<th className="px-3 py-2 text-right">Price</th>
								<th className="px-3 py-2 text-right">Total</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border">
							{order.items.map((item, i) => (
								<tr key={i}>
									<td className="px-3 py-2 text-t1">{item.productName}{item.variantLabel ? ` (${item.variantLabel})` : ''}</td>
									<td className="px-3 py-2 text-right text-t2">{item.quantity}</td>
									<td className="px-3 py-2 text-right text-t2">{formatThb(item.unitPrice)}</td>
									<td className="px-3 py-2 text-right font-medium text-t1">{formatThb(item.lineTotal)}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				{/* Totals */}
				<div className="mb-4 space-y-1 text-sm">
					<div className="flex justify-between"><span className="text-t3">Subtotal</span><span className="text-t1">{formatThb(order.subtotal)}</span></div>
					{order.discount > 0 && <div className="flex justify-between"><span className="text-t3">Discount</span><span className="text-error">-{formatThb(order.discount)}</span></div>}
					<div className="flex justify-between border-t border-border pt-1 font-semibold"><span className="text-t1">Total</span><span className="text-t1">{formatThb(order.total)}</span></div>
					{order.paidAmount > 0 && <div className="flex justify-between"><span className="text-success">Paid</span><span className="text-success">{formatThb(order.paidAmount)}</span></div>}
				</div>

				{order.cancellationReason && (
					<div className="mb-4 rounded-lg bg-error-bg p-3 text-sm text-error">Cancelled: {order.cancellationReason}</div>
				)}

				{/* Status Transitions */}
				{transitions.length > 0 && (
					<div className="flex flex-wrap gap-2">
						{transitions.map((t) => (
							<Button
								key={t}
								size="sm"
								variant={t === 'Cancelled' || t === 'Refunded' ? 'outline' : 'default'}
								onClick={() => handleTransition(t)}
								disabled={updateStatus.isPending}
							>
								{STATUS_CONFIG[t]?.icon}<span className="ml-1">{STATUS_CONFIG[t]?.label ?? t}</span>
							</Button>
						))}
					</div>
				)}
			</div>
		</div>
	)
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export function OrdersPage() {
	const [statusFilter, setStatusFilter] = useState('')
	const [search, setSearch] = useState('')
	const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null)

	const params = useMemo(() => {
		const p: Record<string, string> = { pageSize: '50' }
		if (statusFilter) p.status = statusFilter
		if (search) p.search = search
		return p
	}, [statusFilter, search])

	const { data, isLoading } = useOrders(params)
	const { data: summary } = useOrderSummary()
	const orders = data?.data ?? []

	const statusTabs = [
		{ key: '', label: 'All', count: summary?.totalOrders },
		{ key: 'New', label: 'New', count: summary?.newOrders },
		{ key: 'PendingPayment', label: 'Payment', count: summary?.pendingPayment },
		{ key: 'PendingVerify', label: 'Verify', count: summary?.pendingVerify },
		{ key: 'Completed', label: 'Done', count: summary?.completed },
		{ key: 'Cancelled', label: 'Cancelled', count: summary?.cancelled },
	]

	return (
		<div className="mx-auto max-w-7xl space-y-5">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-t1">Orders</h1>
					<p className="mt-0.5 text-sm text-t2">Manage customer orders and payments</p>
				</div>
				{summary && (
					<div className="rounded-xl border border-border bg-bg-card px-4 py-2 text-right shadow-sm">
						<div className="text-xs text-t3">Today's Revenue</div>
						<div className="text-lg font-bold text-success">{formatThb(summary.todayRevenue)}</div>
					</div>
				)}
			</div>

			{/* Summary Cards */}
			{summary && (
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
					{statusTabs.filter((t) => t.key).map((tab) => (
						<button
							key={tab.key}
							onClick={() => setStatusFilter(statusFilter === tab.key ? '' : tab.key)}
							className={cn(
								'rounded-xl border p-3 text-left transition-all',
								statusFilter === tab.key
									? 'border-primary bg-primary-alpha shadow-sm'
									: 'border-border bg-bg-card hover:bg-bg-hover',
							)}
						>
							<div className="text-xs text-t3">{tab.label}</div>
							<div className="mt-1 text-xl font-bold text-t1">{tab.count ?? 0}</div>
						</button>
					))}
				</div>
			)}

			{/* Search */}
			<div className="relative">
				<Search className="absolute left-3 top-2.5 h-4 w-4 text-t3" />
				<input
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder="Search by order ID or customer..."
					className="w-full rounded-lg border border-border-input bg-bg-input py-2 pl-9 pr-3 text-sm text-t1 placeholder:text-t3 focus:border-primary focus:outline-none"
				/>
				{search && (
					<button onClick={() => setSearch('')} className="absolute right-3 top-2.5 text-t3 hover:text-t1">
						<X className="h-4 w-4" />
					</button>
				)}
			</div>

			{/* Order List */}
			{isLoading ? (
				<div className="flex h-40 items-center justify-center text-sm text-t3">Loading orders...</div>
			) : orders.length === 0 ? (
				<div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
					<div className="flex h-20 w-20 items-center justify-center rounded-full bg-bg-input text-t3">
						<ShoppingCart className="h-10 w-10" />
					</div>
					<div>
						<p className="text-base font-semibold text-t1">No orders yet</p>
						<p className="mt-1 text-sm text-t2">Orders from chat and AI will appear here.</p>
					</div>
				</div>
			) : (
				<div className="space-y-2">
					{orders.map((order) => (
						<button
							key={order.id}
							onClick={() => setSelectedOrder(order)}
							className="flex w-full items-center justify-between rounded-xl border border-border bg-bg-card p-4 text-left shadow-sm transition-all hover:bg-bg-hover"
						>
							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2">
									<span className="font-mono text-sm font-semibold text-t1">{order.orderId}</span>
									<StatusBadge status={order.status} />
									{order.source === 'ai' && <Badge>AI</Badge>}
								</div>
								<p className="mt-1 truncate text-sm text-t3">
									{order.customerName ?? 'No customer'} &middot; {order.items.length} item{order.items.length !== 1 ? 's' : ''} &middot; {formatRelativeTime(order.createdTimestamp)}
								</p>
							</div>
							<div className="flex items-center gap-3 pl-4">
								<span className="text-sm font-semibold text-t1">{formatThb(order.total)}</span>
								<ChevronRight className="h-4 w-4 text-t3" />
							</div>
						</button>
					))}
				</div>
			)}

			{/* Detail Modal */}
			{selectedOrder && <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
		</div>
	)
}
