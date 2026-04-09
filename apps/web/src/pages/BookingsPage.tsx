import { useState, useMemo } from 'react'
import { cn } from '@one-bear/ui'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  useBookings,
  useUpdateBookingStatus,
  type BookingItem,
} from '@/api/useBookings'
import {
  Calendar,
  Search,
  X,
  ChevronRight,
  Bell,
  BellRing,
} from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' }> = {
  Confirmed: { label: 'Confirmed', variant: 'default' },
  Completed: { label: 'Completed', variant: 'success' },
  Cancelled: { label: 'Cancelled', variant: 'secondary' },
  NoShow: { label: 'No Show', variant: 'destructive' },
  Rescheduled: { label: 'Rescheduled', variant: 'warning' },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' })
}

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
}

function formatThb(amount: number) {
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(amount)
}

// ─── Booking Detail Modal ─────────────────────────────────────────────────────

function BookingDetailModal({ booking, onClose }: { booking: BookingItem; onClose: () => void }) {
  const updateStatus = useUpdateBookingStatus()
  // Stub: randomly assign reminder status for demo
  const reminderSent = useMemo(() => booking.id.charCodeAt(0) % 2 === 0, [booking.id])
  const [localReminderSent, setLocalReminderSent] = useState(reminderSent)
  const [sending, setSending] = useState(false)
  const [toastMsg, setToastMsg] = useState('')

  function showToast(msg: string) {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 3000)
  }

  function handleSendReminder() {
    setSending(true)
    setTimeout(() => {
      setSending(false)
      setLocalReminderSent(true)
      showToast('ส่งแจ้งเตือนแล้ว')
    }, 800)
  }

  function handleAction(status: string) {
    if (status === 'Cancelled') {
      const reason = prompt('Cancellation reason:')
      if (!reason) return
      updateStatus.mutate({ bookingId: booking.id, body: { status, cancellationReason: reason } }, { onSuccess: onClose })
    } else {
      updateStatus.mutate({ bookingId: booking.id, body: { status } }, { onSuccess: onClose })
    }
  }

  const actions: Record<string, string[]> = {
    Confirmed: ['Completed', 'NoShow', 'Cancelled'],
  }
  const available = actions[booking.status] ?? []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="mx-4 w-full max-w-md rounded-xl border border-border bg-bg-card p-6 shadow-md" onClick={(e) => e.stopPropagation()}>
        {toastMsg && (
          <div className="mb-4 rounded-lg bg-success/10 border border-success/30 px-3 py-2 text-sm text-success font-medium">
            {toastMsg}
          </div>
        )}

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-t1">{booking.bookingId}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-t3 hover:bg-bg-hover"><X className="h-4 w-4" /></button>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between"><span className="text-t3">Service</span><span className="text-t1 font-medium">{booking.serviceName}</span></div>
          <div className="flex justify-between"><span className="text-t3">Price</span><span className="text-t1">{formatThb(booking.servicePrice)}</span></div>
          <div className="flex justify-between"><span className="text-t3">Duration</span><span className="text-t1">{booking.serviceDurationMinutes} min</span></div>
          <div className="flex justify-between"><span className="text-t3">Date</span><span className="text-t1">{formatDate(booking.dateTimestamp)}</span></div>
          <div className="flex justify-between"><span className="text-t3">Time</span><span className="text-t1">{formatTime(booking.dateTimestamp)} — {formatTime(booking.endTimestamp)}</span></div>
          <div className="flex justify-between"><span className="text-t3">Customer</span><span className="text-t1">{booking.customerName ?? '—'}</span></div>
          <div className="flex justify-between"><span className="text-t3">Agent</span><span className="text-t1">{booking.agentName ?? 'Any'}</span></div>
          <div className="flex justify-between"><span className="text-t3">Status</span><Badge variant={STATUS_CONFIG[booking.status]?.variant ?? 'secondary'}>{booking.status}</Badge></div>
          {booking.customerNote && <div className="rounded-lg bg-bg-input p-2 text-xs text-t2">Note: {booking.customerNote}</div>}

          {/* Reminder status */}
          <div className="flex items-center justify-between rounded-lg bg-bg-input px-3 py-2.5">
            <div className="flex items-center gap-2">
              {localReminderSent ? (
                <BellRing className="h-4 w-4 text-success" />
              ) : (
                <Bell className="h-4 w-4 text-t3" />
              )}
              <span className="text-xs text-t2">
                {localReminderSent ? 'ส่งแจ้งเตือน 24ชม. แล้ว ✅' : 'ยังไม่ส่งแจ้งเตือน'}
              </span>
            </div>
            {!localReminderSent && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleSendReminder}
                disabled={sending}
                className="text-xs"
              >
                {sending ? 'กำลังส่ง...' : 'ส่งแจ้งเตือนทันที'}
              </Button>
            )}
          </div>
        </div>

        {available.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {available.map((s) => (
              <Button key={s} size="sm" variant={s === 'Cancelled' || s === 'NoShow' ? 'outline' : 'default'}
                onClick={() => handleAction(s)} disabled={updateStatus.isPending}>
                {STATUS_CONFIG[s]?.label ?? s}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Bookings List Tab ─────────────────────────────────────────────────────────

// Services & availability config moved to Settings > Booking

function BookingsListTab() {
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<BookingItem | null>(null)

  const params = useMemo(() => {
    const p: Record<string, string> = { pageSize: '50' }
    if (statusFilter) p.status = statusFilter
    if (search) p.search = search
    return p
  }, [statusFilter, search])

  const { data, isLoading } = useBookings(params)
  const bookings = data?.data ?? []

  const statusTabs = [
    { key: '', label: 'All' },
    { key: 'Confirmed', label: 'Upcoming' },
    { key: 'Completed', label: 'Completed' },
    { key: 'NoShow', label: 'No Show' },
    { key: 'Cancelled', label: 'Cancelled' },
  ]

  return (
    <>
      {/* Status sub-tabs */}
      <div className="flex gap-1 overflow-x-auto">
        {statusTabs.map((tab) => (
          <button key={tab.key} onClick={() => setStatusFilter(tab.key)}
            className={cn('rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors',
              statusFilter === tab.key ? 'bg-primary text-white' : 'bg-bg-input text-t2 hover:bg-bg-hover')}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-t3" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by booking ID or customer..."
          className="w-full rounded-lg border border-border-input bg-bg-input py-2 pl-9 pr-3 text-sm text-t1 placeholder:text-t3 focus:border-primary focus:outline-none" />
        {search && <button onClick={() => setSearch('')} className="absolute right-3 top-2.5 text-t3 hover:text-t1"><X className="h-4 w-4" /></button>}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex h-40 items-center justify-center text-sm text-t3">Loading bookings...</div>
      ) : bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-bg-input text-t3">
            <Calendar className="h-10 w-10" />
          </div>
          <div><p className="text-base font-semibold text-t1">No bookings yet</p><p className="mt-1 text-sm text-t2">Appointments will appear here.</p></div>
        </div>
      ) : (
        <div className="space-y-2">
          {bookings.map((b) => (
            <button key={b.id} onClick={() => setSelected(b)}
              className="flex w-full items-center justify-between rounded-xl border border-border bg-bg-card p-4 text-left shadow-sm transition-all hover:bg-bg-hover">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-alpha text-primary">
                  <Calendar className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-t1">{b.serviceName}</span>
                    <Badge variant={STATUS_CONFIG[b.status]?.variant ?? 'secondary'}>{STATUS_CONFIG[b.status]?.label ?? b.status}</Badge>
                  </div>
                  <p className="truncate text-sm text-t3">
                    {b.customerName ?? 'Walk-in'} &middot; {b.agentName ?? 'Any agent'} &middot; {formatDate(b.dateTimestamp)} {formatTime(b.dateTimestamp)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 pl-4">
                <span className="text-sm font-medium text-t1">{formatThb(b.servicePrice)}</span>
                <ChevronRight className="h-4 w-4 text-t3" />
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && <BookingDetailModal booking={selected} onClose={() => setSelected(null)} />}
    </>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function BookingsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-t1">Bookings</h1>
          <p className="mt-0.5 text-sm text-t2">จัดการนัดหมายและการจองทั้งหมด</p>
        </div>
      </div>
      <BookingsListTab />
    </div>
  )
}
