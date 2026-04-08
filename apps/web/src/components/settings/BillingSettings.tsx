import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Lock, CreditCard, TrendingUp, Users, MessageSquare, X } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'

interface ConfirmModalProps {
  title: string
  description: string
  confirmLabel: string
  confirmVariant?: 'destructive' | 'default'
  onConfirm: () => void
  onClose: () => void
}

function ConfirmModal({ title, description, confirmLabel, confirmVariant = 'default', onConfirm, onClose }: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-2xl border border-border bg-bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <h3 className="font-semibold text-t1">{title}</h3>
          <button onClick={onClose} className="text-t3 hover:text-t1">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mb-6 text-sm text-t2">{description}</p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>ยกเลิก</Button>
          <Button
            onClick={() => { onConfirm(); onClose() }}
            className={confirmVariant === 'destructive' ? 'bg-error text-white hover:bg-error/90' : ''}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function BillingSettings() {
  const user = useAuthStore((s) => s.user)
  const isSuperAdmin = user?.permissions?.includes(3005) ?? false
  const [modal, setModal] = useState<'upgrade' | 'cancel' | null>(null)

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-bg-card p-12 text-center shadow-sm">
        <Lock className="mb-3 h-10 w-10 text-t3" />
        <p className="font-semibold text-t1">เฉพาะ Super Admin เท่านั้น</p>
        <p className="mt-1 text-sm text-t3">คุณไม่มีสิทธิ์เข้าถึงส่วน Billing</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-t1">Billing</h2>
        <p className="mt-0.5 text-sm text-t2">จัดการแผนและการชำระเงิน</p>
      </div>

      {/* Current Plan */}
      <div className="rounded-xl border border-primary bg-primary-alpha p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-white">Pro</span>
              <span className="text-sm font-semibold text-t1">One Bear Pro Plan</span>
            </div>
            <div className="mt-1 text-2xl font-bold text-t1">฿2,990<span className="text-sm font-normal text-t3">/เดือน</span></div>
            <div className="mt-2 text-xs text-t3">รอบบิลถัดไป: 8 พ.ค. 2026</div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setModal('upgrade')}>อัพเกรดแผน</Button>
            <Button variant="outline" onClick={() => setModal('cancel')}>ยกเลิกแผน</Button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {['ช่องทางไม่จำกัด', 'ทีม 20 คน', '50,000 ข้อความ/เดือน', 'AI Sales Agent', 'รายงานขั้นสูง'].map((feat) => (
            <span key={feat} className="rounded-full border border-primary/30 bg-white/50 px-2.5 py-0.5 text-xs text-primary">
              ✓ {feat}
            </span>
          ))}
        </div>
      </div>

      {/* Usage Meters */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { icon: <TrendingUp className="h-4 w-4" />, label: 'ช่องทาง', used: 4, limit: 'ไม่จำกัด', pct: null },
          { icon: <Users className="h-4 w-4" />, label: 'สมาชิกทีม', used: 7, limit: 20, pct: 35 },
          { icon: <MessageSquare className="h-4 w-4" />, label: 'ข้อความ/เดือน', used: 18420, limit: 50000, pct: 37 },
        ].map((meter) => (
          <div key={meter.label} className="rounded-xl border border-border bg-bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2 text-t2">
              {meter.icon}
              <span className="text-sm font-medium">{meter.label}</span>
            </div>
            <div className="mt-2 text-lg font-bold text-t1">
              {typeof meter.used === 'number' ? meter.used.toLocaleString() : meter.used}
              <span className="text-sm font-normal text-t3"> / {typeof meter.limit === 'number' ? meter.limit.toLocaleString() : meter.limit}</span>
            </div>
            {meter.pct !== null && (
              <div className="mt-2">
                <div className="h-2 w-full overflow-hidden rounded-full bg-bg-hover">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${meter.pct}%` }}
                  />
                </div>
                <div className="mt-1 text-xs text-t3">{meter.pct}% ใช้แล้ว</div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Payment Method */}
      <div className="rounded-xl border border-border bg-bg-card p-5 shadow-sm">
        <h3 className="mb-3 font-medium text-t1">วิธีชำระเงิน</h3>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-16 items-center justify-center rounded-lg border border-border bg-bg-hover">
            <CreditCard className="h-5 w-5 text-t3" />
          </div>
          <div>
            <div className="text-sm font-medium text-t1">Visa •••• •••• •••• 4242</div>
            <div className="text-xs text-t3">หมดอายุ 12/2027</div>
          </div>
          <Button variant="outline" size="sm" className="ml-auto">เปลี่ยน</Button>
        </div>
      </div>

      {/* Modals */}
      {modal === 'upgrade' && (
        <ConfirmModal
          title="อัพเกรดแผน"
          description="ต้องการอัพเกรดเป็นแผน Enterprise หรือไม่? ทีมงานจะติดต่อกลับภายใน 24 ชั่วโมง"
          confirmLabel="ยืนยัน — ติดต่อทีมขาย"
          onConfirm={() => {}}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'cancel' && (
        <ConfirmModal
          title="ยกเลิกแผน"
          description="หากยกเลิกแผน ฟีเจอร์ Pro จะยังใช้ได้ถึงสิ้นรอบบิล (8 พ.ค. 2026) จากนั้นจะเปลี่ยนเป็นแผนฟรี"
          confirmLabel="ยืนยันยกเลิก"
          confirmVariant="destructive"
          onConfirm={() => {}}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
