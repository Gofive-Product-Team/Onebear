import { useState } from 'react'
import { cn } from '@one-bear/ui'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  usePendingSlips,
  useReviewSlip,
  type SlipVerification,
} from '@/api/useSlips'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import {
  FileCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldAlert,
  Clock,
  Plus,
  Trash2,
  Info,
} from 'lucide-react'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatThb(amount: number) {
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount)
}

function formatRelativeTime(timestamp: number) {
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

const BANK_NAMES: Record<string, string> = {
  SCB: 'ไทยพาณิชย์',
  KTB: 'กรุงไทย',
  BBL: 'กรุงเทพ',
  BAY: 'กรุงศรี',
  KBANK: 'กสิกรไทย',
  TMB: 'ทหารไทย',
  TTB: 'ทีเอ็มบีธนชาต',
  UOB: 'ยูโอบี',
  GSB: 'ออมสิน',
  OTHER: 'อื่นๆ',
}

const REJECTION_REASONS = [
  { code: 'IMAGE_UNCLEAR', label: 'ภาพไม่ชัด' },
  { code: 'AMOUNT_MISMATCH', label: 'ยอดเงินไม่ตรง' },
  { code: 'WRONG_ACCOUNT', label: 'บัญชีไม่ถูกต้อง' },
  { code: 'EXPIRED_SLIP', label: 'สลิปหมดอายุ (>24ช.ม.)' },
  { code: 'DUPLICATE_SLIP', label: 'สลิปซ้ำ' },
  { code: 'SUSPICIOUS', label: 'น่าสงสัย' },
  { code: 'OTHER', label: 'อื่นๆ' },
]

// ─── Rejection Modal ──────────────────────────────────────────────────────────

interface RejectionModalProps {
  slip: SlipVerification
  onClose: () => void
}

function RejectionModal({ slip, onClose }: RejectionModalProps) {
  const [reasonCode, setReasonCode] = useState('')
  const [note, setNote] = useState('')
  const [addToBlacklist, setAddToBlacklist] = useState(false)
  const reviewSlip = useReviewSlip()

  function handleReasonChange(code: string) {
    setReasonCode(code)
    setAddToBlacklist(code === 'SUSPICIOUS')
  }

  function handleConfirm() {
    if (!reasonCode) return
    reviewSlip.mutate(
      {
        slipId: slip.id,
        body: {
          action: 'reject',
          rejectionReasonCode: reasonCode,
          adminNote: note || undefined,
        },
      },
      { onSuccess: onClose },
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="mx-4 w-full max-w-md rounded-xl border border-border bg-bg-card p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center gap-2">
          <XCircle className="h-5 w-5 text-error" />
          <h2 className="text-lg font-semibold text-t1">ปฏิเสธสลิป</h2>
        </div>
        <p className="mb-4 text-sm text-t3">
          สลิป <span className="font-mono font-semibold">{slip.id.slice(-8).toUpperCase()}</span>
        </p>

        {/* Reason */}
        <div className="mb-3">
          <label className="mb-1.5 block text-sm font-medium text-t2">เหตุผลการปฏิเสธ *</label>
          <select
            value={reasonCode}
            onChange={(e) => handleReasonChange(e.target.value)}
            className="w-full rounded-lg border border-border-input bg-bg-input px-3 py-2 text-sm text-t1 focus:border-primary focus:outline-none"
          >
            <option value="">-- เลือกเหตุผล --</option>
            {REJECTION_REASONS.map((r) => (
              <option key={r.code} value={r.code}>{r.label}</option>
            ))}
          </select>
        </div>

        {/* Note */}
        <div className="mb-3">
          <label className="mb-1.5 block text-sm font-medium text-t2">หมายเหตุ (admin only)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="บันทึกภายใน..."
            className="w-full rounded-lg border border-border-input bg-bg-input px-3 py-2 text-sm text-t1 placeholder:text-t3 focus:border-primary focus:outline-none resize-none"
          />
        </div>

        {/* Blacklist checkbox */}
        <label className="mb-5 flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={addToBlacklist}
            onChange={(e) => setAddToBlacklist(e.target.checked)}
            className="h-4 w-4 rounded border-border-input accent-error"
          />
          <span className={cn('font-medium', addToBlacklist ? 'text-error' : 'text-t2')}>
            เพิ่มเข้า Blacklist
          </span>
        </label>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>ยกเลิก</Button>
          <Button
            className="flex-1 bg-error text-white hover:bg-error/90"
            onClick={handleConfirm}
            disabled={!reasonCode || reviewSlip.isPending}
          >
            <XCircle className="mr-1.5 h-3.5 w-3.5" />
            ยืนยันปฏิเสธ
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Blacklist Entry (local stub) ─────────────────────────────────────────────

interface BlacklistEntry {
  id: string
  accountNumber: string
  bank: string
  reason: string
  addedDate: number
  expiresDate: number | null
  duration: string
}

// ─── Slip Review Card ─────────────────────────────────────────────────────────

function SlipReviewCard({ slip }: { slip: SlipVerification }) {
  const [showRejectModal, setShowRejectModal] = useState(false)
  const reviewSlip = useReviewSlip()
  const confidence = slip.confidence ?? 0
  const bankName = slip.extractedBankCode ? (BANK_NAMES[slip.extractedBankCode] ?? slip.extractedBankCode) : 'Unknown'
  const retryCount = slip.submissionCount ?? 1

  function handleApprove() {
    reviewSlip.mutate({ slipId: slip.id, body: { action: 'approve' } })
  }

  return (
    <>
      <div className="rounded-xl border border-border bg-bg-card p-4 shadow-sm space-y-3">
        {/* 3rd attempt warning banner */}
        {retryCount >= 3 && (
          <div className="flex items-center gap-2 rounded-lg bg-error/10 border border-error/30 px-3 py-2 text-sm text-error font-medium">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            ลูกค้าส่งสลิปครั้งที่ 3 — กรุณาตรวจสอบด่วน
          </div>
        )}

        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-sm font-semibold text-t1">{slip.id.slice(-8).toUpperCase()}</span>
              {/* Retry counter */}
              <span className={cn(
                'rounded-full px-2 py-0.5 text-xs font-medium',
                retryCount >= 3 ? 'bg-error/15 text-error' : retryCount >= 2 ? 'bg-warning/15 text-warning' : 'bg-bg-input text-t3',
              )}>
                ครั้งที่ {retryCount}/3
              </span>
              {slip.manualReviewRequired && (
                <Badge variant="warning">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Manual Review
                </Badge>
              )}
            </div>
            <p className="mt-1 text-xs text-t3">
              <Clock className="inline h-3 w-3 mr-1" />
              {formatRelativeTime(slip.createdTimestamp)}
            </p>
          </div>
          <div className="text-right shrink-0">
            {slip.extractedAmount != null && (
              <div className="text-lg font-bold text-t1">{formatThb(slip.extractedAmount)}</div>
            )}
            <div className="text-xs text-t3">{bankName}</div>
            {/* Amount tolerance chip */}
            <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-t3 bg-bg-input rounded-full px-2 py-0.5">
              <Info className="h-2.5 w-2.5" />
              tolerance ±฿1
            </div>
          </div>
        </div>

        {/* Verification checks */}
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          {[
            { label: 'Amount', ok: slip.amountMatches },
            { label: 'Account', ok: slip.accountMatches },
            { label: 'Timestamp', ok: slip.timestampValid },
            { label: 'Bank logo', ok: slip.bankLogoRecognized },
          ].map((check) => (
            <div key={check.label} className={cn(
              'flex items-center gap-1 rounded-lg px-2 py-1 text-xs',
              check.ok === true ? 'bg-success/10 text-success' :
              check.ok === false ? 'bg-error/10 text-error' :
              'bg-bg-input text-t3',
            )}>
              {check.ok === true ? <CheckCircle2 className="h-3 w-3 shrink-0" /> :
               check.ok === false ? <XCircle className="h-3 w-3 shrink-0" /> :
               <Clock className="h-3 w-3 shrink-0" />}
              {check.label}
            </div>
          ))}
        </div>

        {/* AI confidence bar */}
        <div>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-t3">AI Confidence</span>
            <span className={cn(
              'font-semibold',
              confidence >= 70 ? 'text-success' : confidence >= 40 ? 'text-warning' : 'text-error',
            )}>
              {confidence}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-bg-input">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                confidence >= 70 ? 'bg-success' : confidence >= 40 ? 'bg-warning' : 'bg-error',
              )}
              style={{ width: `${confidence}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleApprove}
            disabled={reviewSlip.isPending}
            className="flex-1"
          >
            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowRejectModal(true)}
            disabled={reviewSlip.isPending}
            className="flex-1 text-error hover:border-error hover:bg-error/10"
          >
            <XCircle className="mr-1.5 h-3.5 w-3.5" />
            Reject
          </Button>
        </div>
      </div>

      {showRejectModal && (
        <RejectionModal slip={slip} onClose={() => setShowRejectModal(false)} />
      )}
    </>
  )
}

// ─── Blacklist Tab ────────────────────────────────────────────────────────────

function BlacklistTab({ slipBlacklisted }: { slipBlacklisted: SlipVerification[] }) {
  const companyId = useAuthStore((s) => s.user?.companyId ?? '')
  const queryClient = useQueryClient()

  // Local blacklist entries (stub)
  const [localEntries, setLocalEntries] = useState<BlacklistEntry[]>([])
  const [form, setForm] = useState({
    accountNumber: '',
    bank: '',
    reason: '',
    duration: '30',
  })
  const [toast, setToast] = useState('')

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  function handleAdd() {
    if (!form.accountNumber || !form.bank || !form.reason) return
    const now = Date.now()
    const durationDays = form.duration === 'permanent' ? null : parseInt(form.duration, 10)
    const entry: BlacklistEntry = {
      id: Math.random().toString(36).slice(2),
      accountNumber: form.accountNumber,
      bank: form.bank,
      reason: form.reason,
      addedDate: now,
      expiresDate: durationDays ? now + durationDays * 86400000 : null,
      duration: form.duration,
    }
    setLocalEntries((prev) => [entry, ...prev])
    setForm({ accountNumber: '', bank: '', reason: '', duration: '30' })
    showToast('เพิ่มเข้า Blacklist แล้ว')
    // Stub: also invalidate slips query
    queryClient.invalidateQueries({ queryKey: ['slips-pending', companyId] })
  }

  function handleRemove(id: string) {
    setLocalEntries((prev) => prev.filter((e) => e.id !== id))
  }

  function getExpiryStatus(entry: BlacklistEntry): { label: string; color: string } {
    if (!entry.expiresDate) return { label: 'Permanent', color: 'bg-error/10 text-error' }
    const remaining = entry.expiresDate - Date.now()
    if (remaining <= 0) return { label: 'Expired', color: 'bg-bg-input text-t3' }
    const days = Math.ceil(remaining / 86400000)
    if (days <= 7) return { label: `หมด ${days}ว.`, color: 'bg-warning/10 text-warning' }
    return { label: 'Active', color: 'bg-success/10 text-success' }
  }

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-lg bg-success px-4 py-2 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}

      {/* Add form */}
      <div className="rounded-xl border border-border bg-bg-card p-4 shadow-sm space-y-3">
        <h3 className="text-sm font-semibold text-t1">เพิ่ม Blacklist</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-t3">เลขบัญชี</label>
            <input
              value={form.accountNumber}
              onChange={(e) => setForm((f) => ({ ...f, accountNumber: e.target.value }))}
              placeholder="xxx-x-xxxxx-x"
              className="w-full rounded-lg border border-border-input bg-bg-input px-3 py-2 text-sm text-t1 placeholder:text-t3 focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-t3">ธนาคาร</label>
            <select
              value={form.bank}
              onChange={(e) => setForm((f) => ({ ...f, bank: e.target.value }))}
              className="w-full rounded-lg border border-border-input bg-bg-input px-3 py-2 text-sm text-t1 focus:border-primary focus:outline-none"
            >
              <option value="">-- เลือกธนาคาร --</option>
              <option value="KBANK">ธนาคารกสิกร</option>
              <option value="SCB">ไทยพาณิชย์</option>
              <option value="BBL">กรุงเทพ</option>
              <option value="KTB">กรุงไทย</option>
              <option value="GSB">ออมสิน</option>
              <option value="TMB">ทหารไทย</option>
              <option value="OTHER">อื่นๆ</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-t3">เหตุผล</label>
            <input
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              placeholder="เช่น สลิปปลอม, ฉ้อโกง"
              className="w-full rounded-lg border border-border-input bg-bg-input px-3 py-2 text-sm text-t1 placeholder:text-t3 focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-t3">ระยะเวลา</label>
            <select
              value={form.duration}
              onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
              className="w-full rounded-lg border border-border-input bg-bg-input px-3 py-2 text-sm text-t1 focus:border-primary focus:outline-none"
            >
              <option value="7">7 วัน</option>
              <option value="30">30 วัน</option>
              <option value="90">90 วัน</option>
              <option value="permanent">ถาวร</option>
            </select>
          </div>
        </div>
        <Button
          size="sm"
          onClick={handleAdd}
          disabled={!form.accountNumber || !form.bank || !form.reason}
          className="w-full sm:w-auto"
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          เพิ่ม
        </Button>
      </div>

      {/* Entries from slips */}
      {slipBlacklisted.length === 0 && localEntries.length === 0 ? (
        <div className="py-12 text-center text-sm text-t3">ไม่มีบัญชีใน Blacklist</div>
      ) : (
        <div className="space-y-2">
          {/* Local manually-added entries */}
          {localEntries.map((entry) => {
            const status = getExpiryStatus(entry)
            return (
              <div key={entry.id} className="flex items-center justify-between rounded-xl border border-error/30 bg-error/5 p-4 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <ShieldAlert className="h-4 w-4 text-error shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-semibold text-t1">{entry.accountNumber}</span>
                      <span className="text-xs text-t3">{BANK_NAMES[entry.bank] ?? entry.bank}</span>
                      <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', status.color)}>{status.label}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-t3">
                      {entry.reason} &middot; เพิ่ม {new Date(entry.addedDate).toLocaleDateString('th-TH')}
                      {entry.expiresDate && ` &middot; หมด ${new Date(entry.expiresDate).toLocaleDateString('th-TH')}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(entry.id)}
                  className="shrink-0 rounded-lg p-1.5 text-t3 hover:bg-error/10 hover:text-error"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )
          })}

          {/* From slip data */}
          {slipBlacklisted.map((slip) => (
            <div key={slip.id} className="flex items-center justify-between rounded-xl border border-error/30 bg-error/5 p-4 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <ShieldAlert className="h-4 w-4 text-error shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-semibold text-t1">{slip.id.slice(-8).toUpperCase()}</span>
                    {slip.extractedBankCode && (
                      <span className="text-xs text-t3">{BANK_NAMES[slip.extractedBankCode] ?? slip.extractedBankCode}</span>
                    )}
                    <span className="rounded-full bg-error/10 px-2 py-0.5 text-xs font-medium text-error">Active</span>
                  </div>
                  {slip.extractedAccountName && (
                    <p className="mt-0.5 text-xs text-t3">{slip.extractedAccountName}</p>
                  )}
                </div>
              </div>
              <Button size="sm" variant="outline" className="text-error hover:border-error hover:bg-error/10 shrink-0">
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = 'auto' | 'pending' | 'blacklist'

export function SlipVerificationPage() {
  const [tab, setTab] = useState<Tab>('pending')

  const { data: pendingSlips, isLoading } = usePendingSlips()
  const allSlips = pendingSlips ?? []

  const autoApproved = allSlips.filter((s) => !s.manualReviewRequired && s.status === 'Approved')
  const pending = allSlips.filter((s) => s.manualReviewRequired || s.status === 'Pending')
  const blacklisted = allSlips.filter((s) => s.isBlacklisted)

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: 'auto', label: 'อนุมัติอัตโนมัติ', count: autoApproved.length },
    { key: 'pending', label: 'รอตรวจสอบ', count: pending.length },
    { key: 'blacklist', label: 'Blacklist', count: blacklisted.length },
  ]

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-t1">Slip Verification</h1>
        <p className="mt-0.5 text-sm text-t2">ตรวจสอบสลิปการชำระเงินด้วย AI</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-success">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm font-medium">อนุมัติอัตโนมัติวันนี้</span>
          </div>
          <div className="mt-2 text-3xl font-bold text-t1">{autoApproved.length}</div>
        </div>
        <div className="rounded-xl border border-border bg-bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-warning">
            <FileCheck className="h-5 w-5" />
            <span className="text-sm font-medium">รอตรวจสอบ</span>
          </div>
          <div className="mt-2 text-3xl font-bold text-t1">{pending.length}</div>
        </div>
        <div className="rounded-xl border border-border bg-bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-error">
            <ShieldAlert className="h-5 w-5" />
            <span className="text-sm font-medium">Blacklist</span>
          </div>
          <div className="mt-2 text-3xl font-bold text-t1">{blacklisted.length}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-bg-card p-1 shadow-sm">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all whitespace-nowrap',
              tab === t.key ? 'bg-primary text-white shadow-sm' : 'text-t2 hover:bg-bg-hover',
            )}
          >
            {t.label}
            <span className={cn(
              'rounded-full px-1.5 py-0.5 text-xs',
              tab === t.key ? 'bg-white/20' : 'bg-bg-input text-t3',
            )}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex h-40 items-center justify-center text-sm text-t3">Loading slips...</div>
      ) : tab === 'pending' ? (
        pending.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-bg-input text-t3">
              <FileCheck className="h-10 w-10" />
            </div>
            <div>
              <p className="text-base font-semibold text-t1">ไม่มีสลิปรอตรวจสอบ</p>
              <p className="mt-1 text-sm text-t2">สลิปทั้งหมดได้รับการตรวจสอบแล้ว</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((slip) => (
              <SlipReviewCard key={slip.id} slip={slip} />
            ))}
          </div>
        )
      ) : tab === 'auto' ? (
        autoApproved.length === 0 ? (
          <div className="py-12 text-center text-sm text-t3">ยังไม่มีสลิปอนุมัติอัตโนมัติวันนี้</div>
        ) : (
          <div className="space-y-2">
            {autoApproved.map((slip) => (
              <div key={slip.id} className="flex items-center justify-between rounded-xl border border-border bg-bg-card p-4 shadow-sm">
                <div>
                  <span className="font-mono text-sm font-semibold text-t1">{slip.id.slice(-8).toUpperCase()}</span>
                  <p className="mt-0.5 text-xs text-t3">{formatRelativeTime(slip.createdTimestamp)}</p>
                </div>
                {slip.extractedAmount != null && (
                  <span className="font-semibold text-success">{formatThb(slip.extractedAmount)}</span>
                )}
                <Badge variant="success">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Auto-approved
                </Badge>
              </div>
            ))}
          </div>
        )
      ) : (
        <BlacklistTab slipBlacklisted={blacklisted} />
      )}
    </div>
  )
}
