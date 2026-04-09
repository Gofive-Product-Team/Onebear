import { useState } from 'react'
import { cn } from '@one-bear/ui'
import { Button } from '@/components/ui/Button'
import { Calendar, Plus, Pencil, Trash2, Clock, CheckCircle2, X } from 'lucide-react'
import {
  useBookingServices,
  useCreateBookingService,
  type BookingServiceItem,
} from '@/api/useBookings'

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS_TH = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสฯ', 'ศุกร์', 'เสาร์', 'อาทิตย์']

function formatThb(amount: number) {
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(amount)
}

// ─── Service Form Modal ────────────────────────────────────────────────────────

interface ServiceFormData {
  name: string
  duration: string
  price: string
  description: string
}

function ServiceFormModal({ onClose, onSave }: { onClose: () => void; onSave: (data: ServiceFormData) => void }) {
  const [form, setForm] = useState<ServiceFormData>({ name: '', duration: '60', price: '', description: '' })

  function handleSave() {
    if (!form.name || !form.price) return
    onSave(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="mx-4 w-full max-w-md rounded-xl border border-border bg-bg-card p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-t1">เพิ่มบริการ</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-t3 hover:bg-bg-hover"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-t2">ชื่อบริการ *</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="เช่น นัดปรึกษาสินค้า"
              className="w-full rounded-lg border border-border-input bg-bg-input px-3 py-2 text-sm text-t1 placeholder:text-t3 focus:border-primary focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-t2">ระยะเวลา</label>
              <select
                value={form.duration}
                onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                className="w-full rounded-lg border border-border-input bg-bg-input px-3 py-2 text-sm text-t1 focus:border-primary focus:outline-none"
              >
                <option value="30">30 นาที</option>
                <option value="45">45 นาที</option>
                <option value="60">60 นาที</option>
                <option value="90">90 นาที</option>
                <option value="120">120 นาที</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-t2">ราคา (฿) *</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                placeholder="0"
                min="0"
                className="w-full rounded-lg border border-border-input bg-bg-input px-3 py-2 text-sm text-t1 placeholder:text-t3 focus:border-primary focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-t2">คำอธิบาย</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              placeholder="รายละเอียดบริการ..."
              className="w-full rounded-lg border border-border-input bg-bg-input px-3 py-2 text-sm text-t1 placeholder:text-t3 focus:border-primary focus:outline-none resize-none"
            />
          </div>
        </div>
        <div className="mt-5 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>ยกเลิก</Button>
          <Button className="flex-1" onClick={handleSave} disabled={!form.name || !form.price}>บันทึก</Button>
        </div>
      </div>
    </div>
  )
}

// ─── Services Tab ──────────────────────────────────────────────────────────────

function ServicesTab() {
  const { data: apiServices } = useBookingServices()
  const createService = useCreateBookingService()
  const [showForm, setShowForm] = useState(false)
  const [localServices, setLocalServices] = useState<BookingServiceItem[]>([])
  const [toast, setToast] = useState('')
  const [toggleStates, setToggleStates] = useState<Record<string, boolean>>({})

  const services = [...(apiServices ?? []), ...localServices]

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  function handleSave(form: ServiceFormData) {
    const newService: BookingServiceItem = {
      id: Math.random().toString(36).slice(2),
      name: form.name,
      price: parseFloat(form.price) || 0,
      durationMinutes: parseInt(form.duration, 10),
      isActive: true,
      agentUserIds: [],
      description: form.description || null,
    }
    createService.mutate(
      { name: form.name, price: newService.price, durationMinutes: newService.durationMinutes, description: form.description },
      { onError: () => setLocalServices((prev) => [...prev, newService]) },
    )
    setLocalServices((prev) => [...prev, newService])
    setShowForm(false)
    showToast('เพิ่มบริการแล้ว')
  }

  function handleDelete(id: string) {
    setLocalServices((prev) => prev.filter((s) => s.id !== id))
  }

  function handleToggle(id: string, current: boolean) {
    setToggleStates((prev) => ({ ...prev, [id]: !current }))
  }

  return (
    <div className="space-y-4">
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-lg bg-success px-4 py-2 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
      <div className="flex items-center justify-between">
        <p className="text-sm text-t3">จัดการบริการที่ให้นัดหมาย</p>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          เพิ่มบริการ
        </Button>
      </div>

      {services.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-bg-input text-t3">
            <Calendar className="h-8 w-8" />
          </div>
          <div>
            <p className="text-sm font-semibold text-t1">ยังไม่มีบริการ</p>
            <p className="mt-0.5 text-xs text-t3">กดปุ่ม "เพิ่มบริการ" เพื่อเริ่มต้น</p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-bg-card shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-input/50">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-t3">ชื่อบริการ</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-t3">เวลา (นาที)</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-t3">ราคา (฿)</th>
                <th className="px-4 py-2.5 text-center text-xs font-medium text-t3">พนักงาน</th>
                <th className="px-4 py-2.5 text-center text-xs font-medium text-t3">สถานะ</th>
                <th className="px-4 py-2.5 text-center text-xs font-medium text-t3">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {services.map((svc) => {
                const isActive = toggleStates[svc.id] !== undefined ? (toggleStates[svc.id] as boolean) : svc.isActive
                return (
                  <tr key={svc.id} className="border-b border-border/50 hover:bg-bg-hover transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-t1">{svc.name}</div>
                      {svc.description && <div className="mt-0.5 text-xs text-t3 truncate max-w-[200px]">{svc.description}</div>}
                    </td>
                    <td className="px-4 py-3 text-right text-t2">{svc.durationMinutes}</td>
                    <td className="px-4 py-3 text-right font-medium text-t1">{formatThb(svc.price)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs text-t3">{svc.agentUserIds.length > 0 ? `${svc.agentUserIds.length} คน` : 'ทุกคน'}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggle(svc.id, isActive)}
                        className={cn(
                          'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                          isActive ? 'bg-success' : 'bg-bg-input',
                        )}
                      >
                        <span className={cn(
                          'inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform',
                          isActive ? 'translate-x-4.5' : 'translate-x-0.5',
                        )} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button className="rounded-lg p-1.5 text-t3 hover:bg-bg-hover hover:text-t1">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(svc.id)}
                          className="rounded-lg p-1.5 text-t3 hover:bg-error/10 hover:text-error"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm && <ServiceFormModal onClose={() => setShowForm(false)} onSave={handleSave} />}
    </div>
  )
}

// ─── Availability Tab ──────────────────────────────────────────────────────────

interface WorkingHours {
  enabled: boolean
  from: string
  to: string
}

interface BlockedDate {
  id: string
  date: string
  reason: string
}

function AvailabilityTab() {
  const [toast, setToast] = useState('')
  const [buffer, setBuffer] = useState('10')
  const [hours, setHours] = useState<WorkingHours[]>(
    DAYS_TH.map((_, i) => ({
      enabled: i < 5,
      from: '09:00',
      to: '18:00',
    })),
  )
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([])
  const [newBlockDate, setNewBlockDate] = useState('')
  const [newBlockReason, setNewBlockReason] = useState('')

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  function addBlockedDate() {
    if (!newBlockDate) return
    setBlockedDates((prev) => [
      ...prev,
      { id: Math.random().toString(36).slice(2), date: newBlockDate, reason: newBlockReason || 'วันหยุด' },
    ])
    setNewBlockDate('')
    setNewBlockReason('')
  }

  function removeBlockedDate(id: string) {
    setBlockedDates((prev) => prev.filter((d) => d.id !== id))
  }

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-lg bg-success px-4 py-2 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}

      {/* Working hours */}
      <div className="rounded-xl border border-border bg-bg-card p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-t1">เวลาทำงาน</h3>
        <div className="space-y-2">
          {DAYS_TH.map((day, idx) => (
            <div key={day} className="flex items-center gap-3">
              <button
                onClick={() => setHours((prev) => prev.map((h, i) => i === idx ? { ...h, enabled: !h.enabled } : h))}
                className={cn(
                  'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors',
                  hours[idx]?.enabled ? 'bg-primary' : 'bg-bg-input',
                )}
              >
                <span className={cn(
                  'inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform',
                  hours[idx]?.enabled ? 'translate-x-4.5' : 'translate-x-0.5',
                )} />
              </button>
              <span className={cn('w-16 text-sm', hours[idx]?.enabled ? 'text-t1 font-medium' : 'text-t3')}>{day}</span>
              {hours[idx]?.enabled ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="time"
                    value={hours[idx]?.from ?? '09:00'}
                    onChange={(e) => setHours((prev) => prev.map((h, i) => i === idx ? { ...h, from: e.target.value } : h))}
                    className="rounded-lg border border-border-input bg-bg-input px-2 py-1 text-sm text-t1 focus:border-primary focus:outline-none"
                  />
                  <span className="text-xs text-t3">ถึง</span>
                  <input
                    type="time"
                    value={hours[idx]?.to ?? '18:00'}
                    onChange={(e) => setHours((prev) => prev.map((h, i) => i === idx ? { ...h, to: e.target.value } : h))}
                    className="rounded-lg border border-border-input bg-bg-input px-2 py-1 text-sm text-t1 focus:border-primary focus:outline-none"
                  />
                </div>
              ) : (
                <span className="text-xs text-t3">วันหยุด</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Buffer */}
      <div className="rounded-xl border border-border bg-bg-card p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-t1">บัฟเฟอร์ระหว่างนัด</h3>
        <div className="flex items-center gap-3">
          <select
            value={buffer}
            onChange={(e) => setBuffer(e.target.value)}
            className="rounded-lg border border-border-input bg-bg-input px-3 py-2 text-sm text-t1 focus:border-primary focus:outline-none"
          >
            <option value="0">0 นาที</option>
            <option value="5">5 นาที</option>
            <option value="10">10 นาที</option>
            <option value="15">15 นาที</option>
            <option value="30">30 นาที</option>
          </select>
          <span className="text-sm text-t3">ระหว่างนัดหมายแต่ละครั้ง</span>
        </div>
      </div>

      {/* Blocked dates */}
      <div className="rounded-xl border border-border bg-bg-card p-4 shadow-sm space-y-3">
        <h3 className="text-sm font-semibold text-t1">วันหยุด / วันปิดทำการ</h3>
        <div className="flex items-end gap-2 flex-wrap">
          <div>
            <label className="mb-1 block text-xs font-medium text-t3">วันที่</label>
            <input
              type="date"
              value={newBlockDate}
              onChange={(e) => setNewBlockDate(e.target.value)}
              className="rounded-lg border border-border-input bg-bg-input px-3 py-2 text-sm text-t1 focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="mb-1 block text-xs font-medium text-t3">เหตุผล</label>
            <input
              value={newBlockReason}
              onChange={(e) => setNewBlockReason(e.target.value)}
              placeholder="เช่น วันหยุดสงกรานต์"
              className="w-full rounded-lg border border-border-input bg-bg-input px-3 py-2 text-sm text-t1 placeholder:text-t3 focus:border-primary focus:outline-none"
            />
          </div>
          <Button size="sm" onClick={addBlockedDate} disabled={!newBlockDate}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            เพิ่ม
          </Button>
        </div>

        {blockedDates.length > 0 && (
          <div className="space-y-1.5">
            {blockedDates.map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-lg bg-bg-input px-3 py-2 text-sm">
                <div>
                  <span className="font-medium text-t1">{new Date(d.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <span className="ml-2 text-t3">{d.reason}</span>
                </div>
                <button onClick={() => removeBlockedDate(d.id)} className="text-t3 hover:text-error p-1">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button onClick={() => showToast('บันทึกตารางงานแล้ว')} className="w-full sm:w-auto">บันทึกทั้งหมด</Button>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

type ConfigTab = 'services' | 'availability'

export function BookingSettings() {
  const [tab, setTab] = useState<ConfigTab>('services')

  const tabs: { key: ConfigTab; label: string; icon: React.ReactNode }[] = [
    { key: 'services', label: 'บริการ', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
    { key: 'availability', label: 'ตารางงาน', icon: <Clock className="h-3.5 w-3.5" /> },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-t1">การตั้งค่านัดหมาย</h2>
        <p className="mt-0.5 text-sm text-t3">กำหนดบริการ เวลาทำงาน และวันหยุด</p>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-bg-card p-1 shadow-sm">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all whitespace-nowrap',
              tab === t.key ? 'bg-primary text-white shadow-sm' : 'text-t2 hover:bg-bg-hover',
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'services' && <ServicesTab />}
      {tab === 'availability' && <AvailabilityTab />}
    </div>
  )
}
