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

export function WorkspaceSettings() {
  const [workspaceName, setWorkspaceName] = useState('One Bear Company')
  const [timezone, setTimezone] = useState('Asia/Bangkok')
  const [currency, setCurrency] = useState('THB')
  const [language, setLanguage] = useState<'th' | 'en'>('th')
  const [saved, setSaved] = useState(false)

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
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
    </div>
  )
}
