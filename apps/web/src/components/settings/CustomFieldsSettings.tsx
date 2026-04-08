import { useState } from 'react'
import { cn } from '@one-bear/ui'

type FieldType = 'Text' | 'Number' | 'Date' | 'Dropdown' | 'Checkbox' | 'Textarea'
type UsedIn = 'ลูกค้าทุกคน' | 'LINE เท่านั้น' | 'Facebook เท่านั้น' | 'เฉพาะบางช่องทาง...'

interface CustomField {
	id: string
	name: string
	type: FieldType
	required: boolean
	usedIn: UsedIn
	dropdownOptions?: string
}

const INITIAL_FIELDS: CustomField[] = [
	{ id: '1', name: 'วันเกิด',        type: 'Date',     required: false, usedIn: 'ลูกค้าทุกคน' },
	{ id: '2', name: 'ที่มาลูกค้า',    type: 'Dropdown', required: false, usedIn: 'ลูกค้าทุกคน', dropdownOptions: 'โซเชียล,แนะนำ,โฆษณา' },
	{ id: '3', name: 'รหัสสมาชิก',     type: 'Text',     required: true,  usedIn: 'ลูกค้าทุกคน' },
	{ id: '4', name: 'หมายเหตุพิเศษ',  type: 'Textarea', required: false, usedIn: 'ลูกค้าทุกคน' },
	{ id: '5', name: 'Line UID',        type: 'Text',     required: false, usedIn: 'LINE เท่านั้น' },
]

const TYPE_BADGE_CLASSES: Record<FieldType, string> = {
	Text:     'bg-blue-100 text-blue-700',
	Date:     'bg-teal-100 text-teal-700',
	Dropdown: 'bg-purple-100 text-purple-700',
	Textarea: 'bg-gray-100 text-gray-600',
	Number:   'bg-orange-100 text-orange-700',
	Checkbox: 'bg-green-100 text-green-700',
}

const FIELD_TYPES: FieldType[] = ['Text', 'Number', 'Date', 'Dropdown', 'Checkbox', 'Textarea']
const USED_IN_OPTIONS: UsedIn[] = ['ลูกค้าทุกคน', 'LINE เท่านั้น', 'Facebook เท่านั้น', 'เฉพาะบางช่องทาง...']

interface FieldFormState {
	name: string
	type: FieldType
	required: boolean
	usedIn: UsedIn
	dropdownOptions: string
}

const EMPTY_FORM: FieldFormState = {
	name: '',
	type: 'Text',
	required: false,
	usedIn: 'ลูกค้าทุกคน',
	dropdownOptions: '',
}

