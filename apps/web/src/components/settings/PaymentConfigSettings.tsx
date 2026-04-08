import { useState, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { Eye, EyeOff, Pencil, Trash2, X, Upload } from 'lucide-react'

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

const BANKS = [
  { id: 'kbank', name: 'ธนาคารกสิกรไทย', color: 'bg-[#1b4f24]' },
  { id: 'scb', name: 'ธนาคารไทยพาณิชย์ (SCB)', color: 'bg-[#4b0082]' },
  { id: 'bbl', name: 'ธนาคารกรุงเทพ', color: 'bg-[#1a3a8a]' },
  { id: 'ktb', name: 'ธนาคารกรุงไทย', color: 'bg-[#00a3e0]' },
  { id: 'ttb', name: 'ธนาคารทหารไทยธนชาต (TTB)', color: 'bg-[#003087]' },
  { id: 'gsb', name: 'ธนาคารออมสิน', color: 'bg-[#e83f96]' },
  { id: 'bay', name: 'ธนาคารกรุงศรีอยุธยา', color: 'bg-[#ffd700]' },
  { id: 'ibank', name: 'ธนาคารอิสลามแห่งประเทศไทย', color: 'bg-[#1e8b48]' },
]

function getBankById(id: string) {
  return BANKS.find((b) => b.id === id) ?? BANKS[0]
}

interface BankAccount {
  id: string
  bankId: string
  accountNumber: string
  accountName: string
  qrFile: File | null
  qrPreviewUrl: string | null
}

const INITIAL_ACCOUNTS: BankAccount[] = [
  {
    id: '1',
    bankId: 'kbank',
    accountNumber: '012-3-45678-9',
    accountName: 'นิดา รักสวย',
    qrFile: null,
    qrPreviewUrl: null,
  },
]

interface BankModalState {
  open: boolean
  editId: string | null
  bankId: string
  accountNumber: string
  accountName: string
  qrFile: File | null
  qrPreviewUrl: string | null
}

const EMPTY_MODAL: BankModalState = {
  open: false,
  editId: null,
  bankId: 'kbank',
  accountNumber: '',
  accountName: '',
  qrFile: null,
  qrPreviewUrl: null,
}

export function PaymentConfigSettings() {
  const [apiKey, setApiKey] = useState('sk_live_••••••••••••••••••••••••')
  const [showApiKey, setShowApiKey] = useState(false)
  const [orderPrefix, setOrderPrefix] = useState('ORD-')
  const [linkExpiry, setLinkExpiry] = useState('24')
  const [depositMode, setDepositMode] = useState(false)
  const [enabledMethods, setEnabledMethods] = useState<string[]>(['credit_card', 'qr_promptpay'])
  const [saved, setSaved] = useState(false)

  // Bank account state
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(INITIAL_ACCOUNTS)
  const [modal, setModal] = useState<BankModalState>(EMPTY_MODAL)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function toggleMethod(id: string) {
    setEnabledMethods((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    )
  }

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function openAddModal() {
    setModal({ ...EMPTY_MODAL, open: true })
  }

  function openEditModal(account: BankAccount) {
    setModal({
      open: true,
      editId: account.id,
      bankId: account.bankId,
      accountNumber: account.accountNumber,
      accountName: account.accountName,
      qrFile: account.qrFile,
      qrPreviewUrl: account.qrPreviewUrl,
    })
  }

  function closeModal() {
    setModal(EMPTY_MODAL)
  }

  function handleQrFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setModal((prev) => ({ ...prev, qrFile: file, qrPreviewUrl: url }))
  }

  function handleModalSave() {
    if (!modal.accountNumber.trim() || !modal.accountName.trim()) return
    if (modal.editId) {
      setBankAccounts((prev) =>
        prev.map((a) =>
          a.id === modal.editId
            ? {
                ...a,
                bankId: modal.bankId,
                accountNumber: modal.accountNumber,
                accountName: modal.accountName,
                qrFile: modal.qrFile,
                qrPreviewUrl: modal.qrPreviewUrl,
              }
            : a,
        ),
      )
    } else {
      setBankAccounts((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          bankId: modal.bankId,
          accountNumber: modal.accountNumber,
          accountName: modal.accountName,
          qrFile: modal.qrFile,
          qrPreviewUrl: modal.qrPreviewUrl,
        },
      ])
    }
    closeModal()
  }

  function handleDelete(id: string) {
    setBankAccounts((prev) => prev.filter((a) => a.id !== id))
    setDeleteConfirmId(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-t1">การชำระเงิน (Payso)</h2>
        <p className="mt-0.5 text-sm text-t2">ตั้งค่า Payment Gateway และ Payment Link</p>
      </div>

      {/* ── Bank Account Section ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-semibold text-t1">บัญชีธนาคาร</h3>
            <p className="text-sm text-t2">ข้อมูลบัญชีที่ส่งให้ลูกค้าเมื่อชำระเงิน</p>
          </div>
          <Button size="sm" onClick={openAddModal}>
            + เพิ่มบัญชีธนาคาร
          </Button>
        </div>

        <div className="space-y-3">
          {bankAccounts.length === 0 && (
            <div className="rounded-xl border border-dashed border-border bg-bg-card p-8 text-center text-sm text-t3">
              ยังไม่มีบัญชีธนาคาร กด "เพิ่มบัญชีธนาคาร" เพื่อเพิ่ม
            </div>
          )}
          {bankAccounts.map((account) => {
            const bank = getBankById(account.bankId)
            return (
              <div
                key={account.id}
                className="flex items-center gap-4 rounded-xl border border-border bg-bg-card px-5 py-4 shadow-sm"
              >
                {/* Bank color dot */}
                <div className={`h-9 w-9 shrink-0 rounded-full ${bank.color} flex items-center justify-center`}>
                  <span className="text-xs font-bold text-white leading-none">
                    {bank.name.slice(5, 7).toUpperCase()}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-t1 truncate">{bank.name}</div>
                  <div className="text-xs text-t2 mt-0.5">
                    {account.accountNumber} &middot; {account.accountName}
                  </div>
                </div>

                {/* QR badge */}
                {account.qrPreviewUrl ? (
                  <span className="shrink-0 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                    มี QR
                  </span>
                ) : (
                  <span className="shrink-0 rounded-full bg-bg-hover px-2.5 py-0.5 text-xs font-medium text-t3">
                    ไม่มี QR
                  </span>
                )}

                {/* Actions */}
                <button
                  onClick={() => openEditModal(account)}
                  className="shrink-0 rounded-lg p-1.5 text-t3 hover:bg-bg-hover hover:text-t1 transition-colors"
                  title="แก้ไข"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                {deleteConfirmId === account.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDelete(account.id)}
                      className="rounded-lg px-2.5 py-1 text-xs font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
                    >
                      ลบ
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      className="rounded-lg px-2.5 py-1 text-xs font-medium border border-border text-t2 hover:bg-bg-hover transition-colors"
                    >
                      ยกเลิก
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirmId(account.id)}
                    className="shrink-0 rounded-lg p-1.5 text-t3 hover:bg-red-50 hover:text-red-500 transition-colors"
                    title="ลบ"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Payso Settings ── */}
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

      {/* ── Add/Edit Bank Account Modal ── */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* Panel */}
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-bg-card shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h3 className="text-base font-semibold text-t1">
                {modal.editId ? 'แก้ไขบัญชีธนาคาร' : 'เพิ่มบัญชีธนาคาร'}
              </h3>
              <button
                onClick={closeModal}
                className="rounded-lg p-1.5 text-t3 hover:bg-bg-hover hover:text-t1 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              {/* Bank dropdown */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-t2">ธนาคาร</label>
                <select
                  value={modal.bankId}
                  onChange={(e) => setModal((prev) => ({ ...prev, bankId: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-bg-input px-3 py-2 text-sm text-t1 focus:border-primary focus:outline-none"
                >
                  {BANKS.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* Account number */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-t2">เลขที่บัญชี</label>
                <input
                  type="text"
                  value={modal.accountNumber}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9\-]/g, '')
                    setModal((prev) => ({ ...prev, accountNumber: raw }))
                  }}
                  className="w-full rounded-lg border border-border bg-bg-input px-3 py-2 text-sm text-t1 font-mono focus:border-primary focus:outline-none"
                  placeholder="XXX-X-XXXXX-X"
                />
              </div>

              {/* Account name */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-t2">ชื่อบัญชี</label>
                <input
                  type="text"
                  value={modal.accountName}
                  onChange={(e) => setModal((prev) => ({ ...prev, accountName: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-bg-input px-3 py-2 text-sm text-t1 focus:border-primary focus:outline-none"
                  placeholder="ชื่อ-นามสกุลเจ้าของบัญชี"
                />
              </div>

              {/* QR Code upload */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-t2">
                  QR Code รูปภาพ{' '}
                  <span className="text-xs font-normal text-t3">(ไม่บังคับ)</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleQrFileChange}
                />
                {modal.qrPreviewUrl ? (
                  <div className="relative inline-block">
                    <img
                      src={modal.qrPreviewUrl}
                      alt="QR preview"
                      className="h-32 w-32 rounded-lg border border-border object-contain bg-white"
                    />
                    <button
                      onClick={() => setModal((prev) => ({ ...prev, qrFile: null, qrPreviewUrl: null }))}
                      className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border bg-bg-hover px-4 py-6 text-sm text-t3 hover:border-primary hover:text-primary transition-colors"
                  >
                    <Upload className="h-6 w-6" />
                    <span>คลิกเพื่ออัปโหลดรูป QR Code</span>
                    <span className="text-xs">หรือลากและวางไฟล์ที่นี่</span>
                  </button>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
              <Button variant="outline" onClick={closeModal}>
                ยกเลิก
              </Button>
              <Button
                onClick={handleModalSave}
                disabled={!modal.accountNumber.trim() || !modal.accountName.trim()}
              >
                บันทึก
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
