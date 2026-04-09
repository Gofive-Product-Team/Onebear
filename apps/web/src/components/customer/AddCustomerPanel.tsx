import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { cn } from '@one-bear/ui'
import { AlertTriangle, Plus, Trash2, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Sheet, SheetHeader, SheetTitle, SheetContent, SheetClose } from '@/components/ui/Sheet'
import { useCreateCustomer, useCheckDuplicate } from '@/api/useCustomers'

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
	customerType: z.enum(['Individual', 'Business']),
	idCardNumber: z.string().optional(),  // Individual only
	taxId: z.string().optional(),         // Business only
	name: z.string().min(1, 'จำเป็นต้องกรอกชื่อ'),
	email: z.string().email('อีเมลไม่ถูกต้อง').optional().or(z.literal('')),
	phone: z.string().optional(),
	// Address
	addressStreet: z.string().optional(),
	addressSubDistrict: z.string().optional(),
	addressDistrict: z.string().optional(),
	addressProvince: z.string().optional(),
	addressPostalCode: z.string().optional(),
	// Owner
	ownerUserId: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

// ─── Contact Person ───────────────────────────────────────────────────────────

interface ContactPerson {
	id: string
	name: string
	phone: string
	position: string
}

// ─── Duplicate warning ────────────────────────────────────────────────────────

interface DuplicateWarning {
	field: 'name' | 'email' | 'phone'
	matchId: string
	matchName: string
}

function DuplicateWarningBanner({
	warning,
	onViewProfile,
	onAddAnyway,
}: {
	warning: DuplicateWarning
	onViewProfile: (id: string) => void
	onAddAnyway: () => void
}) {
	return (
		<div className="flex flex-col gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
			<p>
				<AlertTriangle className="mr-1 inline h-4 w-4 shrink-0 text-orange-500" aria-hidden="true" />
				มีลูกค้าที่มี <strong>{warning.field}</strong> ตรงกันอยู่แล้ว —{' '}
				<strong>{warning.matchName}</strong>
			</p>
			<div className="flex gap-2">
				<button
					type="button"
					onClick={() => onViewProfile(warning.matchId)}
					className="rounded px-2 py-0.5 text-xs font-semibold text-amber-900 underline underline-offset-2 hover:text-amber-700"
				>
					ดูโปรไฟล์
				</button>
				<button
					type="button"
					onClick={onAddAnyway}
					className="rounded px-2 py-0.5 text-xs font-medium text-amber-700 hover:text-amber-900"
				>
					เพิ่มต่อไป
				</button>
			</div>
		</div>
	)
}

// ─── Type toggle ──────────────────────────────────────────────────────────────

function TypeToggle({
	value,
	onChange,
}: {
	value: 'Individual' | 'Business'
	onChange: (v: 'Individual' | 'Business') => void
}) {
	return (
		<div className="flex rounded-xl border border-border bg-bg-input p-1 gap-1">
			{(['Individual', 'Business'] as const).map((t) => (
				<button
					key={t}
					type="button"
					onClick={() => onChange(t)}
					className={cn(
						'flex-1 rounded-lg py-2 text-sm font-medium transition-all',
						value === t
							? 'bg-bg-card text-primary shadow-sm'
							: 'text-t3 hover:text-t2',
					)}
				>
					{t === 'Individual' ? '👤 บุคคลธรรมดา' : '🏢 นิติบุคคล'}
				</button>
			))}
		</div>
	)
}

// ─── Contact person card ──────────────────────────────────────────────────────

