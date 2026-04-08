import { useState } from 'react'
import { cn } from '@one-bear/ui'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  useAiAgentConfig,
  useUpdateAiAgentConfig,
  useAiAgentStats,
  useAiHandoffQueue,
  useRecentAiConversations,
  type AiAgentConfig,
  type HandoffQueueItem,
  type RecentAiConversation,
  type ChannelAiConfig,
  type FaqItem,
} from '@/api/useAiAgent'
import {
  Bot,
  Zap,
  Users,
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  ArrowRight,
  Lock,
  Upload,
  Plus,
  Edit2,
  Trash2,
  X,
  Clock,
  ShoppingCart,
  BarChart2,
} from 'lucide-react'

// ─── Stub Data ────────────────────────────────────────────────────────────────

const STUB_CHANNELS: ChannelAiConfig[] = [
  { channelId: 'ch-line', platform: 'LINE', channelName: 'LINE Official Account', aiEnabled: true, overrideGlobal: false, confidenceThreshold: 70 },
  { channelId: 'ch-fb', platform: 'Facebook', channelName: 'Facebook Page', aiEnabled: true, overrideGlobal: false, confidenceThreshold: 70 },
  { channelId: 'ch-ig', platform: 'Instagram', channelName: 'Instagram Business', aiEnabled: false, overrideGlobal: false, confidenceThreshold: 70 },
  { channelId: 'ch-wa', platform: 'WhatsApp', channelName: 'WhatsApp Business', aiEnabled: true, overrideGlobal: true, confidenceThreshold: 85 },
]

const STUB_FAQS: FaqItem[] = [
  { id: 'faq-1', question: 'วิธีสั่งสินค้าทำอย่างไร?', answer: 'สามารถสั่งสินค้าได้ผ่านทางเว็บไซต์ หรือส่งข้อความมาที่ inbox ของเราได้เลยค่ะ', category: 'การสั่งซื้อ', updatedAt: Date.now() - 86400000 * 2 },
  { id: 'faq-2', question: 'สินค้าจัดส่งภายในกี่วัน?', answer: 'จัดส่งภายใน 1-3 วันทำการหลังยืนยันการชำระเงิน สำหรับกรุงเทพฯ และปริมณฑล 1-2 วัน ต่างจังหวัด 2-3 วันค่ะ', category: 'การจัดส่ง', updatedAt: Date.now() - 86400000 },
  { id: 'faq-3', question: 'คืนสินค้าได้ไหม?', answer: 'รับคืนสินค้าภายใน 7 วัน หากสินค้าชำรุดหรือไม่ตรงตามที่สั่ง กรุณาถ่ายรูปสินค้าและส่งมาให้ทีมงานตรวจสอบก่อนนะคะ', category: 'การคืนสินค้า', updatedAt: Date.now() - 86400000 * 5 },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRelativeTime(timestamp: number) {
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
}

function ConfidenceBadge({ score }: { score: number }) {
  if (score >= 70) return <Badge variant="success">High {score}%</Badge>
  if (score >= 40) return <Badge variant="warning">Medium {score}%</Badge>
  return <Badge variant="destructive">Low {score}%</Badge>
}

const PLATFORM_COLORS: Record<string, string> = {
  LINE: 'bg-[#06C755] text-white',
  Facebook: 'bg-[#1877F2] text-white',
  Instagram: 'bg-[#E1306C] text-white',
  WhatsApp: 'bg-[#25D366] text-white',
}

const PLATFORM_ICONS: Record<string, string> = {
  LINE: 'L',
  Facebook: 'f',
  Instagram: 'IG',
  WhatsApp: 'W',
}

// ─── Toggle Switch ─────────────────────────────────────────────────────────────

function ToggleSwitch({ checked, onChange, large }: { checked: boolean; onChange: (v: boolean) => void; large?: boolean }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none',
        large ? 'h-8 w-14' : 'h-6 w-11',
        checked ? 'bg-primary' : 'bg-bg-input',
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block rounded-full bg-white shadow-md transition-transform duration-200',
          large ? 'h-6 w-6' : 'h-4 w-4',
          checked
            ? large ? 'translate-x-6' : 'translate-x-5'
            : 'translate-x-0',
        )}
      />
    </button>
  )
}