export function CustomFieldsSettings() {
	const [fields, setFields] = useState<CustomField[]>(INITIAL_FIELDS)
	const [modalOpen, setModalOpen] = useState(false)
	const [editingId, setEditingId] = useState<string | null>(null)
	const [form, setForm] = useState<FieldFormState>(EMPTY_FORM)
	const [nameError, setNameError] = useState('')

	function openAdd() {
		setEditingId(null)
		setForm(EMPTY_FORM)
		setNameError('')
		setModalOpen(true)
	}

	function openEdit(field: CustomField) {
		setEditingId(field.id)
		setForm({
			name: field.name,
			type: field.type,
			required: field.required,
			usedIn: field.usedIn,
			dropdownOptions: field.dropdownOptions ?? '',
		})
		setNameError('')
		setModalOpen(true)
	}

	function closeModal() {
		setModalOpen(false)
	}

	function handleSave() {
		if (!form.name.trim()) {
			setNameError('กรุณากรอกชื่อ Field')
			return
		}
		if (editingId !== null) {
			setFields((prev) =>
				prev.map((f) =>
					f.id === editingId
						? {
								...f,
								name: form.name.trim(),
								type: form.type,
								required: form.required,
								usedIn: form.usedIn,
								dropdownOptions: form.type === 'Dropdown' ? form.dropdownOptions : undefined,
							}
						: f,
				),
			)
		} else {
			const newField: CustomField = {
				id: String(Date.now()),
				name: form.name.trim(),
				type: form.type,
				required: form.required,
				usedIn: form.usedIn,
				dropdownOptions: form.type === 'Dropdown' ? form.dropdownOptions : undefined,
			}
			setFields((prev) => [...prev, newField])
		}
		closeModal()
	}

	function handleDelete(field: CustomField) {
		const confirmed = window.confirm(
			`ลบ field '${field.name}'? ข้อมูลที่บันทึกไว้แล้วจะยังคงอยู่แต่จะไม่แสดงใน form`,
		)
		if (confirmed) {
			setFields((prev) => prev.filter((f) => f.id !== field.id))
		}
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-lg font-semibold text-t1">Custom Fields</h2>
					<p className="mt-0.5 text-sm text-t2">จัดการ field เพิ่มเติมที่แสดงในโปรไฟล์ลูกค้า</p>
				</div>
				<button
					type="button"
					onClick={openAdd}
					className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
				>
					<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
						<path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
					</svg>
					เพิ่ม Field ใหม่
				</button>
			</div>

			{/* Table */}
			<div className="rounded-lg border border-border bg-bg-card overflow-hidden">
				<table className="w-full text-sm">
					<thead>
						<tr className="border-b border-border bg-bg-input">
							<th className="px-4 py-3 text-left font-medium text-t2">ชื่อ Field</th>
							<th className="px-4 py-3 text-left font-medium text-t2">ประเภทข้อมูล</th>
							<th className="px-4 py-3 text-left font-medium text-t2">Required</th>
							<th className="px-4 py-3 text-left font-medium text-t2">ใช้ใน</th>
							<th className="px-4 py-3 text-right font-medium text-t2">Actions</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-border">
						{fields.length === 0 && (
							<tr>
								<td colSpan={5} className="py-10 text-center text-t3">
									ยังไม่มี Custom Field กด "เพิ่ม Field ใหม่" เพื่อเริ่มต้น
								</td>
							</tr>
						)}
						{fields.map((field) => (
							<tr key={field.id} className="hover:bg-bg-hover transition-colors">
								<td className="px-4 py-3 font-medium text-t1">{field.name}</td>
								<td className="px-4 py-3">
									<span
										className={cn(
											'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
											TYPE_BADGE_CLASSES[field.type],
										)}
									>
										{field.type}
									</span>
								</td>
								<td className="px-4 py-3">
									{field.required ? (
										<span className="inline-flex items-center gap-1 text-primary font-medium">
											<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
												<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
											</svg>
											ใช่
										</span>
									) : (
										<span className="text-t3">ไม่</span>
									)}
								</td>
								<td className="px-4 py-3 text-t2">{field.usedIn}</td>
								<td className="px-4 py-3">
									<div className="flex items-center justify-end gap-2">
										<button
											type="button"
											onClick={() => openEdit(field)}
											className="rounded p-1.5 text-t2 hover:bg-bg-hover hover:text-t1 transition-colors"
											title="แก้ไข"
										>
											<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
												<path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
											</svg>
										</button>
										<button
											type="button"
											onClick={() => handleDelete(field)}
											className="rounded p-1.5 text-t2 hover:bg-red-50 hover:text-red-600 transition-colors"
											title="ลบ"
										>
											<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
												<path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
											</svg>
										</button>
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{/* Add / Edit Modal */}
			{modalOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center">
					{/* Backdrop */}
					<div
						className="absolute inset-0 bg-black/40"
						onClick={closeModal}
					/>

					{/* Dialog */}
					<div className="relative z-10 w-full max-w-md rounded-xl border border-border bg-bg-card p-6 shadow-xl">
						<h3 className="mb-5 text-base font-semibold text-t1">
							{editingId !== null ? 'แก้ไข Field' : 'เพิ่ม Field ใหม่'}
						</h3>

						<div className="space-y-4">
							{/* Field name */}
							<div>
								<label className="mb-1.5 block text-sm font-medium text-t1">
									ชื่อ Field <span className="text-red-500">*</span>
								</label>
								<input
									type="text"
									value={form.name}
									onChange={(e) => {
										setForm((prev) => ({ ...prev, name: e.target.value }))
										if (nameError) setNameError('')
									}}
									placeholder="เช่น วันเกิด, รหัสสมาชิก"
									className={cn(
										'w-full rounded-md border bg-bg-input px-3 py-2 text-sm text-t1 outline-none placeholder:text-t3 focus:ring-2 focus:ring-primary/30',
										nameError ? 'border-red-400' : 'border-border',
									)}
								/>
								{nameError && <p className="mt-1 text-xs text-red-500">{nameError}</p>}
							</div>

							{/* Type */}
							<div>
								<label className="mb-1.5 block text-sm font-medium text-t1">ประเภท</label>
								<select
									value={form.type}
									onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as FieldType }))}
									className="w-full rounded-md border border-border bg-bg-input px-3 py-2 text-sm text-t1 outline-none focus:ring-2 focus:ring-primary/30"
								>
									{FIELD_TYPES.map((t) => (
										<option key={t} value={t}>
											{t}
										</option>
									))}
								</select>
							</div>

							{/* Dropdown options — only shown when type is Dropdown */}
							{form.type === 'Dropdown' && (
								<div>
									<label className="mb-1.5 block text-sm font-medium text-t1">
										ตัวเลือก{' '}
										<span className="font-normal text-t3">(คั่นด้วยจุลภาค)</span>
									</label>
									<textarea
										value={form.dropdownOptions}
										onChange={(e) => setForm((prev) => ({ ...prev, dropdownOptions: e.target.value }))}
										rows={3}
										placeholder="เช่น โซเชียล, แนะนำ, โฆษณา"
										className="w-full resize-none rounded-md border border-border bg-bg-input px-3 py-2 text-sm text-t1 outline-none placeholder:text-t3 focus:ring-2 focus:ring-primary/30"
									/>
								</div>
							)}

							{/* Required toggle */}
							<div className="flex items-center justify-between">
								<span className="text-sm font-medium text-t1">Required</span>
								<button
									type="button"
									role="switch"
									aria-checked={form.required}
									onClick={() => setForm((prev) => ({ ...prev, required: !prev.required }))}
									className={cn(
										'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
										form.required ? 'bg-primary' : 'bg-gray-200',
									)}
								>
									<span
										className={cn(
											'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
											form.required ? 'translate-x-6' : 'translate-x-1',
										)}
									/>
								</button>
							</div>

							{/* Used in */}
							<div>
								<label className="mb-2 block text-sm font-medium text-t1">ใช้ใน</label>
								<div className="space-y-2">
									{USED_IN_OPTIONS.map((option) => (
										<label key={option} className="flex cursor-pointer items-center gap-2.5">
											<input
												type="radio"
												name="usedIn"
												value={option}
												checked={form.usedIn === option}
												onChange={() => setForm((prev) => ({ ...prev, usedIn: option }))}
												className="h-4 w-4 accent-primary"
											/>
											<span className="text-sm text-t1">{option}</span>
										</label>
									))}
								</div>
							</div>
						</div>

						{/* Footer buttons */}
						<div className="mt-6 flex justify-end gap-3">
							<button
								type="button"
								onClick={closeModal}
								className="rounded-md border border-border px-4 py-2 text-sm font-medium text-t2 hover:bg-bg-hover transition-colors"
							>
								ยกเลิก
							</button>
							<button
								type="button"
								onClick={handleSave}
								className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
							>
								บันทึก
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
