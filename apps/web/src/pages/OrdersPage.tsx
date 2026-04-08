import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { cn } from '@one-bear/ui'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  useOrders,
  useOrderSummary,
  useUpdateOrderStatus,
  useCreateOrder,
  type OrderItem,
  type CreateOrderBody,
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
  Copy,
  Link2,
  Send,
  RefreshCw,
  Plus,
  Minus,
  Settings,
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

// ─── Payment Method Badge ────────────────────────────────────────────────────

const PAYMENT_METHOD_CONFIG: Record<string, { label: string; emoji: string }> = {
  credit_card: { label: 'Credit Card', emoji: '💳' },
  qr_promptpay: { label: 'QR PromptPay', emoji: '📱' },
  bank_transfer: { label: 'Bank Transfer', emoji: '🏦' },
  mobile_banking: { label: 'Mobile Banking', emoji: '📲' },
}

function PaymentMethodBadge({ method }: { method: string }) {
  const cfg = PAYMENT_METHOD_CONFIG[method]
  if (!cfg) return null
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-bg-input px-2 py-0.5 text-xs text-t2">
      <span>{cfg.emoji}</span>
      <span>{cfg.label}</span>
    </span>
  )
}

// ─── Payment Link Section ────────────────────────────────────────────────────

function useCountdown(expiresAt: number) {
  const [remaining, setRemaining] = useState(expiresAt - Date.now())

  useEffect(() => {
    const id = setInterval(() => setRemaining(expiresAt - Date.now()), 1000)
    return () => clearInterval(id)
  }, [expiresAt])

  if (remaining <= 0) return '00:00:00'
  const totalSecs = Math.floor(remaining / 1000)
  const h = Math.floor(totalSecs / 3600)
  const m = Math.floor((totalSecs % 3600) / 60)
  const s = totalSecs % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

interface PaymentLinkState {
  url: string
  createdAt: number
  expiresAt: number
  status: 'ACTIVE' | 'EXPIRED' | 'COMPLETED'
}

function PaymentLinkSection({ order }: { order: OrderItem }) {
  const [link, setLink] = useState<PaymentLinkState | null>(
    order.paymentLink?.url
      ? {
          url: order.paymentLink.url,
          createdAt: order.paymentLink.createdTimestamp,
          expiresAt: order.paymentLink.expiresAtTimestamp,
          status: order.paymentLink.status as 'ACTIVE' | 'EXPIRED' | 'COMPLETED',
        }
      : null,
  )
  const [copied, setCopied] = useState(false)
  const countdown = useCountdown(link?.expiresAt ?? Date.now())

  function generateLink() {
    const id = Math.random().toString(36).slice(2, 8).toUpperCase()
    const now = Date.now()
    setLink({
      url: `https://pay.onebear.ai/${id}`,
      createdAt: now,
      expiresAt: now + 24 * 60 * 60 * 1000,
      status: 'ACTIVE',
    })
  }

  function copyLink() {
    if (!link) return
    void navigator.clipboard.writeText(link.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const linkStatus = link
    ? link.expiresAt < Date.now()
      ? 'EXPIRED'
      : link.status
    : null

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-success/10 text-success border-success/30',
    EXPIRED: 'bg-error/10 text-error border-error/30',
    COMPLETED: 'bg-primary/10 text-primary border-primary/30',
  }

  return (
    <div className="mb-4 rounded-lg border border-border bg-bg-input p-4">
      <h3 className="mb-3 text-sm font-semibold text-t1">Payment Link</h3>

      {!link ? (
        <Button size="sm" onClick={generateLink} className="w-full">
          <Link2 className="mr-1.5 h-4 w-4" />
          สร้าง Payment Link
        </Button>
      ) : (
        <div className="space-y-3">
          {/* Link row */}
          <div className="flex items-center gap-2 rounded-lg border border-border bg-bg-card px-3 py-2">
            <span className="flex-1 truncate font-mono text-xs text-t1">{link.url}</span>
            <button
              onClick={copyLink}
              className="shrink-0 rounded p-1 text-t3 hover:text-t1"
              title="Copy link"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
          {copied && <p className="text-xs text-success">คัดลอกแล้ว!</p>}

          {/* Status & countdown */}
          <div className="flex items-center justify-between">
            {linkStatus && (
              <span className={cn('rounded-full border px-2 py-0.5 text-xs font-semibold', statusColors[linkStatus])}>
                {linkStatus}
              </span>
            )}
            {linkStatus === 'ACTIVE' && (
              <span className="font-mono text-xs text-t3">หมดอายุใน {countdown}</span>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex-1" onClick={() => alert('ส่งลิงก์ให้ลูกค้าแล้ว (stub)')}>
              <Send className="mr-1.5 h-3.5 w-3.5" />
              ส่งลิงก์ให้ลูกค้า
            </Button>
            {linkStatus === 'EXPIRED' && (
              <Button size="sm" variant="outline" onClick={generateLink}>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                สร้างลิงก์ใหม่
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Payment Mode Selector ────────────────────────────────────────────────────

type PaymentMode = 'full' | 'deposit' | 'installment'
const INSTALLMENT_OPTIONS = [2, 3, 6, 12]

interface PaymentModeSelectorProps {
  total: number
  mode: PaymentMode
  onModeChange: (m: PaymentMode) => void
  depositPercent: number
  onDepositChange: (v: number) => void
  installmentCount: number
  onInstallmentChange: (v: number) => void
}

function PaymentModeSelector({
  total,
  mode,
  onModeChange,
  depositPercent,
  onDepositChange,
  installmentCount,
  onInstallmentChange,
}: PaymentModeSelectorProps) {
  const depositAmount = Math.round((total * depositPercent) / 100)
  const remainingAmount = total - depositAmount
  const perInstallment = installmentCount > 0 ? Math.round(total / installmentCount) : 0

  return (
    <div className="space-y-3">
      {/* Mode buttons */}
      <div className="flex gap-1 rounded-lg border border-border bg-bg-input p-1">
        {([['full', 'ชำระเต็ม'], ['deposit', 'มัดจำ'], ['installment', 'ผ่อนชำระ']] as [PaymentMode, string][]).map(([val, label]) => (
          <button
            key={val}
            type="button"
            onClick={() => onModeChange(val)}
            className={cn(
              'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all',
              mode === val ? 'bg-primary text-white shadow-sm' : 'text-t2 hover:bg-bg-hover',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Deposit config */}
      {mode === 'deposit' && (
        <div className="space-y-3 rounded-lg border border-border bg-bg-card p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-t2">มัดจำ {depositPercent}%</span>
            <span className="font-semibold text-t1">{formatThb(depositAmount)}</span>
          </div>
          <input
            type="range"
            min={10}
            max={90}
            step={5}
            value={depositPercent}
            onChange={(e) => onDepositChange(Number(e.target.value))}
            className="w-full accent-primary"
          />
          {/* Timeline */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-t2">ชำระมัดจำ</span>
              <span className="ml-auto font-medium text-t1">{formatThb(depositAmount)}</span>
            </div>
            <div className="ml-1 h-4 w-0.5 bg-border" />
            <div className="flex items-center gap-2 text-xs">
              <span className="h-2 w-2 rounded-full bg-success" />
              <span className="text-t2">ชำระส่วนที่เหลือ</span>
              <span className="ml-auto font-medium text-t1">{formatThb(remainingAmount)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Installment config */}
      {mode === 'installment' && (
        <div className="space-y-3 rounded-lg border border-border bg-bg-card p-3">
          <div className="flex gap-2">
            {INSTALLMENT_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onInstallmentChange(n)}
                className={cn(
                  'flex-1 rounded-lg border py-2 text-sm font-medium transition-all',
                  installmentCount === n
                    ? 'border-primary bg-primary text-white'
                    : 'border-border text-t2 hover:bg-bg-hover',
                )}
              >
                {n} เดือน
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-t2">งวดละ</span>
            <span className="font-semibold text-t1">{formatThb(perInstallment)}</span>
          </div>
          {/* Timeline */}
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {Array.from({ length: installmentCount }, (_, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                <span className="text-t2">งวดที่ {i + 1}</span>
                <span className="ml-auto font-medium text-t1">{formatThb(perInstallment)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Create Order Modal ───────────────────────────────────────────────────────

interface LineItemDraft {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
}

const SAMPLE_PRODUCTS = [
  { id: 'p1', name: 'Teddy Bear (S)', price: 490 },
  { id: 'p2', name: 'Teddy Bear (M)', price: 790 },
  { id: 'p3', name: 'Teddy Bear (L)', price: 1290 },
  { id: 'p4', name: 'Gift Box', price: 150 },
  { id: 'p5', name: 'Ribbon Set', price: 99 },
]

function CreateOrderModal({ onClose }: { onClose: () => void }) {
  const createOrder = useCreateOrder()
  const [customerName, setCustomerName] = useState('')
  const [items, setItems] = useState<LineItemDraft[]>([
    { productId: '', productName: '', quantity: 1, unitPrice: 0 },
  ])
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('full')
  const [depositPercent, setDepositPercent] = useState(30)
  const [installmentCount, setInstallmentCount] = useState(3)

  const subtotal = items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0)

  function updateItem(idx: number, patch: Partial<LineItemDraft>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)))
  }

  function selectProduct(idx: number, productId: string) {
    const p = SAMPLE_PRODUCTS.find((x) => x.id === productId)
    if (p) updateItem(idx, { productId: p.id, productName: p.name, unitPrice: p.price })
  }

  function addItem() {
    setItems((prev) => [...prev, { productId: '', productName: '', quantity: 1, unitPrice: 0 }])
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  function handleSubmit() {
    if (!customerName.trim()) return alert('กรุณากรอกชื่อลูกค้า')
    const validItems = items.filter((it) => it.productId && it.quantity > 0)
    if (validItems.length === 0) return alert('กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ')

    const body: CreateOrderBody = {
      customerName: customerName.trim(),
      items: validItems.map((it) => ({
        productId: it.productId,
        productName: it.productName,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
      })),
      paymentMode,
    }

    createOrder.mutate(body, { onSuccess: onClose })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="mx-4 w-full max-w-xl rounded-xl border border-border bg-bg-card shadow-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-t1">สร้างออเดอร์</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-t3 hover:bg-bg-hover">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[70vh] overflow-y-auto p-6 space-y-5">
          {/* Customer */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-t1">ชื่อลูกค้า</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-t3" />
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="ค้นหาหรือพิมพ์ชื่อลูกค้า..."
                className="w-full rounded-lg border border-border-input bg-bg-input py-2 pl-9 pr-3 text-sm text-t1 placeholder:text-t3 focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Line Items */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-t1">รายการสินค้า</label>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <select
                    value={item.productId}
                    onChange={(e) => selectProduct(idx, e.target.value)}
                    className="flex-1 rounded-lg border border-border-input bg-bg-input px-3 py-2 text-sm text-t1 focus:border-primary focus:outline-none"
                  >
                    <option value="">เลือกสินค้า</option>
                    {SAMPLE_PRODUCTS.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, { quantity: Math.max(1, Number(e.target.value)) })}
                    className="w-16 rounded-lg border border-border-input bg-bg-input px-2 py-2 text-center text-sm text-t1 focus:border-primary focus:outline-none"
                  />
                  <span className="w-24 text-right text-sm text-t2">{formatThb(item.quantity * item.unitPrice)}</span>
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    disabled={items.length === 1}
                    className="rounded p-1 text-t3 hover:text-error disabled:opacity-30"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <Plus className="h-3.5 w-3.5" />
                เพิ่มสินค้า
              </button>
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-between rounded-lg bg-bg-input px-4 py-3 text-sm font-semibold">
            <span className="text-t2">ยอดรวม</span>
            <span className="text-t1">{formatThb(subtotal)}</span>
          </div>

          {/* Payment Mode */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-t1">วิธีชำระเงิน</label>
            <PaymentModeSelector
              total={subtotal}
              mode={paymentMode}
              onModeChange={setPaymentMode}
              depositPercent={depositPercent}
              onDepositChange={setDepositPercent}
              installmentCount={installmentCount}
              onInstallmentChange={setInstallmentCount}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
          <Button variant="outline" onClick={onClose}>ยกเลิก</Button>
          <Button onClick={handleSubmit} disabled={createOrder.isPending}>
            {createOrder.isPending ? 'กำลังสร้าง...' : 'สร้างออเดอร์'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Order Detail Modal ──────────────────────────────────────────────────────

function OrderDetailModal({ order, onClose }: { order: OrderItem; onClose: () => void }) {
  const updateStatus = useUpdateOrderStatus()
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(
    (order.paymentMode as PaymentMode) || 'full',
  )
  const [depositPercent, setDepositPercent] = useState(30)
  const [installmentCount, setInstallmentCount] = useState(3)

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

  const showPaymentLink = order.status === 'PendingPayment' || order.status === 'PendingVerify'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="mx-4 w-full max-w-lg rounded-xl border border-border bg-bg-card shadow-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-t1">{order.orderId}</h2>
            <p className="text-sm text-t2">{order.customerName ?? 'No customer'}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-t3 hover:bg-bg-hover">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="max-h-[70vh] overflow-y-auto p-6 space-y-4">
          {/* Status row */}
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={order.status} />
            {order.source === 'ai' && <Badge>AI</Badge>}
            {order.status === 'Completed' && order.paymentMode && (
              <PaymentMethodBadge method={order.paymentMode} />
            )}
          </div>

          {/* Payment Link (shown for PendingPayment / PendingVerify) */}
          {showPaymentLink && <PaymentLinkSection order={order} />}

          {/* Payment Mode selector (editable when not completed/cancelled) */}
          {order.status !== 'Completed' && order.status !== 'Cancelled' && order.status !== 'Refunded' && (
            <div className="rounded-lg border border-border bg-bg-input p-4">
              <div className="mb-2 flex items-center gap-1.5">
                <Settings className="h-3.5 w-3.5 text-t3" />
                <span className="text-sm font-medium text-t1">รูปแบบการชำระ</span>
              </div>
              <PaymentModeSelector
                total={order.total}
                mode={paymentMode}
                onModeChange={setPaymentMode}
                depositPercent={depositPercent}
                onDepositChange={setDepositPercent}
                installmentCount={installmentCount}
                onInstallmentChange={setInstallmentCount}
              />
            </div>
          )}

          {/* Line Items */}
          <div className="overflow-hidden rounded-lg border border-border">
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
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-t3">Subtotal</span><span className="text-t1">{formatThb(order.subtotal)}</span></div>
            {order.discount > 0 && <div className="flex justify-between"><span className="text-t3">Discount</span><span className="text-error">-{formatThb(order.discount)}</span></div>}
            <div className="flex justify-between border-t border-border pt-1 font-semibold"><span className="text-t1">Total</span><span className="text-t1">{formatThb(order.total)}</span></div>
            {order.paidAmount > 0 && <div className="flex justify-between"><span className="text-success">Paid</span><span className="text-success">{formatThb(order.paidAmount)}</span></div>}
          </div>

          {order.cancellationReason && (
            <div className="rounded-lg bg-error-bg p-3 text-sm text-error">Cancelled: {order.cancellationReason}</div>
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
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

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
        <div className="flex items-center gap-3">
          {summary && (
            <div className="rounded-xl border border-border bg-bg-card px-4 py-2 text-right shadow-sm">
              <div className="text-xs text-t3">Today's Revenue</div>
              <div className="text-lg font-bold text-success">{formatThb(summary.todayRevenue)}</div>
            </div>
          )}
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            สร้างออเดอร์
          </Button>
        </div>
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

      {/* Create Order Modal */}
      {showCreateModal && <CreateOrderModal onClose={() => setShowCreateModal(false)} />}
    </div>
  )
}