function ContactPersonCard({
	contact,
	onRemove,
}: {
	contact: ContactPerson
	onRemove: () => void
}) {
	return (
		<div className="flex items-start gap-3 rounded-xl border border-border bg-bg-input p-3">
			<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
				{contact.name.slice(0, 2).toUpperCase()}
			</div>
			<div className="min-w-0 flex-1">
				<div className="font-medium text-sm text-t1">{contact.name}</div>
				{contact.position && (
					<div className="text-xs text-t3">{contact.position}</div>
				)}
				{contact.phone && (
					<div className="text-xs text-t2 mt-0.5">{contact.phone}</div>
				)}
			</div>
			<button
				type="button"
				onClick={onRemove}
				className="rounded-md p-1 text-t3 hover:bg-red-50 hover:text-red-500 transition-colors"
			>
				<Trash2 className="h-3.5 w-3.5" />
			</button>
		</div>
	)
}

// ─── Add contact person form ──────────────────────────────────────────────────

function AddContactForm({ onAdd, onCancel }: { onAdd: (c: Omit<ContactPerson, 'id'>) => void; onCancel: () => void }) {
	const [name, setName] = useState('')
	const [phone, setPhone] = useState('')
	const [position, setPosition] = useState('')
	const canAdd = name.trim().length > 0

	function handleAdd() {
		if (!canAdd) return
		onAdd({ name: name.trim(), phone: phone.trim(), position: position.trim() })
	}

	return (
		<div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
			<div className="text-xs font-semibold text-primary uppercase tracking-wide">ผู้ติดต่อใหม่</div>
			<div className="space-y-2">
				<input
					type="text"
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="ชื่อผู้ติดต่อ *"
					className="w-full rounded-lg border border-border bg-bg-card px-3 py-2 text-sm text-t1 placeholder:text-t3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
					autoFocus
				/>
				<input
					type="text"
					value={position}
					onChange={(e) => setPosition(e.target.value)}
					placeholder="ตำแหน่ง เช่น ผู้จัดการ, ฝ่ายจัดซื้อ"
					className="w-full rounded-lg border border-border bg-bg-card px-3 py-2 text-sm text-t1 placeholder:text-t3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
				/>
				<input
					type="tel"
					value={phone}
					onChange={(e) => setPhone(e.target.value)}
					placeholder="เบอร์โทรศัพท์"
					className="w-full rounded-lg border border-border bg-bg-card px-3 py-2 text-sm text-t1 placeholder:text-t3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
				/>
			</div>
			<div className="flex gap-2">
				<button
					type="button"
					onClick={handleAdd}
					disabled={!canAdd}
					className="flex-1 rounded-lg bg-primary py-2 text-sm font-medium text-white disabled:opacity-40 hover:opacity-90 transition-opacity"
				>
					เพิ่ม
				</button>
				<button
					type="button"
					onClick={onCancel}
					className="flex-1 rounded-lg border border-border py-2 text-sm font-medium text-t2 hover:bg-bg-hover transition-colors"
				>
					ยกเลิก
				</button>
			</div>
		</div>
	)
}

// ─── Mock agents (replace with useTeamMembers hook when API is ready) ─────────

