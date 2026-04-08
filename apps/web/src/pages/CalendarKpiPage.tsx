import { useState, useMemo } from 'react'
import { cn } from '@one-bear/ui'
import { useCalendarKpi, useCalendarRevenue } from '@/api/useCalendar'
import { useAuthStore } from '@/stores/auth-store'
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  ShoppingCart,
  MessageSquare,
  Bot,
  RefreshCw,
  AlertCircle,
  Users,
  CreditCard,
  BarChart2,
  Info,
} from 'lucide-react'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatThb(amount: number) {
  if (amount >= 1_000_000) return `฿${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `฿${(amount / 1_000).toFixed(1)}K`
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(amount)
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}

// ─── KPI Tile ─────────────────────────────────────────────────────────────────

function KpiTile({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="rounded-xl border border-border bg-bg-card p-4 shadow-sm">
      <div className={cn('mb-2 flex h-8 w-8 items-center justify-center rounded-lg', color)}>
        {icon}
      </div>
      <div className="text-xl font-bold text-t1">{value}</div>
      <div className="mt-0.5 text-xs text-t3">{label}</div>
    </div>
  )
}

// ─── Day Popover ──────────────────────────────────────────────────────────────

interface DayDetail {
  day: number
  revenue: number
  orderCount: number
  topProduct: string
}

function DayPopover({ detail, year, month, onClose }: { detail: DayDetail; year: number; month: number; onClose: () => void }) {
  const date = new Date(year, month - 1, detail.day)
  const dateStr = date.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="mx-4 w-full max-w-xs rounded-xl border border-border bg-bg-card p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-t1">{dateStr}</span>
          <button onClick={onClose} className="rounded-lg p-1 text-t3 hover:bg-bg-hover text-xs">✕</button>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-t3">ยอดขาย</span>
            <span className="font-semibold text-success">{formatThb(detail.revenue)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-t3">ออเดอร์</span>
            <span className="font-medium text-t1">{detail.orderCount} รายการ</span>
          </div>
          <div className="flex justify-between">
            <span className="text-t3">สินค้าขายดี</span>
            <span className="font-medium text-t1 truncate max-w-[140px] text-right">{detail.topProduct}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Calendar Grid ────────────────────────────────────────────────────────────

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Stub top products per day for demo
const STUB_TOP_PRODUCTS: Record<number, string> = {
  1: 'ครีมบำรุงผิว', 3: 'เซรั่มวิตซี', 5: 'มาส์กหน้า', 7: 'ลิปสติก', 8: 'ไฮไลท์', 10: 'คอนซีลเลอร์',
  12: 'ครีมกันแดด SPF50', 14: 'โทนเนอร์', 15: 'บีบีครีม', 17: 'อายไลเนอร์', 19: 'บลัชออน',
  21: 'พาวเดอร์', 22: 'มาสคาร่า', 24: 'ลิปกลอส', 25: 'เบส', 28: 'ครีมล้างหน้า',
}

interface CalendarGridProps {
  year: number
  month: number
  revenueByDay: Map<number, number>
  onDayClick?: (detail: DayDetail) => void
}

function CalendarGrid({ year, month, revenueByDay, onDayClick }: CalendarGridProps) {
  const today = new Date()
  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const maxRevenue = Math.max(...Array.from(revenueByDay.values()), 1)

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  while (cells.length % 7 !== 0) cells.push(null)

  function getHeatClass(revenue: number) {
    const ratio = revenue / maxRevenue
    if (ratio === 0) return ''
    if (ratio < 0.25) return 'bg-primary/10'
    if (ratio < 0.5) return 'bg-primary/25'
    if (ratio < 0.75) return 'bg-primary/45'
    return 'bg-primary/65'
  }

  function isToday(day: number) {
    return today.getFullYear() === year && today.getMonth() + 1 === month && today.getDate() === day
  }

  function handleClick(day: number) {
    const revenue = revenueByDay.get(day) ?? 0
    onDayClick?.({
      day,
      revenue,
      orderCount: Math.round(revenue / 850),
      topProduct: STUB_TOP_PRODUCTS[day] ?? 'สินค้าทั่วไป',
    })
  }

  return (
    <div className="rounded-xl border border-border bg-bg-card p-4 shadow-sm">
      <div className="mb-3 grid grid-cols-7 gap-1">
        {DAY_NAMES.map((d) => (
          <div key={d} className="py-1 text-center text-xs font-medium text-t3">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (day === null) return <div key={`empty-${idx}`} />
          const revenue = revenueByDay.get(day) ?? 0
          return (
            <button
              key={day}
              onClick={() => handleClick(day)}
              className={cn(
                'flex flex-col items-center justify-center rounded-lg p-1.5 transition-all hover:ring-2 hover:ring-primary/40 hover:ring-offset-1 cursor-pointer',
                isToday(day) ? 'ring-2 ring-primary ring-offset-1' : '',
                revenue > 0 ? getHeatClass(revenue) : 'bg-bg-input/40',
              )}
            >
              <span className={cn('text-xs font-medium', isToday(day) ? 'text-primary' : 'text-t2')}>{day}</span>
              {revenue > 0 && (
                <span className="mt-0.5 text-[9px] text-t3">{formatThb(revenue)}</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Manager/Admin per-agent table ────────────────────────────────────────────

interface AgentRow {
  name: string
  orders: number
  revenue: number
  responseRate: number
  slaBreach: number
  aiAdoption: number
}

const STUB_AGENTS: AgentRow[] = [
  { name: 'สุภาพร จันทร์แก้ว', orders: 42, revenue: 128500, responseRate: 94.2, slaBreach: 1, aiAdoption: 78.5 },
  { name: 'วิชัย มีสุข', orders: 38, revenue: 97200, responseRate: 88.0, slaBreach: 3, aiAdoption: 62.1 },
  { name: 'นิรันดร์ แก้วใส', orders: 55, revenue: 215000, responseRate: 96.5, slaBreach: 0, aiAdoption: 85.3 },
  { name: 'มณีรัตน์ ทองดี', orders: 29, revenue: 74100, responseRate: 82.3, slaBreach: 5, aiAdoption: 55.0 },
  { name: 'กิตติ ศรีสวัสดิ์', orders: 47, revenue: 163800, responseRate: 91.7, slaBreach: 2, aiAdoption: 72.4 },
]

function AgentTable() {
  const sorted = [...STUB_AGENTS].sort((a, b) => b.revenue - a.revenue)

  return (
    <div className="rounded-xl border border-border bg-bg-card shadow-sm overflow-hidden">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-t1">รายงานตามพนักงาน</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-input/50">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-t3">Agent</th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-t3">ออเดอร์</th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-t3">ยอดรวม ▼</th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-t3">อัตราตอบ</th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-t3">SLA Breach</th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-t3">AI Adoption %</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => (
              <tr key={row.name} className={cn('border-b border-border/50 hover:bg-bg-hover transition-colors', i === 0 ? 'bg-success/5' : '')}>
                <td className="px-4 py-3 font-medium text-t1">{row.name}</td>
                <td className="px-4 py-3 text-right text-t2">{row.orders}</td>
                <td className="px-4 py-3 text-right font-semibold text-success">{formatThb(row.revenue)}</td>
                <td className="px-4 py-3 text-right text-t2">{formatPercent(row.responseRate)}</td>
                <td className={cn('px-4 py-3 text-right font-medium', row.slaBreach > 3 ? 'text-error' : row.slaBreach > 0 ? 'text-warning' : 'text-success')}>
                  {row.slaBreach}
                </td>
                <td className="px-4 py-3 text-right text-t2">{formatPercent(row.aiAdoption)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Role = 'Agent' | 'Manager' | 'Admin'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const ROLE_LABEL: Record<Role, string> = {
  Agent: '👤 Agent View',
  Manager: '👥 Manager View',
  Admin: '🏢 Admin View',
}

export function CalendarKpiPage() {
  const [year, setYear] = useState(2026)
  const [month, setMonth] = useState(4) // April 2026
  const [selectedDay, setSelectedDay] = useState<DayDetail | null>(null)

  const hasPermission = useAuthStore((s) => s.hasPermission)

  // Derive role from real permissions
  const role: Role = hasPermission(3005) ? 'Admin' : hasPermission(3004) ? 'Manager' : 'Agent'

  const { data: kpi } = useCalendarKpi(role)
  const { data: revenueData } = useCalendarRevenue(year, month)

  const revenueByDay = useMemo(() => {
    const map = new Map<number, number>()
    if (revenueData) {
      for (const d of revenueData) map.set(d.day, d.revenue)
    } else {
      const demo: [number, number][] = [[1, 12500],[3, 8900],[5, 45000],[7, 32000],[8, 15000],[10, 67000],[12, 89000],[14, 23000],[15, 41000],[17, 55000],[19, 12000],[21, 78000],[22, 34000],[24, 91000],[25, 43000],[28, 29000]]
      for (const [day, rev] of demo) map.set(day, rev)
    }
    return map
  }, [revenueData])

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear((y) => y - 1) }
    else setMonth((m) => m - 1)
  }

  function nextMonth() {
    if (month === 12) { setMonth(1); setYear((y) => y + 1) }
    else setMonth((m) => m + 1)
  }

  // Agent tiles: show ยอดขายของฉัน but NO team/total revenue
  const agentTiles = [
    { label: 'ยอดขายของฉัน', value: formatThb(kpi?.myRevenue ?? 0), icon: <TrendingUp className="h-4 w-4 text-success" />, color: 'bg-success/10' },
    { label: 'ออเดอร์ใหม่', value: String(kpi?.newOrders ?? 0), icon: <ShoppingCart className="h-4 w-4 text-primary" />, color: 'bg-primary/10' },
    { label: 'แชทไม่ตอบ', value: String(kpi?.unansweredChats ?? 0), icon: <MessageSquare className="h-4 w-4 text-error" />, color: 'bg-error/10' },
    { label: 'AI ปิดได้', value: String(kpi?.aiClosed ?? 0), icon: <Bot className="h-4 w-4 text-primary" />, color: 'bg-primary/10' },
    { label: 'Follow-up คงค้าง', value: String(kpi?.pendingFollowUps ?? 0), icon: <RefreshCw className="h-4 w-4 text-warning" />, color: 'bg-warning/10' },
    { label: 'รอชำระ', value: String(kpi?.pendingPayment ?? 0), icon: <CreditCard className="h-4 w-4 text-warning" />, color: 'bg-warning/10' },
  ]

  const managerTiles = [
    { label: 'ยอดรวมทีม', value: formatThb(kpi?.teamRevenue ?? 0), icon: <TrendingUp className="h-4 w-4 text-success" />, color: 'bg-success/10' },
    { label: 'ออเดอร์ทั้งหมด', value: String(kpi?.totalOrders ?? 0), icon: <ShoppingCart className="h-4 w-4 text-primary" />, color: 'bg-primary/10' },
    { label: 'อัตราตอบ', value: formatPercent(kpi?.responseRate ?? 0), icon: <MessageSquare className="h-4 w-4 text-primary" />, color: 'bg-primary/10' },
    { label: 'รายรับเดือนนี้', value: formatThb(kpi?.monthRevenue ?? 0), icon: <BarChart2 className="h-4 w-4 text-success" />, color: 'bg-success/10' },
    { label: 'SLA Breach', value: String(kpi?.slaBreach ?? 0), icon: <AlertCircle className="h-4 w-4 text-error" />, color: 'bg-error/10' },
    { label: 'AI adoption', value: formatPercent(kpi?.aiAdoption ?? 0), icon: <Bot className="h-4 w-4 text-primary" />, color: 'bg-primary/10' },
  ]

  const adminTiles = [
    ...managerTiles,
    { label: 'Total Agents', value: '--', icon: <Users className="h-4 w-4 text-t2" />, color: 'bg-bg-input' },
  ]

  const tiles = role === 'Agent' ? agentTiles : role === 'Manager' ? managerTiles : adminTiles

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-t1">Calendar & KPI</h1>
          <p className="mt-0.5 text-sm text-t2">ติดตามรายได้และเป้าหมายรายวัน</p>
        </div>
        {/* Role label chip (non-clickable, derived from auth) */}
        <div className="rounded-xl border border-border bg-bg-card px-3 py-2 shadow-sm">
          <span className="text-sm font-medium text-t2">{ROLE_LABEL[role]}</span>
        </div>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {tiles.map((tile) => (
          <KpiTile key={tile.label} {...tile} />
        ))}
      </div>

      {/* Calendar header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-t1">
          {MONTH_NAMES[month - 1]} {year}
        </h2>
        <div className="flex gap-1">
          <button
            onClick={prevMonth}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-t2 hover:bg-bg-hover"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={nextMonth}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-t2 hover:bg-bg-hover"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <CalendarGrid year={year} month={month} revenueByDay={revenueByDay} onDayClick={setSelectedDay} />

      {/* Calendar hint */}
      <div className="flex items-center gap-1.5 text-xs text-t3">
        <Info className="h-3.5 w-3.5 shrink-0" />
        <span>คลิกวันในปฏิทิน เพื่อดูรายละเอียด</span>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-t3">
        <span>Revenue heat:</span>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-primary/10" /><span>Low</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-primary/45" /><span>Mid</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-primary/65" /><span>High</span>
        </div>
      </div>

      {/* Manager/Admin per-agent table */}
      {(role === 'Manager' || role === 'Admin') && <AgentTable />}

      {/* Day detail popover */}
      {selectedDay && (
        <DayPopover
          detail={selectedDay}
          year={year}
          month={month}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </div>
  )
}
