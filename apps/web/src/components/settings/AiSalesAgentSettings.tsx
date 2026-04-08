import { useState } from 'react'
import { cn } from '@one-bear/ui'
import { Button } from '@/components/ui/Button'

type Channel = 'line' | 'facebook' | 'instagram' | 'whatsapp'

interface ChannelToggle {
	id: Channel
	label: string
}

const CHANNELS: ChannelToggle[] = [
	{ id: 'line',      label: 'LINE' },
	{ id: 'facebook',  label: 'Facebook' },
	{ id: 'instagram', label: 'Instagram' },
	{ id: 'whatsapp',  label: 'WhatsApp' },
]

type Role = 'admin' | 'manager' | 'agent'

interface RolePolicy {
	canRespond: boolean
	canCreateOrder: boolean
	canNegotiatePrice: boolean
	requireApproval: boolean
}

type OutOfHoursBehavior = 'always-reply' | 'notify-closed' | 'no-reply'

const ROLE_LABELS: Record<Role, string> = {
	admin: 'Admin',
	manager: 'Manager',
	agent: 'Agent / Staff',
}

const ROLE_BADGE_COLORS: Record<Role, string> = {
	admin: 'bg-purple-100 text-purple-700',
	manager: 'bg-blue-100 text-blue-700',
	agent: 'bg-green-100 text-green-700',
}

