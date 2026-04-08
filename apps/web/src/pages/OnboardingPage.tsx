import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { cn } from '@one-bear/ui'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
	useOnboardingState,
	useConnectChannel,
	useAdvanceToStep2,
	useCompleteStep2,
	type OnboardingProduct,
} from '@/api/useOnboarding'
import { CheckCircle2, Link2, Bot, PartyPopper, Plus, X } from 'lucide-react'

const PLATFORMS = [
	{ id: 'Line', label: 'LINE', color: 'bg-[#06C755]/10 text-[#06C755]' },
	{ id: 'Facebook', label: 'Facebook', color: 'bg-[#1877F2]/10 text-[#1877F2]' },
	{ id: 'Instagram', label: 'Instagram', color: 'bg-pink-500/10 text-pink-500' },
	{ id: 'WhatsApp', label: 'WhatsApp', color: 'bg-emerald-500/10 text-emerald-500' },
	{ id: 'Lazada', label: 'Lazada', color: 'bg-orange-500/10 text-orange-500' },
]

function StepIndicator({ current }: { current: number }) {
	const steps = [
		{ num: 1, label: 'เชื่อมต่อช่องทาง' },
		{ num: 2, label: 'AI พร้อม' },
		{ num: 3, label: 'เรียบร้อย!' },
	]
	return (
		<div className="flex items-center justify-center gap-2 mb-8">
			{steps.map((s, i) => (
				<div key={s.num} className="flex items-center gap-2">
					<div className={cn(
						'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors',
						current >= s.num ? 'bg-primary text-white' : 'bg-bg-input text-t3',
					)}>
						{current > s.num ? <CheckCircle2 className="h-4 w-4" /> : s.num}
					</div>
					<span className={cn('text-xs hidden sm:inline', current >= s.num ? 'text-t1 font-medium' : 'text-t3')}>{s.label}</span>
					{i < steps.length - 1 && <div className={cn('h-px w-8', current > s.num ? 'bg-primary' : 'bg-border')} />}
				</div>
			))}
		</div>
	)
}

function Step1({ connectedPlatforms, onConnect, onNext, isConnecting }: {
	connectedPlatforms: string[]
	onConnect: (platform: string) => void
	onNext: () => void
	isConnecting: boolean
}) {
	return (
		<div className="text-center">
			<Link2 className="mx-auto mb-3 h-10 w-10 text-primary" />
			<h2 className="text-xl font-bold text-t1">เชื่อมต่อช่องทางของคุณ</h2>
			<p className="mt-1 text-sm text-t2">เลือกช่องทางที่คุณขายสินค้า</p>

			<div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
				{PLATFORMS.map((p) => {
					const connected = connectedPlatforms.includes(p.id)
					return (
						<button key={p.id} onClick={() => !connected && onConnect(p.id)} disabled={connected || isConnecting}
							className={cn(
								'flex flex-col items-center gap-2 rounded-xl border p-4 transition-all',
								connected ? 'border-primary bg-primary-alpha' : 'border-border bg-bg-card hover:bg-bg-hover',
							)}>
							<Badge className={p.color}>{p.label}</Badge>
							{connected && <CheckCircle2 className="h-4 w-4 text-primary" />}
						</button>
					)
				})}
			</div>

			<Button className="mt-6 w-full" onClick={onNext} disabled={connectedPlatforms.length === 0}>
				ถัดไป
			</Button>
		</div>
	)
}

