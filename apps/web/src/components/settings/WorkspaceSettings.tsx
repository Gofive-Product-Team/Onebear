import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Upload } from 'lucide-react'

const TIMEZONES = [
  'Asia/Bangkok',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'UTC',
  'Europe/London',
  'America/New_York',
]

const CURRENCIES = ['THB', 'USD', 'EUR', 'SGD', 'JPY']

interface Store {
  id: string
  name: string
  role: 'Owner' | 'Manager' | 'Agent'
  joinedDate: string
  isCurrent: boolean
}

const MOCK_STORES: Store[] = [
  { id: '1', name: 'ร้านของฉัน', role: 'Owner', joinedDate: '1 ม.ค. 2566', isCurrent: true },
  { id: '2', name: 'Beauty Shop TH', role: 'Manager', joinedDate: '15 มี.ค. 2566', isCurrent: false },
  { id: '3', name: 'Skincare World', role: 'Agent', joinedDate: '2 ก.ย. 2566', isCurrent: false },
]

const ROLE_STYLES: Record<Store['role'], string> = {
  Owner: 'bg-primary/10 text-primary',
  Manager: 'bg-amber-100 text-amber-700',
  Agent: 'bg-bg-hover text-t2',
}

export function WorkspaceSettings() {
  const [workspaceName, setWorkspaceName] = useState('One Bear Company')
  const [timezone, setTimezone] = useState('Asia/Bangkok')
  const [currency, setCurrency] = useState('THB')
  const [language, setLanguage] = useState<'th' | 'en'>('th')
  const [saved, setSaved] = useState(false)

  // Multi-store state
  const [switchToast, setSwitchToast] = useState<string | null>(null)

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleSwitchStore(store: Store) {
    setSwitchToast(`สลับไปยัง ${store.name} สำเร็จ (จำลอง)`)
    setTimeout(() => setSwitchToast(null), 3000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-t1">ทั่วไป (Workspace)</h2>
        <p className="mt-0.5 text-sm text-t2">ตั้งค่าพื้นฐานของ Workspace</p>
      </div>

      <div className="rounded-xl border border-border bg-bg-card p-6 shadow-sm space-y-5">
        {/* Workspace Name */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-t2">ชื่อ Workspace</label>
          <input
            type="text"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            className="w-full rounded-lg border border-border bg-bg-input px-3 py-2 text-sm text-t1 focus:border-primary focus:outline-none"
            placeholder="ชื่อบริษัท / ทีม"
          />
        </div>

        {/* Logo Upload */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-t2">โลโก้ Workspace</label>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-dashed border-border bg-bg-hover text-t3">
              <Upload className="h-6 w-6" />
            </div>
            <div>
              <Button variant="outline" size="sm">
                <Upload className="mr-2 h-3.5 w-3.5" />
                อัปโหลดโลโก้
              </Button>
              <p className="mt-1 text-xs text-t3">PNG, JPG สูงสุด 2MB</p>
            </div>
          </div>
        </div>

        {/* Timezone */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-t2">Timezone</label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full rounded-lg border border-border bg-bg-input px-3 py-2 text-sm text-t1 focus:border-primary focus:outline-none"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </div>

        {/* Currency */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-t2">สกุลเงิน</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full rounded-lg border border-border bg-bg-input px-3 py-2 text-sm text-t1 focus:border-primary focus:outline-none"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Language */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-t2">ภาษา</label>
          <div className="flex gap-2">
            <button
              onClick={() => setLanguage('th')}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                language === 'th'
                  ? 'border-primary bg-primary-alpha text-primary'
                  : 'border-border text-t2 hover:bg-bg-hover'
              }`}
            >
              ไทย
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                language === 'en'
                  ? 'border-primary bg-primary-alpha text-primary'
                  : 'border-border text-t2 hover:bg-bg-hover'
              }`}
            >
              English
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={handleSave}>
            {saved ? '✓ บันทึกแล้ว' : 'บันทึก'}
          </Button>
        </div>
      </div>

      {/* ── Connected Stores Section ── */}
      <div>
        <div className="mb-3">
          <h3 className="text-base font-semibold text-t1">ร้านค้าที่เชื่อมต่อ</h3>
          <p className="text-sm text-t2">บัญชีของคุณเชื่อมต่ออยู่กับร้านค้าหลายร้าน</p>
        </div>

        <div className="space-y-3">
          {MOCK_STORES.map((store) => (
            <div
              key={store.id}
              className="flex items-center gap-4 rounded-xl border border-border bg-bg-card px-5 py-4 shadow-sm"
            >
              {/* Store avatar */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm">
                {store.name.slice(0, 1)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-t1 truncate">{store.name}</span>
                  {store.isCurrent && (
                    <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-medium text-teal-700">
                      ใช้งานอยู่
                    </span>
                  )}
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-t3 flex-wrap">
                  <span className={`rounded-full px-2 py-0.5 font-medium ${ROLE_STYLES[store.role]}`}>
                    {store.role}
                  </span>
                  <span>จอยน์เมื่อ {store.joinedDate}</span>
                </div>
              </div>

              {/* Action */}
              {!store.isCurrent && (
                <button
                  onClick={() => handleSwitchStore(store)}
                  className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-t2 hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors"
                >
                  สลับไปร้านนี้
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Create new store */}
        <div className="mt-4 text-center">
          <button className="text-sm font-medium text-primary hover:underline transition-colors">
            + สร้างร้านค้าใหม่
          </button>
        </div>
      </div>

      {/* ── Switch toast ── */}
      {switchToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-xl border border-border bg-bg-card px-5 py-3 shadow-xl text-sm font-medium text-t1 animate-in fade-in slide-in-from-bottom-2">
          {switchToast}
        </div>
      )}
    </div>
  )
}
