import { useState, useMemo } from 'react'
import { cn } from '@one-bear/ui'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  useFollowUps,
  useUpdateFollowUpStatus,
  useCreateFollowUp,
  type FollowUpItem,
  type CreateFollowUpBody,
} from '@/api/useFollowUps'
import {
  RefreshCw,
  Search,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  StopCircle,
  Plus,
  Settings,
  Save,
  Eye,
} from 'lucide-react'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PLATFORM_COLORS: Record<string, string> = {
  LINE: 'bg-[#06C755] text-white',
  Facebook: 'bg-[#1877F2] text-white',
  Instagram: 'bg-[#E1306C] text-white',
  WhatsApp: 'bg-[#25D366] text-white',
}

const PLATFORMS = ['LINE', 'Facebook', 'Instagram', 'WhatsApp']

const STATUS_CONFIG: Record<FollowUpItem['status'], { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive'; icon: React.ReactNode }> = {
  Queued: { label: 'Queued', variant: 'warning', icon: <Clock className="h-3 w-3" /> },
  Sent: { label: 'Sent', variant: 'success', icon: <CheckCircle2 className="h-3 w-3" /> },
  Failed: { label: 'Failed', variant: 'destructive', icon: <XCircle className="h-3 w-3" /> },
  Stopped: { label: 'Stopped', variant: 'secondary', icon: <StopCircle className="h-3 w-3" /> },
}