function Step2({ sampleProduct, pendingProducts, onComplete, isCompleting }: {
	sampleProduct: boolean
	pendingProducts: OnboardingProduct[]
	onComplete: (products: OnboardingProduct[]) => void
	isCompleting: boolean
}) {
	const [products, setProducts] = useState<OnboardingProduct[]>(pendingProducts)
	const [showAdd, setShowAdd] = useState(false)
	const [newName, setNewName] = useState('')
	const [newPrice, setNewPrice] = useState('')

	function addProduct() {
		if (!newName.trim() || !newPrice) return
		setProducts([...products, { name: newName.trim(), category: 'General', price: parseFloat(newPrice), stock: null }])
		setNewName('')
		setNewPrice('')
		setShowAdd(false)
	}

	return (
		<div className="text-center">
			<Bot className="mx-auto mb-3 h-10 w-10 text-primary" />
			<h2 className="text-xl font-bold text-t1">AI ของคุณพร้อม</h2>
			<p className="mt-1 text-sm text-t2">AI จะตอบแชท 24/7 ให้คุณ</p>

			<div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full bg-success-bg px-3 py-1 text-sm text-success">
				<CheckCircle2 className="h-3.5 w-3.5" /> เปิดใช้งานอยู่
			</div>

			{products.length > 0 && (
				<div className="mt-6 space-y-2 text-left">
					<p className="text-sm font-medium text-t2">{sampleProduct ? 'สินค้าตัวอย่าง:' : 'สินค้าของคุณ:'}</p>
					{products.map((p, i) => (
						<div key={i} className="flex items-center justify-between rounded-lg border border-border bg-bg-card px-3 py-2">
							<span className="text-sm text-t1">{p.name}</span>
							<span className="text-sm font-medium text-t1">฿{p.price}</span>
						</div>
					))}
				</div>
			)}

			{!showAdd ? (
				<div className="mt-4 flex gap-2">
					<Button variant="outline" className="flex-1" onClick={() => setShowAdd(true)}>
						<Plus className="mr-1 h-3.5 w-3.5" /> เพิ่มสินค้า
					</Button>
				</div>
			) : (
				<div className="mt-4 space-y-2 rounded-lg border border-border bg-bg-card p-3 text-left">
					<input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="ชื่อสินค้า"
						className="w-full rounded-lg border border-border-input bg-bg-input px-3 py-2 text-sm text-t1 placeholder:text-t3" />
					<input type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} placeholder="ราคา (฿)"
						className="w-full rounded-lg border border-border-input bg-bg-input px-3 py-2 text-sm text-t1 placeholder:text-t3" />
					<div className="flex gap-2">
						<Button size="sm" onClick={addProduct} disabled={!newName.trim() || !newPrice}>เพิ่ม</Button>
						<Button size="sm" variant="outline" onClick={() => setShowAdd(false)}>ยกเลิก</Button>
					</div>
				</div>
			)}

			<p className="mt-3 text-xs text-t3">คุณแก้ไขหรือเพิ่มสินค้าได้ทีหลังใน Settings</p>

			<Button className="mt-6 w-full" onClick={() => onComplete(products)} disabled={isCompleting}>
				{isCompleting ? 'กำลังบันทึก...' : 'ถัดไป'}
			</Button>
		</div>
	)
}

function Step3() {
	const navigate = useNavigate()
	return (
		<div className="text-center">
			<PartyPopper className="mx-auto mb-3 h-12 w-12 text-primary" />
			<h2 className="text-2xl font-bold text-t1">เรียบร้อย!</h2>
			<p className="mt-2 text-sm text-t2">ร้านคุณพร้อมแล้ว</p>

			<Button className="mt-8 w-full" onClick={() => navigate({ to: '/dashboard' })}>
				เข้าไปใช้งาน
			</Button>
		</div>
	)
}

export function OnboardingPage() {
	const { data: state, isLoading } = useOnboardingState()
	const connectChannel = useConnectChannel()
	const advanceToStep2 = useAdvanceToStep2()
	const completeStep2 = useCompleteStep2()

	if (isLoading || !state) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
			</div>
		)
	}

	const step = state.isCompleted ? 3 : state.currentStep

	return (
		<div className="mx-auto max-w-md py-12 px-4">
			<StepIndicator current={step} />

			{step === 1 && (
				<Step1
					connectedPlatforms={state.connectedChannels.map((c) => c.platform)}
					onConnect={(platform) => connectChannel.mutate({ platform, channelName: platform })}
					onNext={() => advanceToStep2.mutate()}
					isConnecting={connectChannel.isPending}
				/>
			)}

			{step === 2 && (
				<Step2
					sampleProduct={state.sampleProductCreated}
					pendingProducts={state.pendingProducts}
					onComplete={(products) => completeStep2.mutate({ products })}
					isCompleting={completeStep2.isPending}
				/>
			)}

			{step === 3 && <Step3 />}
		</div>
	)
}