// ─── Handoff Card ─────────────────────────────────────────────────────────────

function HandoffCard({ item }: { item: HandoffQueueItem }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-bg-card p-4 shadow-sm">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warning/10 text-warning">
          <AlertTriangle className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-t1 text-sm truncate">{item.customerName}</span>
            <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium shrink-0', PLATFORM_COLORS[item.channelPlatform] ?? 'bg-bg-input text-t2')}>
              {item.channelPlatform}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-t3 truncate">{item.handoffReason}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <ConfidenceBadge score={item.confidenceScore} />
        <Button size="sm">
          รับแชท
          <ArrowRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

// ─── Recent Conversation Row ──────────────────────────────────────────────────

function ConversationRow({ conv }: { conv: RecentAiConversation }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-bg-card px-4 py-3">
      <div className="flex items-center gap-2 min-w-0">
        <MessageSquare className="h-4 w-4 shrink-0 text-t3" />
        <span className="text-sm text-t1 truncate">{conv.customerName}</span>
        <span className={cn('rounded-full px-1.5 py-0.5 text-xs font-medium shrink-0', PLATFORM_COLORS[conv.channelPlatform] ?? 'bg-bg-input text-t2')}>
          {conv.channelPlatform}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {conv.resolved && <CheckCircle2 className="h-3.5 w-3.5 text-success" />}
        <ConfidenceBadge score={conv.confidenceScore} />
        <span className="text-xs text-t3">{formatRelativeTime(conv.startedAt)}</span>
      </div>
    </div>
  )
}

// ─── Channel Row ──────────────────────────────────────────────────────────────

function ChannelRow({
  channel,
  globalThreshold,
  onChange,
}: {
  channel: ChannelAiConfig
  globalThreshold: number
  onChange: (updated: ChannelAiConfig) => void
}) {
  const effectiveThreshold = channel.overrideGlobal ? channel.confidenceThreshold : globalThreshold

  return (
    <div className="rounded-xl border border-border bg-bg-card p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold', PLATFORM_COLORS[channel.platform] ?? 'bg-bg-input text-t2')}>
            {PLATFORM_ICONS[channel.platform]}
          </div>
          <div>
            <div className="text-sm font-semibold text-t1">{channel.channelName}</div>
            <div className="text-xs text-t3">{channel.platform}</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-t3">Override global</span>
            <ToggleSwitch
              checked={channel.overrideGlobal}
              onChange={(v) => onChange({ ...channel, overrideGlobal: v })}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-t3">Enable AI</span>
            <ToggleSwitch
              checked={channel.aiEnabled}
              onChange={(v) => onChange({ ...channel, aiEnabled: v })}
            />
          </div>
        </div>
      </div>
      {channel.overrideGlobal && (
        <div className="space-y-1 pt-1 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs text-t3">Confidence Threshold (override)</span>
            <span className="text-xs font-bold text-primary">{effectiveThreshold}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={channel.confidenceThreshold}
            onChange={(e) => onChange({ ...channel, confidenceThreshold: Number(e.target.value) })}
            className="w-full accent-primary"
          />
        </div>
      )}
    </div>
  )
}

// ─── FAQ Modal ────────────────────────────────────────────────────────────────

