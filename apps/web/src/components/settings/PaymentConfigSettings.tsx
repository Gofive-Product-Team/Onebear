import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Eye, EyeOff } from 'lucide-react'

const EXPIRY_OPTIONS = [
  { value: '6', label: '6 ชั่วโมง' },
  { value: '12', label: '12 ชั่วโมง' },
  { value: '24', label: '24 ชั่วโมง' },
  { value: '48', label: '48 ชั่วโมง' },
]

const PAYMENT_METHODS = [
  { id: 'credit_card', label: 'Credit / Debit Card' },
  { id: 'qr_promptpay', label: 'QR PromptPay' },
  { id: 'bank_transfer', label: 'Bank Transfer' },
  { id: 'mobile_banking', label: 'Mobile Banking' },
]

export function PaymentConfigSettings() {
  const [apiKey, setApiKey] = useState('sk_live_••••••••••••••••••••••••')
  const [showApiKey, setShowApiKey] = useState(false)
  const [orderPrefix, setOrderPrefix] = useState('ORD-')
  const [linkExpiry, setLinkExpiry] = useState('24')
  const [depositMode, setDepositMode] = useState(false)
  const [enabledMethods, setEnabledMethods] = useState<string[]>(['credit_card', 'qr_promptpay'])
  const [saved, setSaved] = useState(false)

  function toggleMethod(id: string) {
    setEnabledMethods((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    )
  }

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-t1">การชำระเงิน (Payso)</h2>
        <p className="mt-0.5 text-sm text-t2">ตั้งค่า Payment Gateway และ Payment Link</p>
      </div>

      <div className="rounded-xl border border-border bg-bg-card p-6 shadow-sm space-y-5">
        {/* API Key */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-t2">Payso API Key</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg-input px-3 py-2 pr-10 text-sm text-t1 font-mono focus:border-primary focus:outline-none"
                placeholder="sk_live_..."
              />
              <button
                type="button"
                onClick={() => setShowApiKey((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-t3 hover:text-t1"
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <p className="text-xs text-t3">รับ API Key ได้ที่ dashboard.payso.co.th</p>
        </div>

        {/* Order ID Prefix */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-t2">Order ID Prefix</label>
          <input
            type="text"
            value={orderPrefix}
            onChange={(e) => setOrderPrefix(e.target.value)}
            className="w-full max-w-xs rounded-lg border border-border bg-bg-input px-3 py-2 text-sm text-t1 font-mono focus:border-primary focus:outline-none"
            placeholder="ORD-"
          />
          <p className="text-xs text-t3">ตัวอย่าง: {orderPrefix}20260408001</p>
        </div>

        {/* Payment Link Expiry */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-t2">ลิงก์ชำระเงินหมดอายุใน</label>
          <select
            value={linkExpiry}
            onChange={(e) => setLinkExpiry(e.target.value)}
            className="w-full max-w-xs rounded-lg border border-border bg-bg-input px-3 py-2 text-sm text-t1 focus:border-primary focus:outline-none"
          >
            {EXPIRY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Deposit Mode */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-t2">โหมดมัดจำ (Deposit)</div>
            <div className="text-xs text-t3">อนุญาตให้ลูกค้าชำระบางส่วนก่อน</div>
          </div>
          <button
            role="switch"
            aria-checked={depositMode}
            onClick={() => setDepositMode((v) => !v)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${depositMode ? 'bg-primary' : 'bg-bg-input'}`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-md transition-transform ${depositMode ? 'translate-x-5' : 'translate-x-0'}`}
            />
          </button>
        </div>

        {/* Default Payment Methods */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-t2">วิธีชำระเงินที่เปิดใช้</label>
          <div className="space-y-2">
            {PAYMENT_METHODS.map((m) => (
              <label key={m.id} className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={enabledMethods.includes(m.id)}
                  onChange={() => toggleMethod(m.id)}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                <span className="text-sm text-t1">{m.label}</span>
              </label>
            ))}
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
