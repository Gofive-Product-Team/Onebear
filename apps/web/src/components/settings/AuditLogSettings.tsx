import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Lock, Download } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'

interface AuditRow {
  id: string
  timestamp: string
  user: string
  action: 'created' | 'edited' | 'deleted' | 'role_changed' | 'login' | 'exported'
  resourceType: string
  resourceName: string
  ip: string
}

const ACTION_LABELS: Record<AuditRow['action'], string> = {
  created: 'สร้าง',
  edited: 'แก้ไข',
  deleted: 'ลบ',
  role_changed: 'เปลี่ยน Role',
  login: 'เข้าสู่ระบบ',
  exported: 'Export',
}

const ACTION_COLORS: Record<AuditRow['action'], string> = {
  created: 'bg-success/10 text-success',
  edited: 'bg-primary-alpha text-primary',
  deleted: 'bg-error/10 text-error',
  role_changed: 'bg-warning/10 text-warning',
  login: 'bg-bg-hover text-t2',
  exported: 'bg-blue-500/10 text-blue-600',
}

const STUB_AUDIT: AuditRow[] = [
  { id: 'a1',  timestamp: '2026-04-08 10:34:21', user: 'warisara@company.com',   action: 'edited',       resourceType: 'Integration',   resourceName: 'LINE Official Account',    ip: '203.150.12.88' },
  { id: 'a2',  timestamp: '2026-04-08 10:12:05', user: 'admin@company.com',      action: 'role_changed', resourceType: 'User',           resourceName: 'somchai@company.com',      ip: '101.51.99.4' },
  { id: 'a3',  timestamp: '2026-04-08 09:55:48', user: 'somchai@company.com',    action: 'login',        resourceType: 'Auth',           resourceName: 'Session',                  ip: '125.24.45.200' },
  { id: 'a4',  timestamp: '2026-04-07 17:22:33', user: 'warisara@company.com',   action: 'created',      resourceType: 'AutoReply',      resourceName: 'ตอบกลับนอกเวลาทำการ',     ip: '203.150.12.88' },
  { id: 'a5',  timestamp: '2026-04-07 16:08:19', user: 'admin@company.com',      action: 'deleted',      resourceType: 'User',           resourceName: 'resigned@company.com',     ip: '101.51.99.4' },
  { id: 'a6',  timestamp: '2026-04-07 15:44:00', user: 'warisara@company.com',   action: 'edited',       resourceType: 'Greeting',       resourceName: 'ข้อความต้อนรับ Facebook',  ip: '203.150.12.88' },
  { id: 'a7',  timestamp: '2026-04-07 14:30:55', user: 'manager@company.com',    action: 'exported',     resourceType: 'Order',          resourceName: 'orders_2026-04.csv',       ip: '58.8.77.12' },
  { id: 'a8',  timestamp: '2026-04-07 13:15:02', user: 'admin@company.com',      action: 'created',      resourceType: 'User',           resourceName: 'newstaff@company.com',     ip: '101.51.99.4' },
  { id: 'a9',  timestamp: '2026-04-07 11:50:40', user: 'warisara@company.com',   action: 'edited',       resourceType: 'Chatbot',        resourceName: 'AI Config',                ip: '203.150.12.88' },
  { id: 'a10', timestamp: '2026-04-07 10:22:18', user: 'manager@company.com',    action: 'role_changed', resourceType: 'User',           resourceName: 'staff1@company.com',       ip: '58.8.77.12' },
  { id: 'a11', timestamp: '2026-04-06 17:44:11', user: 'admin@company.com',      action: 'edited',       resourceType: 'Integration',    resourceName: 'WhatsApp Business',         ip: '101.51.99.4' },
  { id: 'a12', timestamp: '2026-04-06 16:30:00', user: 'warisara@company.com',   action: 'created',      resourceType: 'Shortcut',       resourceName: 'ข้อความขอบคุณ',           ip: '203.150.12.88' },
  { id: 'a13', timestamp: '2026-04-06 15:20:05', user: 'staff2@company.com',     action: 'login',        resourceType: 'Auth',           resourceName: 'Session',                  ip: '180.183.44.21' },
  { id: 'a14', timestamp: '2026-04-06 14:05:55', user: 'manager@company.com',    action: 'exported',     resourceType: 'Customer',       resourceName: 'customers_export.csv',     ip: '58.8.77.12' },
  { id: 'a15', timestamp: '2026-04-06 13:00:00', user: 'admin@company.com',      action: 'deleted',      resourceType: 'AutoReply',      resourceName: 'โปรเก่าหมดอายุ',          ip: '101.51.99.4' },
  { id: 'a16', timestamp: '2026-04-05 16:48:33', user: 'warisara@company.com',   action: 'created',      resourceType: 'Integration',    resourceName: 'TikTok Shop',              ip: '203.150.12.88' },
  { id: 'a17', timestamp: '2026-04-05 15:35:20', user: 'admin@company.com',      action: 'edited',       resourceType: 'Workspace',      resourceName: 'Company Settings',         ip: '101.51.99.4' },
  { id: 'a18', timestamp: '2026-04-05 11:22:14', user: 'staff3@company.com',     action: 'login',        resourceType: 'Auth',           resourceName: 'Session',                  ip: '110.77.22.99' },
  { id: 'a19', timestamp: '2026-04-04 17:10:01', user: 'manager@company.com',    action: 'role_changed', resourceType: 'User',           resourceName: 'warisara@company.com',     ip: '58.8.77.12' },
  { id: 'a20', timestamp: '2026-04-04 14:55:09', user: 'admin@company.com',      action: 'created',      resourceType: 'Team',           resourceName: 'ทีม Sales',                ip: '101.51.99.4' },
]