function formatRelativeTime(timestamp: number) {
  const diff = timestamp - Date.now()
  if (diff < 0) {
    const past = Math.abs(diff)
    const minutes = Math.floor(past / 60000)
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `in ${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `in ${hours}h`
  return `in ${Math.floor(hours / 24)}d`
}

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
}

const AVATAR_COLORS = [
  'bg-[#7c3aed]',
  'bg-[#0ea5e9]',
  'bg-[#10b981]',
  'bg-[#f59e0b]',
  'bg-[#ef4444]',
]

function getAvatarColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length] ?? 'bg-[#7c3aed]'
}

// ─── Variable Chips ───────────────────────────────────────────────────────────

const TEMPLATE_VARS = [
  { key: '{{customer_name}}', label: 'ชื่อลูกค้า', sample: 'คุณสมชาย' },
  { key: '{{product_name}}', label: 'ชื่อสินค้า', sample: 'Teddy Bear (M)' },
  { key: '{{product_price}}', label: 'ราคา', sample: '฿790' },
  { key: '{{product_stock}}', label: 'สต๊อก', sample: '15 ชิ้น' },
]

function renderTemplate(template: string): string {
  let result = template
  for (const v of TEMPLATE_VARS) {
    result = result.split(v.key).join(v.sample)
  }
  return result
}

interface VariableChipsProps {
  onInsert: (variable: string) => void
}

function VariableChips({ onInsert }: VariableChipsProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {TEMPLATE_VARS.map((v) => (
        <button
          key={v.key}
          type="button"
          onClick={() => onInsert(v.key)}
          className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs text-primary hover:bg-primary/20"
        >
          {v.key}
        </button>
      ))}
    </div>
  )
}

// ─── Channel Config Panel ─────────────────────────────────────────────────────

interface ChannelConfig {
  enabled: boolean
  triggerDelay: string
  maxAttempts: number
  template: string
}

const DELAY_OPTIONS = ['1h', '3h', '6h', '12h', '24h']
const DEFAULT_TEMPLATE = 'สวัสดีคุณ {{customer_name}} 👋\nเราสังเกตว่าคุณสนใจ {{product_name}} ราคา {{product_price}}\nสต๊อกเหลือ {{product_stock}} เลยอยากแจ้งให้ทราบค่ะ'

function ChannelConfigPanel() {
  const [configs, setConfigs] = useState<Record<string, ChannelConfig>>(
    Object.fromEntries(
      PLATFORMS.map((p) => [
        p,
        { enabled: true, triggerDelay: '3h', maxAttempts: 3, template: DEFAULT_TEMPLATE },
      ]),
    ),
  )
  const [savedPlatform, setSavedPlatform] = useState<string | null>(null)
  const [previewPlatform, setPreviewPlatform] = useState<string | null>(null)

  function update(platform: string, patch: Partial<ChannelConfig>) {
    setConfigs((prev) => ({ ...prev, [platform]: { ...prev[platform]!, ...patch } }))
  }

  function insertVar(platform: string, variable: string) {
    const current = configs[platform]?.template ?? ''
    update(platform, { template: current + variable })
  }

  function save(platform: string) {
    setSavedPlatform(platform)
    setTimeout(() => setSavedPlatform(null), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-warning/10 px-4 py-3 text-sm text-warning flex items-center gap-2">
        <Settings className="h-4 w-4 shrink-0" />
        <span>ตั้งค่า Follow-up อัตโนมัติแยกตามช่องทาง</span>
      </div>

      {PLATFORMS.map((platform) => {
        const cfg = configs[platform]!
        const isShowingPreview = previewPlatform === platform
        return (
          <div key={platform} className="rounded-xl border border-border bg-bg-card p-5 shadow-sm space-y-4">
            {/* Platform header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={cn('rounded-full px-3 py-1 text-sm font-semibold', PLATFORM_COLORS[platform] ?? 'bg-bg-input text-t2')}>
                  {platform}
                </span>
              </div>
              {/* Toggle */}
              <button
                type="button"
                onClick={() => update(platform, { enabled: !cfg.enabled })}
                className={cn(
                  'relative h-6 w-11 rounded-full transition-colors',
                  cfg.enabled ? 'bg-primary' : 'bg-border',
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                    cfg.enabled ? 'translate-x-5' : 'translate-x-0.5',
                  )}
                />
              </button>
            </div>

            {cfg.enabled && (
              <div className="space-y-3">
                {/* Trigger delay + Max attempts */}
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="mb-1 block text-xs font-medium text-t2">ส่งหลังจาก</label>
                    <select
                      value={cfg.triggerDelay}
                      onChange={(e) => update(platform, { triggerDelay: e.target.value })}
                      className="w-full rounded-lg border border-border-input bg-bg-input px-3 py-2 text-sm text-t1 focus:border-primary focus:outline-none"
                    >
                      {DELAY_OPTIONS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-32">
                    <label className="mb-1 block text-xs font-medium text-t2">ครั้งสูงสุด</label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={cfg.maxAttempts}
                      onChange={(e) => update(platform, { maxAttempts: Math.min(5, Math.max(1, Number(e.target.value))) })}
                      className="w-full rounded-lg border border-border-input bg-bg-input px-3 py-2 text-sm text-t1 focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                {/* Template */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-t2">เทมเพลตข้อความ</label>
                  <textarea
                    value={cfg.template}
                    onChange={(e) => update(platform, { template: e.target.value })}
                    rows={4}
                    className="w-full resize-none rounded-lg border border-border-input bg-bg-input px-3 py-2 text-sm text-t1 placeholder:text-t3 focus:border-primary focus:outline-none"
                  />
                  <div className="mt-1.5">
                    <p className="mb-1 text-xs text-t3">แทรกตัวแปร:</p>
                    <VariableChips onInsert={(v) => insertVar(platform, v)} />
                  </div>
                </div>

                {/* Preview */}
                <div>
                  <button
                    type="button"
                    onClick={() => setPreviewPlatform(isShowingPreview ? null : platform)}
                    className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    {isShowingPreview ? 'ซ่อน Preview' : 'ดู Preview'}
                  </button>
                  {isShowingPreview && (
                    <div className="mt-2 rounded-lg border border-border bg-bg-input px-3 py-2 text-sm text-t1 whitespace-pre-wrap">
                      {renderTemplate(cfg.template)}
                    </div>
                  )}
                </div>

                {/* Save */}
                <div className="flex items-center justify-between">
                  {savedPlatform === platform && (
                    <span className="text-xs text-success">บันทึกแล้ว!</span>
                  )}
                  <div className="ml-auto">
                    <Button size="sm" onClick={() => save(platform)}>
                      <Save className="mr-1.5 h-3.5 w-3.5" />
                      บันทึก
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Create Follow-up Modal ───────────────────────────────────────────────────

const OUT_OF_WINDOW_OPTIONS = [
  { value: 'next_morning', label: 'ส่งตอน 09:00 วันถัดไป' },
  { value: 'wait', label: 'รอ' },
  { value: 'cancel', label: 'ยกเลิก' },
]

function CreateFollowUpModal({ onClose }: { onClose: () => void }) {
  const createFollowUp = useCreateFollowUp()
  const [customerName, setCustomerName] = useState('')
  const [channel, setChannel] = useState('LINE')
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('09:00')
  const [message, setMessage] = useState(DEFAULT_TEMPLATE)
  const [outOfWindow, setOutOfWindow] = useState('next_morning')

  function insertVar(variable: string) {
    setMessage((prev) => prev + variable)
  }

  function handleSubmit() {
    if (!customerName.trim()) return alert('กรุณากรอกชื่อลูกค้า')
    if (!scheduleDate) return alert('กรุณาเลือกวันที่')
    if (!message.trim()) return alert('กรุณาใส่ข้อความ')

    const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}:00`).getTime()
    const body: CreateFollowUpBody = {
      customerId: 'manual',
      customerName: customerName.trim(),
      channelPlatform: channel,
      scheduledAt,
      message: message.trim(),
    }

    createFollowUp.mutate(body, { onSuccess: onClose })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="mx-4 w-full max-w-lg rounded-xl border border-border bg-bg-card shadow-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-t1">สร้าง Follow-up</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-t3 hover:bg-bg-hover">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[70vh] overflow-y-auto p-6 space-y-4">
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

          {/* Channel */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-t1">ช่องทาง</label>
            <div className="flex gap-2">
              {PLATFORMS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setChannel(p)}
                  className={cn(
                    'flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all',
                    channel === p
                      ? PLATFORM_COLORS[p] + ' border-transparent'
                      : 'border-border text-t2 hover:bg-bg-hover',
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Schedule */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-t1">วันและเวลาที่ต้องการส่ง</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="flex-1 rounded-lg border border-border-input bg-bg-input px-3 py-2 text-sm text-t1 focus:border-primary focus:outline-none"
              />
              <input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="w-28 rounded-lg border border-border-input bg-bg-input px-3 py-2 text-sm text-t1 focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Message template */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-t1">ข้อความ</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full resize-none rounded-lg border border-border-input bg-bg-input px-3 py-2 text-sm text-t1 placeholder:text-t3 focus:border-primary focus:outline-none"
            />
            <div className="mt-1.5">
              <p className="mb-1 text-xs text-t3">แทรกตัวแปร:</p>
              <VariableChips onInsert={insertVar} />
            </div>
          </div>

          {/* Out-of-window action */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-t1">ถ้าอยู่นอกช่วงเวลาส่ง (09:00–21:00)</label>
            <div className="space-y-1.5">
              {OUT_OF_WINDOW_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="outOfWindow"
                    value={opt.value}
                    checked={outOfWindow === opt.value}
                    onChange={() => setOutOfWindow(opt.value)}
                    className="accent-primary"
                  />
                  <span className="text-sm text-t1">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
          <Button variant="outline" onClick={onClose}>ยกเลิก</Button>
          <Button onClick={handleSubmit} disabled={createFollowUp.isPending}>
            {createFollowUp.isPending ? 'กำลังสร้าง...' : 'สร้าง Follow-up'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Follow-up Card ───────────────────────────────────────────────────────────

function FollowUpCard({ item }: { item: FollowUpItem }) {
  const updateStatus = useUpdateFollowUpStatus()
  const statusCfg = STATUS_CONFIG[item.status]

  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-bg-card p-4 shadow-sm">
      {/* Avatar */}
      <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white', getAvatarColor(item.customerName))}>
        {getInitials(item.customerName)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-t1 text-sm">{item.customerName}</span>
          <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', PLATFORM_COLORS[item.channelPlatform] ?? 'bg-bg-input text-t2')}>
            {item.channelPlatform}
          </span>
          <Badge variant={statusCfg.variant}>
            {statusCfg.icon}
            <span className="ml-1">{statusCfg.label}</span>
          </Badge>
        </div>
        <p className="mt-1 truncate text-sm text-t3">{item.message}</p>
        <p className="mt-1 text-xs text-t3">
          <Clock className="mr-1 inline h-3 w-3" />
          {formatRelativeTime(item.scheduledAt)}
        </p>
      </div>

      {/* Action */}
      {item.status === 'Queued' && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => updateStatus.mutate({ followUpId: item.id, body: { status: 'Stopped' } })}
          disabled={updateStatus.isPending}
          className="shrink-0 text-error hover:border-error hover:bg-error/10"
        >
          <StopCircle className="h-3.5 w-3.5 mr-1" />
          Stop
        </Button>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const STATUS_TABS: { key: string; label: string }[] = [
  { key: '', label: 'All' },
  { key: 'Queued', label: 'Queued' },
  { key: 'Sent', label: 'Sent' },
  { key: 'Failed', label: 'Failed' },
  { key: 'Stopped', label: 'Stopped' },
]

type ActiveView = 'list' | 'settings'

export function FollowUpPage() {
  const [activeView, setActiveView] = useState<ActiveView>('list')
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)

  const params = useMemo(() => {
    const p: Record<string, string> = { pageSize: '50' }
    if (statusFilter) p.status = statusFilter
    if (search) p.search = search
    return p
  }, [statusFilter, search])

  const { data, isLoading } = useFollowUps(params)
  const items = data?.data ?? []

  const summary = useMemo(() => {
    const all: FollowUpItem[] = data?.data ?? []
    return {
      queued: all.filter((i) => i.status === 'Queued').length,
      sent: all.filter((i) => i.status === 'Sent').length,
      failed: all.filter((i) => i.status === 'Failed').length,
      stopped: all.filter((i) => i.status === 'Stopped').length,
    }
  }, [data])

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-t1">Follow-up Management</h1>
          <p className="mt-0.5 text-sm text-t2">จัดการข้อความ follow-up อัตโนมัติ</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          สร้าง Follow-up
        </Button>
      </div>

      {/* Send window banner */}
      <div className="flex items-center gap-2 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>ส่งเฉพาะ 09:00–21:00 น. (Bangkok UTC+7) — ข้อความที่ตั้งเวลานอกช่วงนี้จะถูกส่งในวันถัดไป</span>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Queued', value: summary.queued, color: 'text-warning' },
          { label: 'Sent Today', value: summary.sent, color: 'text-success' },
          { label: 'Failed', value: summary.failed, color: 'text-error' },
          { label: 'Stopped', value: summary.stopped, color: 'text-t3' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-bg-card p-3 shadow-sm">
            <div className="text-xs text-t3">{s.label}</div>
            <div className={cn('mt-1 text-2xl font-bold', s.color)}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tab bar: status filters + settings */}
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-bg-card p-1 shadow-sm">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveView('list'); setStatusFilter(tab.key) }}
            className={cn(
              'flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-all whitespace-nowrap',
              activeView === 'list' && statusFilter === tab.key
                ? 'bg-primary text-white shadow-sm'
                : 'text-t2 hover:bg-bg-hover',
            )}
          >
            {tab.label}
          </button>
        ))}
        <button
          onClick={() => setActiveView('settings')}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all whitespace-nowrap',
            activeView === 'settings'
              ? 'bg-primary text-white shadow-sm'
              : 'text-t2 hover:bg-bg-hover',
          )}
        >
          <Settings className="h-3.5 w-3.5" />
          ตั้งค่า
        </button>
      </div>

      {/* Settings view */}
      {activeView === 'settings' ? (
        <ChannelConfigPanel />
      ) : (
        <>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-t3" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาตามชื่อลูกค้าหรือข้อความ..."
              className="w-full rounded-lg border border-border-input bg-bg-input py-2 pl-9 pr-3 text-sm text-t1 placeholder:text-t3 focus:border-primary focus:outline-none"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-2.5 text-t3 hover:text-t1">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* List */}
          {isLoading ? (
            <div className="flex h-40 items-center justify-center text-sm text-t3">Loading follow-ups...</div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-bg-input text-t3">
                <RefreshCw className="h-10 w-10" />
              </div>
              <div>
                <p className="text-base font-semibold text-t1">ยังไม่มี follow-up</p>
                <p className="mt-1 text-sm text-t2">สร้าง follow-up เพื่อส่งข้อความหาลูกค้าอัตโนมัติ</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <FollowUpCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Create Follow-up Modal */}
      {showCreateModal && <CreateFollowUpModal onClose={() => setShowCreateModal(false)} />}
    </div>
  )
}