const MOCK_AGENTS = [
	{ id: 'u1', name: 'สมชาย ใจดี', role: 'Agent' },
	{ id: 'u2', name: 'วิไล รักษา', role: 'Manager' },
	{ id: 'dev-user', name: 'Dev User', role: 'Super Admin' },
]

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
	open: boolean
	onOpenChange: (open: boolean) => void
	initialName?: string
	/** When true, the form creates a Lead instead of a Customer */
	isLead?: boolean
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AddCustomerPanel({ open, onOpenChange, initialName, isLead = false }: Props) {
	const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
	const createCustomer = useCreateCustomer()
	const checkDuplicate = useCheckDuplicate()

	const [duplicateWarning, setDuplicateWarning] = useState<DuplicateWarning | null>(null)
	const [addAnyway, setAddAnyway] = useState(false)
	const [contactPersons, setContactPersons] = useState<ContactPerson[]>([])
	const [showAddContactForm, setShowAddContactForm] = useState(false)

	const {
		register,
		handleSubmit,
		reset,
		setValue,
		watch,
		formState: { errors, isSubmitting },
	} = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: { customerType: 'Individual' },
	})

	const customerType = watch('customerType')
	const isBusiness = customerType === 'Business'

	// Pre-fill name when opened from search prompt
	useEffect(() => {
		if (open && initialName) setValue('name', initialName)
	}, [open, initialName, setValue])

	// Reset on close
	useEffect(() => {
		if (!open) {
			reset({ customerType: 'Individual' })
			setDuplicateWarning(null)
			setAddAnyway(false)
			setContactPersons([])
			setShowAddContactForm(false)
		}
	}, [open, reset])

	// Switch type → clear conditional ID fields
	function handleTypeChange(t: 'Individual' | 'Business') {
		setValue('customerType', t)
		setValue('idCardNumber', '')
		setValue('taxId', '')
	}

	async function checkField(field: 'name' | 'email' | 'phone', value: string) {
		if (!value.trim() || addAnyway) return
		const result = await checkDuplicate.mutateAsync({ [field]: value.trim() })
		if (result.hasDuplicate && result.matches.length > 0) {
			const match = result.matches[0]
			setDuplicateWarning({ field, matchId: match.id, matchName: match.name })
		} else if (duplicateWarning?.field === field) {
			setDuplicateWarning(null)
		}
	}

	function handleAddContact(c: Omit<ContactPerson, 'id'>) {
		setContactPersons((prev) => [...prev, { ...c, id: crypto.randomUUID() }])
		setShowAddContactForm(false)
	}

	function handleRemoveContact(id: string) {
		setContactPersons((prev) => prev.filter((c) => c.id !== id))
	}

	async function onSubmit(values: FormValues) {
		await createCustomer.mutateAsync({
			name: values.name,
			email: values.email || undefined,
			phone: values.phone || undefined,
			customerType: isBusiness ? 'Organization' : 'Individual',
			taxId: isBusiness ? values.taxId || undefined : undefined,
			idCardNumber: !isBusiness ? values.idCardNumber || undefined : undefined,
			contactPersons: isBusiness ? contactPersons : undefined,
		} as Parameters<typeof createCustomer.mutateAsync>[0])
		onOpenChange(false)
	}

	return (
		<Sheet open={open} onOpenChange={onOpenChange} side={isMobile ? 'bottom' : 'right'}>
			<SheetHeader>
				<SheetTitle>
				{isLead
					? (isBusiness ? 'เพิ่มผู้สนใจ (นิติบุคคล)' : 'เพิ่มผู้สนใจ')
					: (isBusiness ? 'เพิ่มนิติบุคคล' : 'เพิ่มลูกค้า')}
			</SheetTitle>
				<SheetClose onClose={() => onOpenChange(false)} />
			</SheetHeader>

			<SheetContent>
				<form
					id="add-customer-form"
					onSubmit={handleSubmit(onSubmit)}
					noValidate
					className="flex flex-col gap-5 p-4"
				>
					{/* ① Type — always first */}
					<div className="flex flex-col gap-1.5">
						<label className="text-sm font-medium text-t1">ประเภทลูกค้า</label>
						<TypeToggle value={customerType} onChange={handleTypeChange} />
					</div>

					{/* ② ID — conditional */}
					{!isBusiness ? (
						<div className="flex flex-col gap-1.5">
							<label htmlFor="ac-idcard" className="text-sm font-medium text-t1">
								เลขบัตรประชาชน
								<span className="ml-1 text-xs font-normal text-t3">(ไม่บังคับ)</span>
							</label>
							<Input
								id="ac-idcard"
								placeholder="1 xxxx xxxxx xx x"
								maxLength={17}
								{...register('idCardNumber')}
							/>
							<p className="text-xs text-t3">ใช้สำหรับยืนยันตัวตนและป้องกันรายชื่อซ้ำ</p>
						</div>
					) : (
						<div className="flex flex-col gap-1.5">
							<label htmlFor="ac-taxid" className="text-sm font-medium text-t1">
								เลขประจำตัวผู้เสียภาษี
								<span className="ml-1 text-xs font-normal text-t3">(ไม่บังคับ)</span>
							</label>
							<Input
								id="ac-taxid"
								placeholder="0 xxxx xxxxx xx x"
								maxLength={17}
								{...register('taxId')}
							/>
							<p className="text-xs text-t3">ใช้ค้นหาและออกเอกสารภาษี</p>
						</div>
					)}

					{/* ③ Name / Company Name */}
					<div className="flex flex-col gap-1.5">
						<label htmlFor="ac-name" className="text-sm font-medium text-t1">
							{isBusiness ? 'ชื่อบริษัท / นิติบุคคล' : 'ชื่อ-นามสกุล'}{' '}
							<span className="text-error">*</span>
						</label>
						<Input
							id="ac-name"
							placeholder={isBusiness ? 'บริษัท ABC จำกัด' : 'ชื่อ นามสกุล'}
							aria-invalid={!!errors.name}
							{...register('name', {
								onBlur: (e) => checkField('name', e.target.value),
							})}
						/>
						{errors.name && (
							<p className="text-xs text-error">{errors.name.message}</p>
						)}
						{duplicateWarning?.field === 'name' && (
							<DuplicateWarningBanner
								warning={duplicateWarning}
								onViewProfile={(id) => { window.location.href = `/customer/${id}` }}
								onAddAnyway={() => { setDuplicateWarning(null); setAddAnyway(true) }}
							/>
						)}
					</div>

					{/* ④ Email */}
					<div className="flex flex-col gap-1.5">
						<label htmlFor="ac-email" className="text-sm font-medium text-t1">
							อีเมล
						</label>
						<Input
							id="ac-email"
							type="email"
							placeholder="example@email.com"
							aria-invalid={!!errors.email}
							{...register('email', {
								onBlur: (e) => checkField('email', e.target.value),
							})}
						/>
						{errors.email && (
							<p className="text-xs text-error">{errors.email.message}</p>
						)}
						{duplicateWarning?.field === 'email' && (
							<DuplicateWarningBanner
								warning={duplicateWarning}
								onViewProfile={(id) => { window.location.href = `/customer/${id}` }}
								onAddAnyway={() => { setDuplicateWarning(null); setAddAnyway(true) }}
							/>
						)}
					</div>

					{/* ⑤ Phone */}
					<div className="flex flex-col gap-1.5">
						<label htmlFor="ac-phone" className="text-sm font-medium text-t1">
							เบอร์โทรศัพท์
						</label>
						<Input
							id="ac-phone"
							type="tel"
							placeholder="08x-xxx-xxxx"
							{...register('phone', {
								onBlur: (e) => checkField('phone', e.target.value),
							})}
						/>
						{duplicateWarning?.field === 'phone' && (
							<DuplicateWarningBanner
								warning={duplicateWarning}
								onViewProfile={(id) => { window.location.href = `/customer/${id}` }}
								onAddAnyway={() => { setDuplicateWarning(null); setAddAnyway(true) }}
							/>
						)}
					</div>

					{/* ⑥ Address */}
					<div className="flex flex-col gap-2">
						<div className="flex items-center justify-between">
							<label className="text-sm font-semibold text-t1">ที่อยู่</label>
							<span className="text-xs font-normal text-t3">(ไม่บังคับ)</span>
						</div>
						<Input
							placeholder="บ้านเลขที่ / ถนน / ซอย"
							{...register('addressStreet')}
						/>
						<div className="grid grid-cols-2 gap-2">
							<Input
								placeholder="แขวง / ตำบล"
								{...register('addressSubDistrict')}
							/>
							<Input
								placeholder="เขต / อำเภอ"
								{...register('addressDistrict')}
							/>
						</div>
						<div className="grid grid-cols-2 gap-2">
							<Input
								placeholder="จังหวัด"
								{...register('addressProvince')}
							/>
							<Input
								placeholder="รหัสไปรษณีย์"
								maxLength={5}
								{...register('addressPostalCode')}
							/>
						</div>
					</div>

					{/* ⑦ Contact Persons — Business only */}
					{isBusiness && (
						<div className="flex flex-col gap-3">
							{/* Section header */}
							<div className="flex items-center justify-between">
								<div>
									<div className="text-sm font-semibold text-t1">ผู้ติดต่อ</div>
									<div className="text-xs text-t3">บุคคลที่ติดต่อในนามบริษัท</div>
								</div>
								{!showAddContactForm && (
									<button
										type="button"
										onClick={() => setShowAddContactForm(true)}
										className="flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
									>
										<UserPlus className="h-3.5 w-3.5" />
										เพิ่มผู้ติดต่อ
									</button>
								)}
							</div>

							{/* Existing contacts */}
							{contactPersons.length > 0 && (
								<div className="space-y-2">
									{contactPersons.map((c) => (
										<ContactPersonCard
											key={c.id}
											contact={c}
											onRemove={() => handleRemoveContact(c.id)}
										/>
									))}
								</div>
							)}

							{/* Empty hint */}
							{contactPersons.length === 0 && !showAddContactForm && (
								<button
									type="button"
									onClick={() => setShowAddContactForm(true)}
									className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-border py-4 text-sm text-t3 transition-colors hover:border-primary/40 hover:text-primary hover:bg-primary/5"
								>
									<Plus className="h-4 w-4" />
									เพิ่มผู้ติดต่อคนแรก
								</button>
							)}

							{/* Inline add form */}
							{showAddContactForm && (
								<AddContactForm
									onAdd={handleAddContact}
									onCancel={() => setShowAddContactForm(false)}
								/>
							)}

							{/* Add another */}
							{contactPersons.length > 0 && !showAddContactForm && (
								<button
									type="button"
									onClick={() => setShowAddContactForm(true)}
									className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
								>
									<Plus className="h-3.5 w-3.5" />
									เพิ่มผู้ติดต่ออีกคน
								</button>
							)}
						</div>
					)}

					{/* ⑧ Owner — always last */}
					<div className="flex flex-col gap-1.5">
						<label htmlFor="ac-owner" className="text-sm font-medium text-t1">
							ผู้รับผิดชอบ
							<span className="ml-1 text-xs font-normal text-t3">(ไม่บังคับ)</span>
						</label>
						<select
							id="ac-owner"
							{...register('ownerUserId')}
							className="w-full rounded-xl border border-border bg-bg-input px-3 py-2 text-sm text-t1 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
						>
							<option value="">— ยังไม่มอบหมาย —</option>
							{MOCK_AGENTS.map((a) => (
								<option key={a.id} value={a.id}>
									{a.name} · {a.role}
								</option>
							))}
						</select>
					</div>

					{/* API error */}
					{createCustomer.isError && (
						<div className="rounded-md border border-error bg-error-bg p-3 text-sm text-error">
							เกิดข้อผิดพลาด กรุณาลองอีกครั้ง
						</div>
					)}
				</form>
			</SheetContent>

			{/* Footer */}
			<div className="flex gap-3 border-t border-border p-4">
				<Button
					type="button"
					variant="outline"
					className="flex-1"
					onClick={() => onOpenChange(false)}
				>
					ยกเลิก
				</Button>
				<Button
					type="submit"
					form="add-customer-form"
					className="flex-1"
					loading={isSubmitting || createCustomer.isPending}
				>
					{isLead
					? (isBusiness ? 'เพิ่มผู้สนใจ (นิติบุคคล)' : 'เพิ่มผู้สนใจ')
					: (isBusiness ? 'เพิ่มนิติบุคคล' : 'เพิ่มลูกค้า')}
				</Button>
			</div>
		</Sheet>
	)
}