const ACTION_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'ทุก Action' },
  { value: 'created', label: 'สร้าง' },
  { value: 'edited', label: 'แก้ไข' },
  { value: 'deleted', label: 'ลบ' },
  { value: 'role_changed', label: 'เปลี่ยน Role' },
  { value: 'login', label: 'Login' },
  { value: 'exported', label: 'Export' },
]

export function AuditLogSettings() {
  const user = useAuthStore((s) => s.user)
  const isSuperAdmin = user?.permissions?.includes(3005) ?? false
  const [filterUser, setFilterUser] = useState('')
  const [filterAction, setFilterAction] = useState('')
  const [exportToast, setExportToast] = useState(false)

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-bg-card p-12 text-center shadow-sm">
        <Lock className="mb-3 h-10 w-10 text-t3" />
        <p className="font-semibold text-t1">เฉพาะ Super Admin เท่านั้น</p>
        <p className="mt-1 text-sm text-t3">คุณไม่มีสิทธิ์เข้าถึง Audit Log</p>
      </div>
    )
  }

  const filtered = STUB_AUDIT.filter((row) => {
    const matchUser = !filterUser || row.user.toLowerCase().includes(filterUser.toLowerCase())
    const matchAction = !filterAction || row.action === filterAction
    return matchUser && matchAction
  })

  function handleExport() {
    setExportToast(true)
    setTimeout(() => setExportToast(false), 2500)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-t1">Audit Log</h2>
          <p className="mt-0.5 text-sm text-t2">ประวัติการเปลี่ยนแปลงระบบทั้งหมด</p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="mr-2 h-3.5 w-3.5" />
          Export CSV
        </Button>
      </div>

      {exportToast && (
        <div className="rounded-lg border border-success/30 bg-success/10 px-4 py-2 text-sm text-success">
          กำลัง Export... ไฟล์จะถูกดาวน์โหลดในไม่ช้า
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          value={filterUser}
          onChange={(e) => setFilterUser(e.target.value)}
          placeholder="ค้นหาผู้ใช้..."
          className="rounded-lg border border-border bg-bg-input px-3 py-2 text-sm text-t1 focus:border-primary focus:outline-none"
        />
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="rounded-lg border border-border bg-bg-input px-3 py-2 text-sm text-t1 focus:border-primary focus:outline-none"
        >
          {ACTION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <input
            type="date"
            className="rounded-lg border border-border bg-bg-input px-3 py-2 text-sm text-t1 focus:border-primary focus:outline-none"
          />
          <input
            type="date"
            className="rounded-lg border border-border bg-bg-input px-3 py-2 text-sm text-t1 focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-hover">
                <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-t2">เวลา</th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-t2">ผู้ใช้</th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-t2">Action</th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-t2 hidden md:table-cell">ประเภท</th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-t2 hidden lg:table-cell">ชื่อ Resource</th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-t2 hidden xl:table-cell">IP Address</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0 hover:bg-bg-hover/50">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-t3">{row.timestamp}</td>
                  <td className="px-4 py-3 text-xs text-t1 max-w-[160px]">
                    <div className="truncate">{row.user}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ACTION_COLORS[row.action]}`}>
                      {ACTION_LABELS[row.action]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-t2 hidden md:table-cell">{row.resourceType}</td>
                  <td className="px-4 py-3 text-xs text-t1 hidden lg:table-cell max-w-[200px]">
                    <div className="truncate">{row.resourceName}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-t3 hidden xl:table-cell">{row.ip}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-t3">
                    ไม่พบข้อมูลที่ตรงตามเงื่อนไข
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