function FaqModal({
  item,
  onSave,
  onClose,
}: {
  item: Partial<FaqItem> | null
  onSave: (faq: FaqItem) => void
  onClose: () => void
}) {
  const [question, setQuestion] = useState(item?.question ?? '')
  const [answer, setAnswer] = useState(item?.answer ?? '')
  const [category, setCategory] = useState(item?.category ?? '')

  function handleSave() {
    if (!question.trim() || !answer.trim()) return
    onSave({
      id: item?.id ?? `faq-${Date.now()}`,
      question: question.trim(),
      answer: answer.trim(),
      category: category.trim() || 'ทั่วไป',
      updatedAt: Date.now(),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-t1">{item?.id ? 'แก้ไข FAQ' : 'เพิ่ม FAQ'}</h3>
          <button onClick={onClose} className="text-t3 hover:text-t1">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-t2">คำถาม</label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-border bg-bg-input px-3 py-2 text-sm text-t1 focus:border-primary focus:outline-none"
              placeholder="ลูกค้าถามว่าอะไร?"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-t2">คำตอบ</label>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-border bg-bg-input px-3 py-2 text-sm text-t1 focus:border-primary focus:outline-none"
              placeholder="AI จะตอบว่าอะไร?"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-t2">หมวดหมู่</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg-input px-3 py-2 text-sm text-t1 focus:border-primary focus:outline-none"
              placeholder="เช่น การสั่งซื้อ, การจัดส่ง"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>ยกเลิก</Button>
          <Button onClick={handleSave}>บันทึก</Button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function AiAgentPage() {
  const { data: config } = useAiAgentConfig()
  const { data: stats } = useAiAgentStats()
  const { data: handoffQueue } = useAiHandoffQueue()
  const { data: recentConvs } = useRecentAiConversations()
  const updateConfig = useUpdateAiAgentConfig()

  const [localConfig, setLocalConfig] = useState<Partial<AiAgentConfig>>({})
  const [channels, setChannels] = useState<ChannelAiConfig[]>(STUB_CHANNELS)
  const [faqs, setFaqs] = useState<FaqItem[]>(STUB_FAQS)
  const [faqModal, setFaqModal] = useState<Partial<FaqItem> | null | false>(false)

  const effectiveConfig: AiAgentConfig = {
    isEnabled: localConfig.isEnabled ?? config?.isEnabled ?? false,
    confidenceThreshold: localConfig.confidenceThreshold ?? config?.confidenceThreshold ?? 70,
    tone: localConfig.tone ?? config?.tone ?? 'casual',
    autoHandoffEnabled: localConfig.autoHandoffEnabled ?? config?.autoHandoffEnabled ?? true,
  }

  function update(patch: Partial<AiAgentConfig>) {
    setLocalConfig((prev) => ({ ...prev, ...patch }))
    updateConfig.mutate(patch)
  }

  const queue = handoffQueue ?? []
  const conversations = (recentConvs ?? []).slice(0, 10)

  const toneOptions: Array<{ value: AiAgentConfig['tone']; label: string }> = [
    { value: 'casual', label: 'Casual' },
    { value: 'formal', label: 'Formal' },
    { value: 'cute', label: 'Cute' },
  ]

  function handleSaveFaq(faq: FaqItem) {
    setFaqs((prev) => {
      const idx = prev.findIndex((f) => f.id === faq.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = faq
        return next
      }
      return [...prev, faq]
    })
    setFaqModal(false)
  }

  function handleDeleteFaq(id: string) {
    setFaqs((prev) => prev.filter((f) => f.id !== id))
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-t1">AI Sales Agent</h1>
          <p className="mt-0.5 text-sm text-t2">จัดการ AI ช่วยขายอัตโนมัติ</p>
        </div>
        {/* Master toggle */}
        <div className={cn(
          'flex items-center gap-3 rounded-xl border px-4 py-3 shadow-sm transition-colors',
          effectiveConfig.isEnabled ? 'border-primary bg-primary-alpha' : 'border-border bg-bg-card',
        )}>
          <Bot className={cn('h-5 w-5', effectiveConfig.isEnabled ? 'text-primary' : 'text-t3')} />
          <div>
            <div className="text-sm font-semibold text-t1">AI Sales Agent</div>
            <div className="text-xs text-t3">{effectiveConfig.isEnabled ? 'กำลังทำงาน' : 'ปิดใช้งาน'}</div>
          </div>
          <ToggleSwitch
            large
            checked={effectiveConfig.isEnabled}
            onChange={(v) => update({ isEnabled: v })}
          />
        </div>
      </div>

      {/* Stats row — 6 tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border border-border bg-bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-primary">
            <Bot className="h-4 w-4" />
            <span className="text-xs font-medium">AI จัดการวันนี้</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-t1">{stats?.chatsHandledToday ?? '--'}</div>
          <div className="mt-0.5 text-xs text-t3">จาก {stats?.totalChatsToday ?? '--'} แชทรวม</div>
        </div>
        <div className="rounded-xl border border-border bg-bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-warning">
            <Users className="h-4 w-4" />
            <span className="text-xs font-medium">Handoff Rate</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-t1">
            {stats ? `${(stats.handoffRate * 100).toFixed(1)}%` : '--'}
          </div>
          <div className="mt-0.5 text-xs text-t3">อัตราส่ง Handoff</div>
        </div>
        <div className="rounded-xl border border-border bg-bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-success">
            <Zap className="h-4 w-4" />
            <span className="text-xs font-medium">Avg Confidence</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-t1">
            {stats ? `${(stats.avgConfidenceScore * 100).toFixed(0)}%` : '--'}
          </div>
          <div className="mt-0.5 text-xs text-t3">ความมั่นใจเฉลี่ย</div>
        </div>
        <div className="rounded-xl border border-border bg-bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-error">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs font-medium">อัตราส่ง Handoff</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-t1">
            {stats ? `${(stats.handoffRate * 100).toFixed(0)}%` : '18%'}
          </div>
          <div className="mt-0.5 text-xs text-t3">ส่งต่อ agent</div>
        </div>
        <div className="rounded-xl border border-border bg-bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-blue-500">
            <Clock className="h-4 w-4" />
            <span className="text-xs font-medium">เวลาตอบเฉลี่ย</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-t1">1.4s</div>
          <div className="mt-0.5 text-xs text-t3">ต่ำกว่า 2 วิ ✓</div>
        </div>
        <div className="rounded-xl border border-border bg-bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-500">
            <ShoppingCart className="h-4 w-4" />
            <span className="text-xs font-medium">AI ปิดออเดอร์วันนี้</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-t1">฿4,820</div>
          <div className="mt-0.5 text-xs text-t3">12 ออเดอร์</div>
        </div>
      </div>

      {/* Config card */}
      <div className="rounded-xl border border-border bg-bg-card p-5 shadow-sm space-y-5">
        <h2 className="font-semibold text-t1">การตั้งค่า AI</h2>

        {/* Confidence threshold */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-t2">Confidence Threshold</label>
            <span className="text-sm font-bold text-primary">{effectiveConfig.confidenceThreshold}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={effectiveConfig.confidenceThreshold}
            onChange={(e) => setLocalConfig((prev) => ({ ...prev, confidenceThreshold: Number(e.target.value) }))}
            onMouseUp={() => update({ confidenceThreshold: effectiveConfig.confidenceThreshold })}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-t3">
            <span>ตอบทุกคำถาม (0%)</span>
            <span>เข้มงวดมาก (100%)</span>
          </div>
        </div>

        {/* Tone selector — Casual / Formal / Cute */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-t2">Tone of Voice</label>
          <div className="flex gap-2">
            {toneOptions.map((t) => (
              <button
                key={t.value}
                onClick={() => update({ tone: t.value })}
                className={cn(
                  'flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all',
                  effectiveConfig.tone === t.value
                    ? 'border-primary bg-primary-alpha text-primary'
                    : 'border-border text-t2 hover:bg-bg-hover',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Auto handoff toggle */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-t2">Auto Handoff</div>
            <div className="text-xs text-t3">ส่งต่อให้ agent อัตโนมัติเมื่อ AI ไม่มั่นใจ</div>
          </div>
          <ToggleSwitch
            checked={effectiveConfig.autoHandoffEnabled}
            onChange={(v) => update({ autoHandoffEnabled: v })}
          />
        </div>
      </div>

      {/* Channel section */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-t1">ช่องทาง (Channels)</h2>
            <p className="text-xs text-t3 mt-0.5">ตั้งค่า AI แยกตามช่องทาง</p>
          </div>
        </div>
        <div className="space-y-3">
          {channels.map((ch) => (
            <ChannelRow
              key={ch.channelId}
              channel={ch}
              globalThreshold={effectiveConfig.confidenceThreshold}
              onChange={(updated) =>
                setChannels((prev) => prev.map((c) => (c.channelId === updated.channelId ? updated : c)))
              }
            />
          ))}
        </div>
      </div>

      {/* FAQ / Knowledge Base */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-t1">FAQ / Knowledge Base</h2>
            <p className="text-xs text-t3 mt-0.5">AI จะใช้ข้อมูลนี้ตอบคำถาม</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              Import CSV
            </Button>
            <Button size="sm" onClick={() => setFaqModal({})}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              เพิ่ม FAQ
            </Button>
          </div>
        </div>

        {/* Info banner */}
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary-alpha px-4 py-3">
          <BarChart2 className="h-4 w-4 shrink-0 text-primary" />
          <span className="text-sm text-primary">AI จะใช้ข้อมูลนี้ตอบคำถามลูกค้าอัตโนมัติ — อัปเดตข้อมูลให้ครบถ้วนเพื่อผลลัพธ์ที่ดีที่สุด</span>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-hover">
                <th className="px-4 py-3 text-left font-medium text-t2">คำถาม</th>
                <th className="px-4 py-3 text-left font-medium text-t2 hidden md:table-cell">คำตอบ</th>
                <th className="px-4 py-3 text-left font-medium text-t2 hidden lg:table-cell">หมวดหมู่</th>
                <th className="px-4 py-3 text-left font-medium text-t2 hidden sm:table-cell">อัปเดตล่าสุด</th>
                <th className="px-4 py-3 text-right font-medium text-t2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {faqs.map((faq) => (
                <tr key={faq.id} className="border-b border-border last:border-0 hover:bg-bg-hover/50">
                  <td className="px-4 py-3 font-medium text-t1 max-w-xs">
                    <div className="truncate">{faq.question}</div>
                  </td>
                  <td className="px-4 py-3 text-t2 hidden md:table-cell max-w-xs">
                    <div className="truncate text-xs">{faq.answer}</div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="rounded-full bg-primary-alpha px-2 py-0.5 text-xs text-primary">{faq.category}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-t3 hidden sm:table-cell">{formatDate(faq.updatedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => setFaqModal(faq)}
                        className="rounded p-1.5 text-t3 hover:bg-bg-hover hover:text-t1"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteFaq(faq.id)}
                        className="rounded p-1.5 text-t3 hover:bg-error/10 hover:text-error"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {faqs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-t3">
                    ยังไม่มี FAQ — กด "+ เพิ่ม FAQ" เพื่อเริ่มต้น
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Handoff queue */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <h2 className="font-semibold text-t1">Handoff Queue</h2>
          {queue.length > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-error text-xs font-bold text-white">
              {queue.length}
            </span>
          )}
        </div>
        {queue.length === 0 ? (
          <div className="rounded-xl border border-border bg-bg-card p-6 text-center text-sm text-t3">
            ไม่มีแชทรอ agent
          </div>
        ) : (
          <div className="space-y-2">
            {queue.map((item) => (
              <HandoffCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* Recent AI conversations */}
      <div>
        <h2 className="mb-3 font-semibold text-t1">Recent AI Conversations</h2>
        {conversations.length === 0 ? (
          <div className="rounded-xl border border-border bg-bg-card p-6 text-center text-sm text-t3">
            ยังไม่มีการสนทนา
          </div>
        ) : (
          <div className="space-y-1.5">
            {conversations.map((conv) => (
              <ConversationRow key={conv.id} conv={conv} />
            ))}
          </div>
        )}
      </div>

      {/* FAQ Modal */}
      {faqModal !== false && (
        <FaqModal
          item={faqModal}
          onSave={handleSaveFaq}
          onClose={() => setFaqModal(false)}
        />
      )}
    </div>
  )
}