export function AiSalesAgentSettings() {
	const [masterEnabled, setMasterEnabled] = useState(false)

	const [channelEnabled, setChannelEnabled] = useState<Record<Channel, boolean>>({
		line: true,
		facebook: true,
		instagram: false,
		whatsapp: false,
	})

	const [rolePolicies, setRolePolicies] = useState<Record<Role, RolePolicy>>({
		admin: {
			canRespond: true,
			canCreateOrder: true,
			canNegotiatePrice: true,
			requireApproval: false,
		},
		manager: {
			canRespond: true,
			canCreateOrder: true,
			canNegotiatePrice: false,
			requireApproval: false,
		},
		agent: {
			canRespond: true,
			canCreateOrder: false,
			canNegotiatePrice: false,
			requireApproval: true,
		},
	})

	const [confidenceThreshold, setConfidenceThreshold] = useState(70)
	const [maxTurns, setMaxTurns] = useState(5)
	const [outOfHours, setOutOfHours] = useState<OutOfHoursBehavior>('notify-closed')

	const [allowDiscount, setAllowDiscount] = useState(false)
	const [maxDiscountPct, setMaxDiscountPct] = useState(10)
	const [approvalThresholdPct, setApprovalThresholdPct] = useState(5)

	const [saved, setSaved] = useState(false)

	function toggleChannel(id: Channel) {
		setChannelEnabled((prev) => ({ ...prev, [id]: !prev[id] }))
	}

	function toggleRolePolicy(role: Role, field: keyof RolePolicy) {
		setRolePolicies((prev) => ({
			...prev,
			[role]: { ...prev[role], [field]: !prev[role][field] },
		}))
	}

	function handleSave() {
		setSaved(true)
		setTimeout(() => setSaved(false), 2000)
	}

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-lg font-semibold text-t1">AI Sales Agent</h2>
				<p className="mt-0.5 text-sm text-t2">ตั้งค่า AI สำหรับตอบแชทและขายสินค้าอัตโนมัติ</p>
			</div>

			{/* Section 1: Enable/Disable */}
			<div className="rounded-xl border border-border bg-bg-card p-6 shadow-sm space-y-5">
				<h3 className="text-sm font-semibold text-t1">การเปิดใช้งาน AI Sales Agent</h3>

				{/* Master toggle */}
				<div className="flex items-center justify-between">
					<div>
						<p className="text-sm font-medium text-t1">AI Sales Agent</p>
						<p className="text-xs text-t3 mt-0.5">ให้ AI ตอบแชทและขายสินค้าอัตโนมัติ</p>
					</div>
					<button
						type="button"
						role="switch"
						aria-checked={masterEnabled}
						onClick={() => setMasterEnabled((v) => !v)}
						className={cn(
							'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none',
							masterEnabled ? 'bg-primary' : 'bg-border',
						)}
					>
						<span
							className={cn(
								'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
								masterEnabled ? 'translate-x-5' : 'translate-x-0',
							)}
						/>
					</button>
				</div>

				<div className="border-t border-border" />

				{/* Per-channel toggles */}
				<div className="space-y-3">
					<p className="text-xs font-semibold uppercase tracking-wider text-t3">ช่องทาง</p>
					{CHANNELS.map((ch) => (
						<div key={ch.id} className="flex items-center justify-between">
							<span className={cn('text-sm', masterEnabled ? 'text-t1' : 'text-t3')}>{ch.label}</span>
							<button
								type="button"
								role="switch"
								aria-checked={channelEnabled[ch.id]}
								disabled={!masterEnabled}
								onClick={() => toggleChannel(ch.id)}
								className={cn(
									'relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none',
									!masterEnabled && 'cursor-not-allowed opacity-40',
									masterEnabled && channelEnabled[ch.id] ? 'bg-primary' : 'bg-border',
								)}
							>
								<span
									className={cn(
										'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
										channelEnabled[ch.id] ? 'translate-x-4' : 'translate-x-0',
									)}
								/>
							</button>
						</div>
					))}
				</div>
			</div>

			{/* Section 2: Role Policy */}
			<div className="rounded-xl border border-border bg-bg-card p-6 shadow-sm space-y-4">
				<h3 className="text-sm font-semibold text-t1">นโยบายสิทธิ์ (Role Policy)</h3>
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr>
								<th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-t3 min-w-[120px]">
									Role
								</th>
								<th className="pb-3 text-center text-xs font-semibold uppercase tracking-wider text-t3 min-w-[100px]">
									AI ตอบแทน
								</th>
								<th className="pb-3 text-center text-xs font-semibold uppercase tracking-wider text-t3 min-w-[110px]">
									AI สร้างออเดอร์
								</th>
								<th className="pb-3 text-center text-xs font-semibold uppercase tracking-wider text-t3 min-w-[110px]">
									AI เจรจาราคา
								</th>
								<th className="pb-3 text-center text-xs font-semibold uppercase tracking-wider text-t3 min-w-[120px]">
									ต้องอนุมัติก่อน
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border">
							{(Object.keys(rolePolicies) as Role[]).map((role) => (
								<tr key={role}>
									<td className="py-3 pr-4">
										<span
											className={cn(
												'inline-block rounded-full px-2.5 py-0.5 text-xs font-medium',
												ROLE_BADGE_COLORS[role],
											)}
										>
											{ROLE_LABELS[role]}
										</span>
									</td>
									{(['canRespond', 'canCreateOrder', 'canNegotiatePrice', 'requireApproval'] as const).map(
										(field) => (
											<td key={field} className="py-3 text-center">
												<input
													type="checkbox"
													checked={rolePolicies[role][field]}
													onChange={() => toggleRolePolicy(role, field)}
													className="h-4 w-4 cursor-pointer rounded border-border text-primary accent-primary"
												/>
											</td>
										),
									)}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			{/* Section 3: Handoff Policy */}
			<div className="rounded-xl border border-border bg-bg-card p-6 shadow-sm space-y-5">
				<h3 className="text-sm font-semibold text-t1">Handoff Policy</h3>

				{/* Confidence threshold */}
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<label className="text-sm font-medium text-t2">Confidence Threshold</label>
						<span className="text-sm font-semibold text-primary">{confidenceThreshold}%</span>
					</div>
					<input
						type="range"
						min={0}
						max={100}
						value={confidenceThreshold}
						onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
						className="w-full accent-primary"
					/>
					<p className="text-xs text-t3">AI จะส่งต่อให้คนเมื่อความมั่นใจต่ำกว่านี้</p>
				</div>

				{/* Max turns */}
				<div className="space-y-1.5">
					<label className="block text-sm font-medium text-t2">Max Turns Before Handoff</label>
					<input
						type="number"
						min={1}
						max={50}
						value={maxTurns}
						onChange={(e) => setMaxTurns(Number(e.target.value))}
						className="w-28 rounded-lg border border-border bg-bg-input px-3 py-2 text-sm text-t1 focus:border-primary focus:outline-none"
					/>
					<p className="text-xs text-t3">จำนวนรอบสนทนาสูงสุดก่อน AI ส่งต่อ</p>
				</div>

				{/* Out-of-hours behavior */}
				<div className="space-y-2">
					<label className="block text-sm font-medium text-t2">พฤติกรรมนอกเวลาทำการ</label>
					<div className="space-y-2">
						{(
							[
								{ value: 'always-reply',   label: 'AI ตอบเสมอ' },
								{ value: 'notify-closed',  label: 'แจ้งว่าปิดทำการ' },
								{ value: 'no-reply',       label: 'ไม่ตอบเลย' },
							] as { value: OutOfHoursBehavior; label: string }[]
						).map((opt) => (
							<label key={opt.value} className="flex cursor-pointer items-center gap-2.5">
								<input
									type="radio"
									name="out-of-hours"
									value={opt.value}
									checked={outOfHours === opt.value}
									onChange={() => setOutOfHours(opt.value)}
									className="h-4 w-4 accent-primary"
								/>
								<span className="text-sm text-t1">{opt.label}</span>
							</label>
						))}
					</div>
				</div>
			</div>

			{/* Section 4: Price Permissions */}
			<div className="rounded-xl border border-border bg-bg-card p-6 shadow-sm space-y-5">
				<h3 className="text-sm font-semibold text-t1">การอนุญาตด้านราคา</h3>

				{/* Allow discount toggle */}
				<div className="flex items-center justify-between">
					<div>
						<p className="text-sm font-medium text-t1">อนุญาตให้ AI เสนอส่วนลด</p>
					</div>
					<button
						type="button"
						role="switch"
						aria-checked={allowDiscount}
						onClick={() => setAllowDiscount((v) => !v)}
						className={cn(
							'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none',
							allowDiscount ? 'bg-primary' : 'bg-border',
						)}
					>
						<span
							className={cn(
								'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
								allowDiscount ? 'translate-x-5' : 'translate-x-0',
							)}
						/>
					</button>
				</div>

				{/* Max discount % */}
				<div className="space-y-1.5">
					<label
						className={cn('block text-sm font-medium', allowDiscount ? 'text-t2' : 'text-t3')}
					>
						ส่วนลดสูงสุด (%)
					</label>
					<input
						type="number"
						min={1}
						max={30}
						disabled={!allowDiscount}
						value={maxDiscountPct}
						onChange={(e) => setMaxDiscountPct(Number(e.target.value))}
						className={cn(
							'w-28 rounded-lg border border-border bg-bg-input px-3 py-2 text-sm text-t1 focus:border-primary focus:outline-none',
							!allowDiscount && 'cursor-not-allowed opacity-40',
						)}
					/>
				</div>

				{/* Approval threshold */}
				<div className="space-y-1.5">
					<label
						className={cn('block text-sm font-medium', allowDiscount ? 'text-t2' : 'text-t3')}
					>
						ต้องขออนุมัติ Manager เมื่อส่วนลดเกิน (%)
					</label>
					<input
						type="number"
						min={1}
						max={30}
						disabled={!allowDiscount}
						value={approvalThresholdPct}
						onChange={(e) => setApprovalThresholdPct(Number(e.target.value))}
						className={cn(
							'w-28 rounded-lg border border-border bg-bg-input px-3 py-2 text-sm text-t1 focus:border-primary focus:outline-none',
							!allowDiscount && 'cursor-not-allowed opacity-40',
						)}
					/>
				</div>
			</div>

			{/* Save */}
			<div className="flex justify-end">
				<Button onClick={handleSave}>
					{saved ? '✓ บันทึกแล้ว' : 'บันทึก'}
				</Button>
			</div>
		</div>
	)
}
