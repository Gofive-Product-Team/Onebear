import { useState } from 'react'
import { cn } from '@one-bear/ui'
import { Button } from '@/components/ui/Button'
import { useDailyInsights, type ActionRecommendation } from '@/api/useInsights'
import {
  TrendingUp,
  TrendingDown,
  Users,
  Bot,
  RefreshCw,
  BarChart2,
  Download,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Zap,
} from 'lucide-react'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatThb(amount: number) {
  if (amount >= 1_000_000) return `฿${(amount / 1_000_000).toFixed(2)}M`
  if (amount >= 1_000) return `฿${(amount / 1_000).toFixed(1)}K`
  return `฿${amount.toFixed(0)}`
}

function formatMs(ms: number) {
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`
  return `${Math.round(ms / 60_000)}m`
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}

type DateRange = 'today' | 'week' | 'month'

const CATEGORY_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  Revenue: { icon: <BarChart2 className="h-4 w-4" />, color: 'text-success', bg: 'bg-success/10' },
  Customers: { icon: <Users className="h-4 w-4" />, color: 'text-primary', bg: 'bg-primary/10' },
  AI: { icon: <Bot className="h-4 w-4" />, color: 'text-[#7c3aed]', bg: 'bg-[#7c3aed]/10' },
  'Follow-up': { icon: <RefreshCw className="h-4 w-4" />, color: 'text-warning', bg: 'bg-warning/10' },
  Channel: { icon: <Zap className="h-4 w-4" />, color: 'text-primary', bg: 'bg-primary/10' },
}

function getCategoryConfig(category: string) {
  return CATEGORY_CONFIG[category] ?? { icon: <BarChart2 className="h-4 w-4" />, color: 'text-t2', bg: 'bg-bg-input' }
}

// ─── Insight Card ─────────────────────────────────────────────────────────────

function InsightCard({ rec }: { rec: ActionRecommendation }) {
  const cfg = getCategoryConfig(rec.category)
  const isPositive = rec.priority === 'high' || rec.priority === 'medium'

  return (
    <div className="rounded-xl border border-border bg-bg-card p-4 shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', cfg.bg, cfg.color)}>
          {cfg.icon}
        </div>
        <div className={cn(
          'flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold',
          isPositive ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning',
        )}>
          {isPositive
            ? <><TrendingUp className="h-3 w-3" /><span>+Insight</span></>
            : <><TrendingDown className="h-3 w-3" /><span>Alert</span></>
          }
        </div>
      </div>
      <div>
        <span className={cn('mb-1 text-xs font-medium', cfg.color)}>{rec.category}</span>
        <h3 className="text-sm font-semibold text-t1">{rec.title}</h3>
        <p className="mt-1 text-sm text-t2 line-clamp-3">{rec.description}</p>
      </div>
      {rec.actionUrl && (
        <Button size="sm" variant="outline" className="w-full" onClick={() => window.open(rec.actionUrl!, '_blank')}>
          <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
          ดูรายละเอียด
        </Button>
      )}
    </div>
  )
}

// ─── Weekly summary ────────────────────────────────────────────────────────────

function WeeklySummary({ data }: { data: ReturnType<typeof useDailyInsights>['data'] }) {
  const [open, setOpen] = useState(true)
  if (!data) return null

  const rows = [
    { label: 'Revenue', value: formatThb(data.sales.revenue), change: data.sales.changePercent, positive: data.sales.changePercent >= 0 },
    { label: 'Orders', value: String(data.sales.orderCount), change: null, positive: true },
    { label: 'New Customers', value: String(data.customers.newCustomers), change: null, positive: true },
    { label: 'Avg Response Time', value: formatMs(data.chat.avgResponseTimeMs), change: null, positive: false },
    { label: 'SLA Compliance', value: formatPercent(data.chat.slaComplianceRate * 100), change: null, positive: data.chat.slaComplianceRate >= 0.9 },
    { label: 'AI Messages Handled', value: String(data.ai.aiMessagesHandled), change: null, positive: true },
    { label: 'Conversion Rate', value: formatPercent(data.customers.conversionRate * 100), change: null, positive: data.customers.conversionRate >= 0.1 },
  ]

  return (
    <div className="rounded-xl border border-border bg-bg-card shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between p-4 text-left hover:bg-bg-hover transition-colors"
      >
        <span className="font-semibold text-t1">Weekly Summary</span>
        {open ? <ChevronUp className="h-4 w-4 text-t3" /> : <ChevronDown className="h-4 w-4 text-t3" />}
      </button>
      {open && (
        <div className="border-t border-border divide-y divide-border">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between px-4 py-2.5">
              <span className="text-sm text-t2">{row.label}</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-t1">{row.value}</span>
                {row.change != null && (
                  <span className={cn('flex items-center gap-0.5 text-xs font-medium', row.positive ? 'text-success' : 'text-error')}>
                    {row.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {Math.abs(row.change).toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Headless content (used when embedded inside another page) ─────────────────

export function InsightsContent() {
  const [dateRange, setDateRange] = useState<DateRange>('today')
  const { data, isLoading } = useDailyInsights()

  const DATE_TABS: { key: DateRange; label: string }[] = [
    { key: 'today', label: 'วันนี้' },
    { key: 'week', label: 'สัปดาห์นี้' },
    { key: 'month', label: 'เดือนนี้' },
  ]

  // Build synthetic insight cards from real data
  const syntheticRecs: ActionRecommendation[] = data
    ? [
        {
          category: 'Revenue',
          priority: data.sales.changePercent >= 0 ? 'high' : 'low',
          title: data.sales.changePercent >= 0
            ? `รายได้เพิ่มขึ้น ${data.sales.changePercent.toFixed(1)}% จากเมื่อวาน`
            : `รายได้ลดลง ${Math.abs(data.sales.changePercent).toFixed(1)}% จากเมื่อวาน`,
          description: `ยอดขายรวม ${formatThb(data.sales.revenue)} จาก ${data.sales.orderCount} ออเดอร์ มูลค่าเฉลี่ย ${formatThb(data.sales.avgOrderValue)} ต่อออเดอร์`,
          actionUrl: '/orders',
        },
        {
          category: 'Customers',
          priority: 'medium',
          title: `ลูกค้าใหม่ ${data.customers.newCustomers} ราย`,
          description: `มีลูกค้าเสี่ยงหาย ${data.customers.atRiskCount} ราย และลูกค้าร้อน ${data.customers.hotCount} ราย อัตราแปลง ${(data.customers.conversionRate * 100).toFixed(1)}%`,
          actionUrl: '/customer',
        },
        {
          category: 'AI',
          priority: 'high',
          title: `AI จัดการ ${data.ai.aiMessagesHandled} ข้อความ ปิดออเดอร์ได้ ${data.ai.aiOrdersClosed} รายการ`,
          description: `Handoff ${data.ai.handoffCount} ครั้ง ความมั่นใจเฉลี่ย ${(data.ai.aiConfidenceAvg * 100).toFixed(0)}%`,
          actionUrl: '/ai-agent',
        },
        {
          category: 'Channel',
          priority: 'medium',
          title: `แชทรวม ${data.chat.activeRooms} ห้อง ยังไม่ตอบ ${data.chat.unansweredCount}`,
          description: `เวลาตอบเฉลี่ย ${formatMs(data.chat.avgResponseTimeMs)} SLA compliance ${(data.chat.slaComplianceRate * 100).toFixed(1)}%`,
          actionUrl: '/chat',
        },
        ...(data.recommendations ?? []),
      ]
    : []

  return (
    <div className="space-y-5">
      {/* Controls row: date toggle + export */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 w-fit rounded-xl border border-border bg-bg-card p-1 shadow-sm">
          {DATE_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setDateRange(tab.key)}
              className={cn(
                'rounded-lg px-4 py-1.5 text-sm font-medium transition-all',
                dateRange === tab.key ? 'bg-primary text-white shadow-sm' : 'text-t2 hover:bg-bg-hover',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm">
          <Download className="mr-1.5 h-4 w-4" />
          Export PDF
        </Button>
      </div>

      {/* Insight cards */}
      {isLoading ? (
        <div className="flex h-40 items-center justify-center text-sm text-t3">กำลังวิเคราะห์ข้อมูล...</div>
      ) : syntheticRecs.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-bg-input text-t3">
            <BarChart2 className="h-10 w-10" />
          </div>
          <div>
            <p className="text-base font-semibold text-t1">ยังไม่มีข้อมูลเพียงพอ</p>
            <p className="mt-1 text-sm text-t2">AI จะวิเคราะห์ข้อมูลและแสดงผลเมื่อมีกิจกรรมในระบบ</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {syntheticRecs.map((rec, i) => (
            <InsightCard key={i} rec={rec} />
          ))}
        </div>
      )}

      {/* Weekly summary */}
      <WeeklySummary data={data} />
    </div>
  )
}

export function InsightsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-t1">AI Data Analyst</h1>
          <p className="mt-0.5 text-sm text-t2">Insights อัจฉริยะจากข้อมูลธุรกิจ</p>
        </div>
      </div>
      <InsightsContent />
    </div>
  )
}
