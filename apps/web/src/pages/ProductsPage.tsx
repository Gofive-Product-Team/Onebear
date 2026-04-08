import { useState, useMemo } from 'react'
import { cn } from '@one-bear/ui'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
	useProducts,
	useProductCategories,
	useCreateProduct,
	useUpdateProduct,
	useDeleteProduct,
	useImportProducts,
	type Product,
	type ProductVariant,
	type ProductRelationship,
	type CreateProductBody,
	type CsvImportResult,
} from '@/api/useProducts'
import {
	Package,
	Plus,
	Search,
	Upload,
	Pencil,
	Trash2,
	X,
	Eye,
	EyeOff,
	Download,
	ChevronRight,
	Sparkles,
	Check,
} from 'lucide-react'

// ─── Toast helper ─────────────────────────────────────────────────────────────

let _toastTimer: ReturnType<typeof setTimeout> | null = null

function useToast() {
	const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
	function show(msg: string, type: 'success' | 'error' = 'success') {
		setToast({ msg, type })
		if (_toastTimer) clearTimeout(_toastTimer)
		_toastTimer = setTimeout(() => setToast(null), 3000)
	}
	return { toast, show }
}

// ─── Variant axis types ────────────────────────────────────────────────────────

interface VariantAxis {
	name: string
	values: string[]
}

interface VariantCombination {
	label: string
	price: number
	stock: number
	enabled: boolean
}

function generateCombinations(axes: VariantAxis[]): VariantCombination[] {
	if (axes.length === 0) return []
	const validAxes = axes.filter((a) => a.values.length > 0)
	if (validAxes.length === 0) return []

	let combos: string[][] = [[]]
	for (const axis of validAxes) {
		const next: string[][] = []
		for (const combo of combos) {
			for (const val of axis.values) {
				next.push([...combo, val])
			}
		}
		combos = next
	}
	return combos.map((parts) => ({
		label: parts.join(' / '),
		price: 0,
		stock: 0,
		enabled: true,
	}))
}

// ─── AI suggestion mock data ───────────────────────────────────────────────────

interface AiSuggestion {
	productId: string
	productName: string
	originalPrice: number
	suggestedPrice: number
	confidence: number
	approved: boolean | null
}

function mockAiSuggestions(allProducts: Product[], currentId: string): AiSuggestion[] {
	const discounts = [0.88, 0.95, 1.0, 0.92]
	return allProducts
		.filter((p) => p.id !== currentId)
		.slice(0, 4)
		.map((p, i) => ({
			productId: p.id,
			productName: p.name,
			originalPrice: p.price,
			suggestedPrice: Math.round(p.price * discounts[i % discounts.length]),
			confidence: Math.round(90 - i * 9),
			approved: null,
		}))
}

function confidenceColor(pct: number) {
	if (pct >= 80) return 'bg-success/15 text-success'
	if (pct >= 60) return 'bg-warning/15 text-warning'
	return 'bg-error/15 text-error'
}

// ─── SVG placeholder image ─────────────────────────────────────────────────────

function svgPlaceholder(letter: string, bg: string) {
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="${bg}" rx="8"/><text x="50" y="62" font-family="system-ui" font-size="38" fill="rgba(255,255,255,0.85)" text-anchor="middle">${letter}</text></svg>`
	return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

// ─── Mock products (shown when API is unavailable) ────────────────────────────

const MOCK_PRODUCTS: Product[] = [
	{
		id: 'mock-1', name: 'ครีมบำรุงผิวหน้า SPF50', category: 'Beauty', price: 890,
		stock: 45, effectiveStock: 45, status: 'Active', allowPreOrder: false,
		description: 'ครีมกันแดด SPF50 PA+++ สูตรบำรุงผิวหน้า เหมาะสำหรับผิวทุกประเภท',
		imageUrl: svgPlaceholder('C', '#0d9488'), images: [],
		variants: [
			{ id: 'v1', type: 'ขนาด', value: '30ml', stock: 20, priceAdjustment: 0 },
			{ id: 'v2', type: 'ขนาด', value: '50ml', stock: 25, priceAdjustment: 200 },
		],
		upsells: [{ productId: 'mock-2', productName: 'เซรั่มวิตามินซี', customPrice: null, sortOrder: 0 }],
		crossSells: [{ productId: 'mock-3', productName: 'มาส์กหน้าลดสิว', customPrice: null, sortOrder: 0 }],
		upsellMaxPrice: 2000, isSample: false, createdTimestamp: Date.now() - 86400000 * 30, updatedTimestamp: null,
	},
	{
		id: 'mock-2', name: 'เซรั่มวิตามินซี', category: 'Beauty', price: 1290,
		stock: 28, effectiveStock: 28, status: 'Active', allowPreOrder: false,
		description: 'เซรั่มวิตามินซี 20% ช่วยให้ผิวกระจ่างใสภายใน 4 สัปดาห์',
		imageUrl: svgPlaceholder('S', '#7c3aed'), images: [],
		variants: [],
		upsells: [{ productId: 'mock-4', productName: 'ครีมบำรุงผิวกาย Luxe', customPrice: 1490, sortOrder: 0 }],
		crossSells: [
			{ productId: 'mock-1', productName: 'ครีมบำรุงผิวหน้า SPF50', customPrice: null, sortOrder: 0 },
			{ productId: 'mock-3', productName: 'มาส์กหน้าลดสิว', customPrice: 320, sortOrder: 1 },
		],
		upsellMaxPrice: 2500, isSample: false, createdTimestamp: Date.now() - 86400000 * 25, updatedTimestamp: null,
	},
	{
		id: 'mock-3', name: 'มาส์กหน้าลดสิว', category: 'Beauty', price: 390,
		stock: 0, effectiveStock: 0, status: 'Active', allowPreOrder: false,
		description: 'มาส์กหน้าสูตรควบคุมความมัน ลดสิวอุดตัน',
		imageUrl: svgPlaceholder('M', '#dc2626'), images: [],
		variants: [
			{ id: 'v3', type: 'สูตร', value: 'ลดสิว', stock: 0, priceAdjustment: 0 },
			{ id: 'v4', type: 'สูตร', value: 'เติมความชุ่มชื้น', stock: 0, priceAdjustment: 50 },
		],
		upsells: [], crossSells: [],
		upsellMaxPrice: null, isSample: false, createdTimestamp: Date.now() - 86400000 * 20, updatedTimestamp: null,
	},
	{
		id: 'mock-4', name: 'ครีมบำรุงผิวกาย Luxe', category: 'Beauty', price: 1890,
		stock: 12, effectiveStock: 12, status: 'Active', allowPreOrder: false,
		description: 'ครีมบำรุงผิวกายสูตร Luxe ผสมน้ำมันอาร์กาน',
		imageUrl: svgPlaceholder('L', '#d97706'), images: [],
		variants: [],
		upsells: [], crossSells: [{ productId: 'mock-1', productName: 'ครีมบำรุงผิวหน้า SPF50', customPrice: null, sortOrder: 0 }],
		upsellMaxPrice: 3500, isSample: false, createdTimestamp: Date.now() - 86400000 * 15, updatedTimestamp: null,
	},
	{
		id: 'mock-5', name: 'โลชั่นกันแดด Body SPF30', category: 'Beauty', price: 590,
		stock: null, effectiveStock: null, status: 'Active', allowPreOrder: false,
		description: 'โลชั่นกันแดดสำหรับผิวกาย กันน้ำ 80 นาที',
		imageUrl: svgPlaceholder('B', '#2563eb'), images: [],
		variants: [], upsells: [], crossSells: [],
		upsellMaxPrice: null, isSample: false, createdTimestamp: Date.now() - 86400000 * 10, updatedTimestamp: null,
	},
	{
		id: 'mock-6', name: 'คลีนซิ่งโฟม Gentle', category: 'Skincare', price: 320,
		stock: 5, effectiveStock: 5, status: 'Inactive', allowPreOrder: false,
		description: 'โฟมล้างหน้าสูตรอ่อนโยน ไม่แห้งตึง',
		imageUrl: null, images: [],
		variants: [], upsells: [], crossSells: [],
		upsellMaxPrice: null, isSample: false, createdTimestamp: Date.now() - 86400000 * 5, updatedTimestamp: null,
	},
]

// ─── Product Detail Panel ──────────────────────────────────────────────────────

function ProductDetailPanel({
	product,
	allProducts,
	onClose,
	onSave,
	isSaving,
}: {
	product: Product
	allProducts: Product[]
	onClose: () => void
	onSave: (data: Partial<CreateProductBody>) => void
	isSaving: boolean
}) {
	const [activeTab, setActiveTab] = useState<'variants' | 'upsell'>('variants')
	const { toast, show: showToast } = useToast()

	// ── Variants state ──────────────────────────────────────────────────────────
	const [axes, setAxes] = useState<VariantAxis[]>(() => {
		// Reconstruct axes from existing variants
		const typeMap = new Map<string, string[]>()
		for (const v of product.variants) {
			const existing = typeMap.get(v.type) ?? []
			if (!existing.includes(v.value)) existing.push(v.value)
			typeMap.set(v.type, existing)
		}
		return Array.from(typeMap.entries()).map(([name, values]) => ({ name, values }))
	})
	const [showAddAxis, setShowAddAxis] = useState(false)
	const [newAxisName, setNewAxisName] = useState('')
	const [newAxisValues, setNewAxisValues] = useState('')
	const [combinations, setCombinations] = useState<VariantCombination[]>([])
	const [generatedCombos, setGeneratedCombos] = useState(false)

	function handleAddAxis() {
		if (!newAxisName.trim()) return
		if (axes.length >= 2) { showToast('สามารถมี variant ได้สูงสุด 2 แกน', 'error'); return }
		const values = newAxisValues.split(',').map((v) => v.trim()).filter(Boolean)
		setAxes((prev) => [...prev, { name: newAxisName.trim(), values }])
		setNewAxisName('')
		setNewAxisValues('')
		setShowAddAxis(false)
		setGeneratedCombos(false)
	}

	function handleGenerateCombinations() {
		setCombinations(generateCombinations(axes))
		setGeneratedCombos(true)
	}

	function updateCombo(idx: number, field: keyof VariantCombination, value: unknown) {
		setCombinations((prev) => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c))
	}

	function handleSaveVariants() {
		const variants: Omit<ProductVariant, 'id'>[] = generatedCombos
			? combinations.filter((c) => c.enabled).map((c) => ({
					type: axes[0]?.name ?? 'Variant',
					value: c.label,
					stock: c.stock,
					priceAdjustment: c.price,
				}))
			: axes.flatMap((ax) => ax.values.map((val) => ({
					type: ax.name,
					value: val,
					stock: 0,
					priceAdjustment: 0,
				})))
		console.log('Saving variants:', variants)
		onSave({ variants })
		showToast('บันทึก variants สำเร็จ')
	}

	// ── Upsell / Cross-sell state ───────────────────────────────────────────────
	const [upsells, setUpsells] = useState<ProductRelationship[]>(product.upsells)
	const [crossSells, setCrossSells] = useState<ProductRelationship[]>(product.crossSells)
	const [upsellSearch, setUpsellSearch] = useState('')
	const [crossSellSearch, setCrossSellSearch] = useState('')
	const [upsellOverrides, setUpsellOverrides] = useState<Record<string, number>>({})
	const [crossSellOverrides, setCrossSellOverrides] = useState<Record<string, number>>({})
	const [upsellAiSuggestions, setUpsellAiSuggestions] = useState<AiSuggestion[] | null>(null)
	const [crossSellAiSuggestions, setCrossSellAiSuggestions] = useState<AiSuggestion[] | null>(null)

	function addToList(
		list: ProductRelationship[],
		setList: (v: ProductRelationship[]) => void,
		p: Product,
		maxLen: number,
	) {
		if (list.length >= maxLen) { showToast(`สูงสุด ${maxLen} รายการ`, 'error'); return }
		if (list.some((r) => r.productId === p.id)) return
		setList([...list, { productId: p.id, productName: p.name, customPrice: null, sortOrder: list.length }])
	}

	function removeFromList(list: ProductRelationship[], setList: (v: ProductRelationship[]) => void, id: string) {
		setList(list.filter((r) => r.productId !== id))
	}

	function handleSaveRelationships() {
		const upsellsToSave = upsells.map((r) => ({
			productId: r.productId,
			customPrice: upsellOverrides[r.productId] ?? r.customPrice,
			sortOrder: r.sortOrder,
		}))
		const crossSellsToSave = crossSells.map((r) => ({
			productId: r.productId,
			customPrice: crossSellOverrides[r.productId] ?? r.customPrice,
			sortOrder: r.sortOrder,
		}))
		console.log('Saving relationships:', { upsells: upsellsToSave, crossSells: crossSellsToSave })
		onSave({ upsells: upsellsToSave, crossSells: crossSellsToSave })
		showToast('บันทึกความสัมพันธ์สินค้าสำเร็จ')
	}

	const filteredForUpsell = allProducts.filter(
		(p) => p.id !== product.id && p.name.toLowerCase().includes(upsellSearch.toLowerCase()),
	)
	const filteredForCrossSell = allProducts.filter(
		(p) => p.id !== product.id && p.name.toLowerCase().includes(crossSellSearch.toLowerCase()),
	)

	return (
		<div
			className="fixed inset-y-0 right-0 z-40 flex w-[420px] flex-col border-l border-border bg-bg-card shadow-xl transition-transform duration-300"
			style={{ transform: 'translateX(0)' }}
		>
			{/* Toast */}
			{toast && (
				<div
					className={cn(
						'absolute left-1/2 top-4 z-50 -translate-x-1/2 rounded-full px-4 py-1.5 text-sm text-white shadow-lg',
						toast.type === 'success' ? 'bg-gray-800' : 'bg-error',
					)}
				>
					{toast.msg}
				</div>
			)}

			{/* Header */}
			<div className="flex items-start gap-3 border-b border-border px-4 py-3.5">
				{/* Product thumbnail */}
				<div className="relative shrink-0">
					{product.imageUrl ? (
						<img src={product.imageUrl} alt={product.name} className="h-14 w-14 rounded-xl object-cover border border-border" />
					) : (
						<div className="flex h-14 w-14 items-center justify-center rounded-xl bg-bg-input border border-dashed border-warning/50">
							<Package className="h-6 w-6 text-t3" />
						</div>
					)}
					{!product.imageUrl && (
						<span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-warning text-[9px] font-bold text-white">!</span>
					)}
				</div>
				{/* Name + meta */}
				<div className="min-w-0 flex-1">
					<h2 className="truncate text-sm font-semibold text-t1">{product.name}</h2>
					<p className="mt-0.5 text-xs text-t3">{product.category}</p>
					<div className="mt-1 flex items-center gap-2">
						<span className="text-sm font-bold text-primary">฿{product.price.toLocaleString()}</span>
						{product.effectiveStock === null ? (
							<span className="text-[10px] text-t3">Unlimited stock</span>
						) : product.effectiveStock <= 0 ? (
							<span className="text-[10px] font-medium text-error">Out of stock</span>
						) : (
							<span className="text-[10px] text-t3">{product.effectiveStock} in stock</span>
						)}
					</div>
				</div>
				<button onClick={onClose} className="shrink-0 rounded-lg p-1.5 text-t3 hover:bg-bg-hover hover:text-t1">
					<X className="h-4 w-4" />
				</button>
			</div>
			{/* Missing image warning */}
			{!product.imageUrl && (
				<div className="flex items-center gap-2 bg-warning/8 px-4 py-2 text-xs text-warning">
					<span>⚠️</span>
					<span>สินค้านี้ไม่มีรูปภาพ — AI จะแนะนำสินค้าที่มีรูปได้ดีกว่า</span>
				</div>
			)}

			{/* Tabs */}
			<div className="flex border-b border-border">
				{(['variants', 'upsell'] as const).map((tab) => (
					<button
						key={tab}
						onClick={() => setActiveTab(tab)}
						className={cn(
							'flex-1 py-3 text-sm font-medium transition-colors',
							activeTab === tab
								? 'border-b-2 border-primary text-primary'
								: 'text-t3 hover:text-t2',
						)}
					>
						{tab === 'variants' ? 'Variants' : 'Upsell / Cross-sell'}
					</button>
				))}
			</div>

			{/* Tab content */}
			<div className="flex-1 overflow-y-auto p-5">
				{/* ── Variants tab ────────────────────────────────────────────────── */}
				{activeTab === 'variants' && (
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<h3 className="text-sm font-medium text-t1">Variant Axes</h3>
							{axes.length < 2 && (
								<button
									onClick={() => setShowAddAxis(true)}
									className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-primary hover:bg-bg-hover"
								>
									<Plus className="h-3.5 w-3.5" />
									Add variant type
								</button>
							)}
						</div>

						{/* Existing axes */}
						{axes.map((ax, i) => (
							<div key={i} className="rounded-lg border border-border bg-bg-input p-3">
								<div className="flex items-center justify-between">
									<span className="text-sm font-medium text-t1">{ax.name}</span>
									<button
										onClick={() => { setAxes((prev) => prev.filter((_, j) => j !== i)); setGeneratedCombos(false) }}
										className="text-t3 hover:text-error"
									>
										<X className="h-3.5 w-3.5" />
									</button>
								</div>
								<div className="mt-2 flex flex-wrap gap-1.5">
									{ax.values.map((val) => (
										<span key={val} className="rounded-full bg-bg-card px-2.5 py-0.5 text-xs text-t2 border border-border">
											{val}
										</span>
									))}
								</div>
							</div>
						))}

						{/* Add axis inline form */}
						{showAddAxis && (
							<div className="rounded-lg border border-primary/40 bg-bg-input p-3 space-y-2">
								<input
									value={newAxisName}
									onChange={(e) => setNewAxisName(e.target.value)}
									placeholder="Axis name (e.g. Size, Color)"
									className="w-full rounded-md border border-border-input bg-bg-card px-3 py-1.5 text-sm text-t1 placeholder:text-t3 focus:border-primary focus:outline-none"
								/>
								<input
									value={newAxisValues}
									onChange={(e) => setNewAxisValues(e.target.value)}
									placeholder="Values, comma-separated (e.g. S, M, L)"
									className="w-full rounded-md border border-border-input bg-bg-card px-3 py-1.5 text-sm text-t1 placeholder:text-t3 focus:border-primary focus:outline-none"
								/>
								<div className="flex gap-2 justify-end">
									<button onClick={() => setShowAddAxis(false)} className="text-xs text-t3 hover:text-t1 px-2 py-1">Cancel</button>
									<Button onClick={handleAddAxis} className="h-7 px-3 text-xs">Add</Button>
								</div>
							</div>
						)}

						{/* Generate combinations */}
						{axes.length > 0 && (
							<Button
								variant="outline"
								onClick={handleGenerateCombinations}
								className="w-full"
							>
								<ChevronRight className="mr-1.5 h-3.5 w-3.5" />
								Generate all combinations
							</Button>
						)}

						{/* Combination table */}
						{generatedCombos && combinations.length > 0 && (
							<div className="rounded-lg border border-border overflow-hidden">
								<table className="w-full text-sm">
									<thead className="bg-bg-input text-xs text-t3">
										<tr>
											<th className="px-3 py-2 text-left">Variant</th>
											<th className="px-3 py-2 text-right">Price adj. (฿)</th>
											<th className="px-3 py-2 text-right">Stock</th>
											<th className="px-2 py-2 text-center">Active</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-border">
										{combinations.map((combo, idx) => (
											<tr key={idx} className={cn('transition-colors', !combo.enabled && 'opacity-40')}>
												<td className="px-3 py-2 text-t1 text-xs font-medium">{combo.label}</td>
												<td className="px-3 py-2 text-right">
													<input
														type="number"
														value={combo.price}
														onChange={(e) => updateCombo(idx, 'price', parseFloat(e.target.value) || 0)}
														className="w-20 rounded border border-border-input bg-bg-input px-2 py-0.5 text-right text-xs focus:outline-none"
													/>
												</td>
												<td className="px-3 py-2 text-right">
													<input
														type="number"
														value={combo.stock}
														onChange={(e) => updateCombo(idx, 'stock', parseInt(e.target.value, 10) || 0)}
														className="w-16 rounded border border-border-input bg-bg-input px-2 py-0.5 text-right text-xs focus:outline-none"
													/>
												</td>
												<td className="px-2 py-2 text-center">
													<input
														type="checkbox"
														checked={combo.enabled}
														onChange={(e) => updateCombo(idx, 'enabled', e.target.checked)}
														className="rounded"
													/>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}

						{/* Save variants */}
						{axes.length > 0 && (
							<Button onClick={handleSaveVariants} disabled={isSaving} className="w-full">
								{isSaving ? 'Saving...' : 'Save Variants'}
							</Button>
						)}
					</div>
				)}

				{/* ── Upsell / Cross-sell tab ──────────────────────────────────────── */}
				{activeTab === 'upsell' && (
					<div className="space-y-5">
						{/* Upsell max price cap */}
						<div className="rounded-lg border border-border bg-bg-input px-3 py-2.5 flex items-center gap-3">
							<div className="flex-1">
								<p className="text-xs font-medium text-t2">ราคาสูงสุดที่ AI จะแนะนำ Upsell</p>
								<p className="text-[10px] text-t3 mt-0.5">AI จะไม่แนะนำสินค้า upsell ที่ราคาเกินกว่านี้</p>
							</div>
							<div className="flex items-center gap-1 shrink-0">
								<span className="text-xs text-t3">฿</span>
								<input
									type="number"
									defaultValue={product.upsellMaxPrice ?? ''}
									placeholder="ไม่จำกัด"
									className="w-24 rounded border border-border-input bg-bg-card px-2 py-1 text-right text-xs text-t1 focus:outline-none focus:border-primary"
								/>
							</div>
						</div>

						{/* Upsell section */}
						<div>
							<div className="mb-2 flex items-center justify-between">
								<div>
									<h3 className="text-sm font-medium text-t1">Upsell</h3>
									<p className="text-xs text-t3">ลูกค้าอาจสนใจ upgrade (สูงสุด 3)</p>
								</div>
								<button
									onClick={() => setUpsellAiSuggestions(mockAiSuggestions(allProducts, product.id))}
									className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-primary hover:bg-bg-hover"
								>
									<Sparkles className="h-3.5 w-3.5" /> AI แนะนำ
								</button>
							</div>

							{/* Upsell AI suggestions */}
							{upsellAiSuggestions && (
								<div className="mb-3 rounded-xl border border-primary/30 bg-bg-input p-3 space-y-2">
									<p className="text-xs font-semibold text-t2 mb-1">🤖 AI แนะนำ Upsell</p>
									{upsellAiSuggestions.map((s) => (
										<div key={s.productId} className="rounded-lg border border-border bg-bg-card p-2.5">
											<div className="flex items-start justify-between gap-2">
												<div className="min-w-0">
													<p className="truncate text-xs font-medium text-t1">{s.productName}</p>
													<div className="mt-0.5 flex items-center gap-1.5 text-[10px]">
														{s.suggestedPrice < s.originalPrice ? (
															<>
																<span className="line-through text-t3">฿{s.originalPrice.toLocaleString()}</span>
																<span className="font-bold text-success">฿{s.suggestedPrice.toLocaleString()}</span>
																<span className="text-t3">AI แนะนำลด {Math.round((1 - s.suggestedPrice / s.originalPrice) * 100)}%</span>
															</>
														) : (
															<span className="text-t2">฿{s.originalPrice.toLocaleString()}</span>
														)}
													</div>
												</div>
												<span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold', confidenceColor(s.confidence))}>
													{s.confidence}%
												</span>
											</div>
											{s.approved === null ? (
												<div className="mt-2 flex gap-1.5">
													<button
														onClick={() => {
															const p = allProducts.find((x) => x.id === s.productId)
															if (p) addToList(upsells, setUpsells, p, 3)
															setUpsellAiSuggestions((prev) => prev?.map((x) => x.productId === s.productId ? { ...x, approved: true } : x) ?? null)
														}}
														className="flex-1 rounded-lg bg-primary/15 py-1 text-[11px] font-medium text-primary hover:bg-primary/25"
													>✓ Approve</button>
													<button
														onClick={() => setUpsellAiSuggestions((prev) => prev?.map((x) => x.productId === s.productId ? { ...x, approved: false } : x) ?? null)}
														className="flex-1 rounded-lg bg-bg-hover py-1 text-[11px] font-medium text-t3 hover:text-t1"
													>✕ Reject</button>
												</div>
											) : s.approved ? (
												<p className="mt-1 text-[10px] text-success">✓ เพิ่มแล้ว</p>
											) : (
												<p className="mt-1 text-[10px] text-t3">ปฏิเสธแล้ว</p>
											)}
										</div>
									))}
									<button onClick={() => setUpsellAiSuggestions(null)} className="text-[10px] text-t3 hover:text-t1">ปิด</button>
								</div>
							)}

							{/* Upsell search + add */}
							{upsells.length < 3 && (
								<div className="relative mb-2">
									<Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-t3" />
									<input
										value={upsellSearch}
										onChange={(e) => setUpsellSearch(e.target.value)}
										placeholder="Search products to add..."
										className="w-full rounded-lg border border-border-input bg-bg-input py-2 pl-8 pr-3 text-xs text-t1 placeholder:text-t3 focus:border-primary focus:outline-none"
									/>
									{upsellSearch && (
										<div className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-bg-card shadow-md max-h-40 overflow-y-auto">
											{filteredForUpsell.slice(0, 8).map((p) => (
												<button
													key={p.id}
													onClick={() => { addToList(upsells, setUpsells, p, 3); setUpsellSearch('') }}
													className="flex w-full items-center justify-between px-3 py-2 text-xs hover:bg-bg-hover text-left"
												>
													<span className="text-t1">{p.name}</span>
													<span className="text-t3">฿{p.price.toLocaleString()}</span>
												</button>
											))}
											{filteredForUpsell.length === 0 && (
												<p className="px-3 py-2 text-xs text-t3">No products found</p>
											)}
										</div>
									)}
								</div>
							)}

							{/* Upsell list */}
							<div className="space-y-1.5">
								{upsells.map((r) => (
									<div key={r.productId} className="flex items-center gap-2 rounded-lg border border-border bg-bg-input p-2.5">
										<span className="flex-1 truncate text-xs font-medium text-t1">{r.productName}</span>
										<div className="flex items-center gap-1">
											<span className="text-t3 text-xs">฿</span>
											<input
												type="number"
												value={upsellOverrides[r.productId] ?? r.customPrice ?? ''}
												onChange={(e) => setUpsellOverrides((prev) => ({ ...prev, [r.productId]: parseFloat(e.target.value) || 0 }))}
												placeholder="Custom price"
												className="w-20 rounded border border-border-input bg-bg-card px-2 py-0.5 text-right text-xs focus:outline-none"
											/>
										</div>
										<button onClick={() => removeFromList(upsells, setUpsells, r.productId)} className="text-t3 hover:text-error">
											<X className="h-3.5 w-3.5" />
										</button>
									</div>
								))}
								{upsells.length === 0 && (
									<p className="py-2 text-center text-xs text-t3">ยังไม่มีสินค้า upsell</p>
								)}
							</div>
						</div>

						{/* Cross-sell section */}
						<div>
							<div className="mb-2 flex items-center justify-between">
								<div>
									<h3 className="text-sm font-medium text-t1">Cross-sell</h3>
									<p className="text-xs text-t3">สินค้าที่มักซื้อพร้อมกัน (สูงสุด 3) — ลิงก์สองทาง ↔</p>
								</div>
								<button
									onClick={() => setCrossSellAiSuggestions(mockAiSuggestions(allProducts, product.id))}
									className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-primary hover:bg-bg-hover"
								>
									<Sparkles className="h-3.5 w-3.5" /> AI แนะนำ
								</button>
							</div>
							{/* Bidirectional note */}
							<div className="mb-2 flex items-center gap-1.5 rounded-lg bg-primary/8 px-2.5 py-1.5 text-[10px] text-primary">
								<span>↔</span>
								<span>เมื่อเพิ่ม cross-sell A → B ระบบจะเพิ่ม B → A อัตโนมัติ (bidirectional)</span>
							</div>

							{/* Cross-sell AI suggestions */}
							{crossSellAiSuggestions && (
								<div className="mb-3 rounded-xl border border-primary/30 bg-bg-input p-3 space-y-2">
									<p className="text-xs font-semibold text-t2 mb-1">🤖 AI แนะนำ Cross-sell</p>
									{crossSellAiSuggestions.map((s) => (
										<div key={s.productId} className="rounded-lg border border-border bg-bg-card p-2.5">
											<div className="flex items-start justify-between gap-2">
												<div className="min-w-0">
													<p className="truncate text-xs font-medium text-t1">{s.productName}</p>
													<div className="mt-0.5 flex items-center gap-1.5 text-[10px]">
														{s.suggestedPrice < s.originalPrice ? (
															<>
																<span className="line-through text-t3">฿{s.originalPrice.toLocaleString()}</span>
																<span className="font-bold text-success">฿{s.suggestedPrice.toLocaleString()}</span>
															</>
														) : (
															<span className="text-t2">฿{s.originalPrice.toLocaleString()}</span>
														)}
													</div>
												</div>
												<span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold', confidenceColor(s.confidence))}>
													{s.confidence}%
												</span>
											</div>
											{s.approved === null ? (
												<div className="mt-2 flex gap-1.5">
													<button
														onClick={() => {
															const p = allProducts.find((x) => x.id === s.productId)
															if (p) addToList(crossSells, setCrossSells, p, 3)
															setCrossSellAiSuggestions((prev) => prev?.map((x) => x.productId === s.productId ? { ...x, approved: true } : x) ?? null)
														}}
														className="flex-1 rounded-lg bg-primary/15 py-1 text-[11px] font-medium text-primary hover:bg-primary/25"
													>✓ Approve</button>
													<button
														onClick={() => setCrossSellAiSuggestions((prev) => prev?.map((x) => x.productId === s.productId ? { ...x, approved: false } : x) ?? null)}
														className="flex-1 rounded-lg bg-bg-hover py-1 text-[11px] font-medium text-t3 hover:text-t1"
													>✕ Reject</button>
												</div>
											) : s.approved ? (
												<p className="mt-1 text-[10px] text-success">✓ เพิ่มแล้ว (ลิงก์สองทาง)</p>
											) : (
												<p className="mt-1 text-[10px] text-t3">ปฏิเสธแล้ว</p>
											)}
										</div>
									))}
									<button onClick={() => setCrossSellAiSuggestions(null)} className="mt-2 text-xs text-t3 hover:text-t1">Close</button>
								</div>
							)}

							{/* Cross-sell search + add */}
							{crossSells.length < 3 && (
								<div className="relative mb-2">
									<Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-t3" />
									<input
										value={crossSellSearch}
										onChange={(e) => setCrossSellSearch(e.target.value)}
										placeholder="Search products to add..."
										className="w-full rounded-lg border border-border-input bg-bg-input py-2 pl-8 pr-3 text-xs text-t1 placeholder:text-t3 focus:border-primary focus:outline-none"
									/>
									{crossSellSearch && (
										<div className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-bg-card shadow-md max-h-40 overflow-y-auto">
											{filteredForCrossSell.slice(0, 8).map((p) => (
												<button
													key={p.id}
													onClick={() => { addToList(crossSells, setCrossSells, p, 3); setCrossSellSearch('') }}
													className="flex w-full items-center justify-between px-3 py-2 text-xs hover:bg-bg-hover text-left"
												>
													<span className="text-t1">{p.name}</span>
													<span className="text-t3">฿{p.price.toLocaleString()}</span>
												</button>
											))}
											{filteredForCrossSell.length === 0 && (
												<p className="px-3 py-2 text-xs text-t3">No products found</p>
											)}
										</div>
									)}
								</div>
							)}

							{/* Cross-sell list */}
							<div className="space-y-1.5">
								{crossSells.map((r) => (
									<div key={r.productId} className="flex items-center gap-2 rounded-lg border border-border bg-bg-input p-2.5">
										<span className="flex-1 truncate text-xs font-medium text-t1">{r.productName}</span>
										<div className="flex items-center gap-1">
											<span className="text-t3 text-xs">฿</span>
											<input
												type="number"
												value={crossSellOverrides[r.productId] ?? r.customPrice ?? ''}
												onChange={(e) => setCrossSellOverrides((prev) => ({ ...prev, [r.productId]: parseFloat(e.target.value) || 0 }))}
												placeholder="Custom price"
												className="w-20 rounded border border-border-input bg-bg-card px-2 py-0.5 text-right text-xs focus:outline-none"
											/>
										</div>
										<button onClick={() => removeFromList(crossSells, setCrossSells, r.productId)} className="text-t3 hover:text-error">
											<X className="h-3.5 w-3.5" />
										</button>
									</div>
								))}
								{crossSells.length === 0 && (
									<p className="py-2 text-center text-xs text-t3">ยังไม่มีสินค้า cross-sell</p>
								)}
							</div>
						</div>

						{/* Save button */}
						<Button onClick={handleSaveRelationships} disabled={isSaving} className="w-full">
							{isSaving ? 'Saving...' : 'Save Relationships'}
						</Button>
					</div>
				)}
			</div>
		</div>
	)
}

// ─── Product Form Modal ──────────────────────────────────────────────────────

function ProductFormModal({
	product,
	onClose,
	onSave,
	isSaving,
}: {
	product: Product | null
	onClose: () => void
	onSave: (data: CreateProductBody & { status?: string }) => void
	isSaving: boolean
}) {
	const [name, setName] = useState(product?.name ?? '')
	const [category, setCategory] = useState(product?.category ?? 'General')
	const [price, setPrice] = useState(product?.price?.toString() ?? '')
	const [stock, setStock] = useState(product?.stock?.toString() ?? '')
	const [description, setDescription] = useState(product?.description ?? '')
	const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? '')
	const [status, setStatus] = useState(product?.status ?? 'Active')
	const [allowPreOrder, setAllowPreOrder] = useState(product?.allowPreOrder ?? false)

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		onSave({
			name: name.trim(),
			category,
			price: parseFloat(price) || 0,
			stock: stock === '' ? undefined : parseInt(stock, 10),
			description: description || undefined,
			imageUrl: imageUrl || undefined,
			allowPreOrder,
			status,
		})
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
			<div
				className="mx-4 w-full max-w-lg rounded-xl border border-border bg-bg-card p-6 shadow-md"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="mb-4 flex items-center justify-between">
					<h2 className="text-lg font-semibold text-t1">{product ? 'Edit Product' : 'Add Product'}</h2>
					<button onClick={onClose} className="rounded-lg p-1.5 text-t3 hover:bg-bg-hover">
						<X className="h-4 w-4" />
					</button>
				</div>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label className="mb-1 block text-sm font-medium text-t2">Name *</label>
						<input
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
							maxLength={200}
							className="w-full rounded-lg border border-border-input bg-bg-input px-3 py-2 text-sm text-t1 placeholder:text-t3 focus:border-primary focus:outline-none"
							placeholder="Product name"
						/>
					</div>
					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="mb-1 block text-sm font-medium text-t2">Category *</label>
							<input
								value={category}
								onChange={(e) => setCategory(e.target.value)}
								required
								className="w-full rounded-lg border border-border-input bg-bg-input px-3 py-2 text-sm text-t1 placeholder:text-t3 focus:border-primary focus:outline-none"
								placeholder="General"
							/>
						</div>
						<div>
							<label className="mb-1 block text-sm font-medium text-t2">Price (THB) *</label>
							<input
								type="number"
								value={price}
								onChange={(e) => setPrice(e.target.value)}
								required
								min="0.01"
								step="0.01"
								className="w-full rounded-lg border border-border-input bg-bg-input px-3 py-2 text-sm text-t1 placeholder:text-t3 focus:border-primary focus:outline-none"
								placeholder="0.00"
							/>
						</div>
					</div>
					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="mb-1 block text-sm font-medium text-t2">Stock</label>
							<input
								type="number"
								value={stock}
								onChange={(e) => setStock(e.target.value)}
								className="w-full rounded-lg border border-border-input bg-bg-input px-3 py-2 text-sm text-t1 placeholder:text-t3 focus:border-primary focus:outline-none"
								placeholder="Unlimited"
							/>
						</div>
						<div>
							<label className="mb-1 block text-sm font-medium text-t2">Status</label>
							<select
								value={status}
								onChange={(e) => setStatus(e.target.value)}
								className="w-full rounded-lg border border-border-input bg-bg-input px-3 py-2 text-sm text-t1 focus:border-primary focus:outline-none"
							>
								<option value="Active">Active</option>
								<option value="Inactive">Inactive</option>
							</select>
						</div>
					</div>
					<div>
						<label className="mb-1 block text-sm font-medium text-t2">Description</label>
						<textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							rows={2}
							className="w-full rounded-lg border border-border-input bg-bg-input px-3 py-2 text-sm text-t1 placeholder:text-t3 focus:border-primary focus:outline-none"
							placeholder="Product description..."
						/>
					</div>
					<div>
						<label className="mb-1 block text-sm font-medium text-t2">Image URL</label>
						<div className="flex gap-3">
							<div className="shrink-0">
								{imageUrl ? (
									<img src={imageUrl} alt="preview" className="h-16 w-16 rounded-lg object-cover border border-border" onError={(e) => { (e.target as HTMLImageElement).src = svgPlaceholder('?', '#374151') }} />
								) : (
									<div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-border bg-bg-input">
										<Package className="h-6 w-6 text-t3" />
									</div>
								)}
							</div>
							<div className="flex-1">
								<input
									value={imageUrl}
									onChange={(e) => setImageUrl(e.target.value)}
									className="w-full rounded-lg border border-border-input bg-bg-input px-3 py-2 text-sm text-t1 placeholder:text-t3 focus:border-primary focus:outline-none"
									placeholder="https://..."
								/>
								<p className="mt-1 text-xs text-t3">ใส่ URL รูปภาพสินค้า — สินค้าที่มีรูปจะได้รับการแนะนำจาก AI ดีกว่า</p>
							</div>
						</div>
					</div>
					<label className="flex items-center gap-2 text-sm text-t2">
						<input type="checkbox" checked={allowPreOrder} onChange={(e) => setAllowPreOrder(e.target.checked)} className="rounded" />
						Allow Pre-order
					</label>
					<div className="flex justify-end gap-2 pt-2">
						<Button variant="outline" onClick={onClose}>Cancel</Button>
						<Button type="submit" disabled={isSaving || !name.trim() || !price}>
							{isSaving ? 'Saving...' : product ? 'Update' : 'Create'}
						</Button>
					</div>
				</form>
			</div>
		</div>
	)
}

// ─── CSV Import Modal ────────────────────────────────────────────────────────

function CsvImportModal({
	onClose,
	onImport,
	isImporting,
	result,
}: {
	onClose: () => void
	onImport: (rows: object[]) => void
	isImporting: boolean
	result: CsvImportResult | null
}) {
	const [csvText, setCsvText] = useState('')

	function handleImport() {
		const lines = csvText.trim().split('\n')
		if (lines.length < 2 || !lines[0]) return
		const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
		const rows = lines.slice(1).map((line) => {
			const values = line.split(',').map((v) => v.trim())
			const row: Record<string, unknown> = {}
			headers.forEach((h, i) => {
				if (h === 'price' || h === 'stock') row[h] = values[i] ? parseFloat(values[i]) : null
				else row[h] = values[i] || null
			})
			return row
		})
		onImport(rows)
	}

	function downloadTemplate() {
		const csv = 'Name,Category,Price,Stock,Description,ImageUrl\nSample Product,General,199,50,A great product,https://example.com/img.jpg'
		const blob = new Blob([csv], { type: 'text/csv' })
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = 'product-import-template.csv'
		a.click()
		URL.revokeObjectURL(url)
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
			<div className="mx-4 w-full max-w-lg rounded-xl border border-border bg-bg-card p-6 shadow-md" onClick={(e) => e.stopPropagation()}>
				<div className="mb-4 flex items-center justify-between">
					<h2 className="text-lg font-semibold text-t1">Import Products (CSV)</h2>
					<button onClick={onClose} className="rounded-lg p-1.5 text-t3 hover:bg-bg-hover"><X className="h-4 w-4" /></button>
				</div>
				{result ? (
					<div className="space-y-3">
						<p className="text-sm font-medium text-success">Import completed!</p>
						<div className="grid grid-cols-3 gap-2 text-center text-sm">
							<div className="rounded-lg bg-success-bg p-2"><div className="text-lg font-bold text-success">{result.created}</div>Created</div>
							<div className="rounded-lg bg-info-bg p-2"><div className="text-lg font-bold text-info">{result.updated}</div>Updated</div>
							<div className="rounded-lg bg-warning-bg p-2"><div className="text-lg font-bold text-warning">{result.skipped}</div>Skipped</div>
						</div>
						{result.errors.length > 0 && (
							<div className="max-h-32 overflow-y-auto rounded-lg border border-border p-2 text-xs">
								{result.errors.map((err, i) => <div key={i} className="text-error">Row {err.row}: {err.field} - {err.message}</div>)}
							</div>
						)}
						<div className="flex justify-end"><Button onClick={onClose}>Close</Button></div>
					</div>
				) : (
					<div className="space-y-4">
						<button onClick={downloadTemplate} className="flex items-center gap-1 text-sm text-primary hover:underline">
							<Download className="h-3.5 w-3.5" /> Download CSV template
						</button>
						<textarea
							value={csvText}
							onChange={(e) => setCsvText(e.target.value)}
							rows={8}
							className="w-full rounded-lg border border-border-input bg-bg-input px-3 py-2 font-mono text-xs text-t1 placeholder:text-t3 focus:border-primary focus:outline-none"
							placeholder={'Name,Category,Price,Stock,Description,ImageUrl\nT-Shirt,Clothing,199,50,,'}
						/>
						<div className="flex justify-end gap-2">
							<Button variant="outline" onClick={onClose}>Cancel</Button>
							<Button onClick={handleImport} disabled={isImporting || !csvText.trim()}>{isImporting ? 'Importing...' : 'Import'}</Button>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export function ProductsPage() {
	const [search, setSearch] = useState('')
	const [categoryFilter, setCategoryFilter] = useState('')
	const [statusFilter, setStatusFilter] = useState('')
	const [showForm, setShowForm] = useState(false)
	const [editProduct, setEditProduct] = useState<Product | null>(null)
	const [showImport, setShowImport] = useState(false)
	const [importResult, setImportResult] = useState<CsvImportResult | null>(null)
	const [detailProduct, setDetailProduct] = useState<Product | null>(null)

	const params = useMemo(() => {
		const p: Record<string, string> = { pageSize: '50' }
		if (search) p.search = search
		if (categoryFilter) p.category = categoryFilter
		if (statusFilter) p.status = statusFilter
		return p
	}, [search, categoryFilter, statusFilter])

	const [sortOutOfStockFirst, setSortOutOfStockFirst] = useState(false)
	const { data, isLoading, isError } = useProducts(params)
	const { data: categories } = useProductCategories()
	const createProduct = useCreateProduct()
	const updateProduct = useUpdateProduct()
	const deleteProduct = useDeleteProduct()
	const importProducts = useImportProducts()

	const rawProducts = (isError || (!isLoading && !data)) ? MOCK_PRODUCTS : (data?.data ?? [])
	const products = useMemo(() => {
		if (!sortOutOfStockFirst) return rawProducts
		return [...rawProducts].sort((a, b) => {
			const aOut = (a.effectiveStock ?? 1) <= 0 ? 0 : 1
			const bOut = (b.effectiveStock ?? 1) <= 0 ? 0 : 1
			return aOut - bOut
		})
	}, [rawProducts, sortOutOfStockFirst])

	function handleSave(formData: CreateProductBody & { status?: string }) {
		if (editProduct) {
			updateProduct.mutate({ productId: editProduct.id, body: formData }, { onSuccess: () => { setShowForm(false); setEditProduct(null) } })
		} else {
			createProduct.mutate(formData, { onSuccess: () => setShowForm(false) })
		}
	}

	function handleDelete(product: Product) {
		if (confirm(`Delete "${product.name}"? This cannot be undone.`)) deleteProduct.mutate(product.id)
	}

	function handleToggleStatus(product: Product) {
		updateProduct.mutate({ productId: product.id, body: { status: product.status === 'Active' ? 'Inactive' : 'Active' } })
	}

	function formatPrice(price: number) {
		return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(price)
	}

	return (
		<div className={cn('mx-auto space-y-5 transition-all', detailProduct ? 'max-w-full pr-[436px]' : 'max-w-7xl')}>
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-t1">Products</h1>
					<p className="mt-0.5 text-sm text-t2">{products.length} product{products.length !== 1 ? 's' : ''} in catalog</p>
				</div>
				<div className="flex gap-2">
					<Button variant="outline" onClick={() => { setImportResult(null); setShowImport(true) }}>
						<Upload className="mr-1.5 h-3.5 w-3.5" /> Import CSV
					</Button>
					<Button onClick={() => { setEditProduct(null); setShowForm(true) }}>
						<Plus className="mr-1.5 h-3.5 w-3.5" /> Add Product
					</Button>
				</div>
			</div>

			{/* Filters */}
			<div className="flex flex-wrap items-center gap-3">
				<div className="relative flex-1 min-w-[200px]">
					<Search className="absolute left-3 top-2.5 h-4 w-4 text-t3" />
					<input
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search products..."
						className="w-full rounded-lg border border-border-input bg-bg-input py-2 pl-9 pr-3 text-sm text-t1 placeholder:text-t3 focus:border-primary focus:outline-none"
					/>
					{search && (
						<button onClick={() => setSearch('')} className="absolute right-3 top-2.5 text-t3 hover:text-t1">
							<X className="h-4 w-4" />
						</button>
					)}
				</div>
				<select
					value={categoryFilter}
					onChange={(e) => setCategoryFilter(e.target.value)}
					className="rounded-lg border border-border-input bg-bg-input px-3 py-2 text-sm text-t1 focus:border-primary focus:outline-none"
				>
					<option value="">All Categories</option>
					{(categories ?? []).map((cat) => <option key={cat} value={cat}>{cat}</option>)}
				</select>
				<select
					value={statusFilter}
					onChange={(e) => setStatusFilter(e.target.value)}
					className="rounded-lg border border-border-input bg-bg-input px-3 py-2 text-sm text-t1 focus:border-primary focus:outline-none"
				>
					<option value="">All Status</option>
					<option value="Active">Active</option>
					<option value="Inactive">Inactive</option>
				</select>
				<button
					onClick={() => setSortOutOfStockFirst((v) => !v)}
					className={cn(
						'flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors',
						sortOutOfStockFirst
							? 'border-error/40 bg-error/10 text-error'
							: 'border-border-input bg-bg-input text-t3 hover:text-t1',
					)}
				>
					<span className="text-xs">🔴</span>
					<span className="text-xs">Out of stock ก่อน</span>
				</button>
			</div>

			{/* Product Table */}
			{isLoading ? (
				<div className="flex h-40 items-center justify-center text-sm text-t3">Loading products...</div>
			) : products.length === 0 ? (
				<div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
					<div className="flex h-20 w-20 items-center justify-center rounded-full bg-bg-input text-t3">
						<Package className="h-10 w-10" />
					</div>
					<div>
						<p className="text-base font-semibold text-t1">No products yet</p>
						<p className="mt-1 text-sm text-t2">Add your first product to get started.</p>
					</div>
					<Button onClick={() => { setEditProduct(null); setShowForm(true) }}>
						<Plus className="mr-1.5 h-4 w-4" /> Add your first product
					</Button>
				</div>
			) : (
				<div className="overflow-x-auto rounded-xl border border-border bg-bg-card shadow-sm">
					<table className="w-full text-left text-sm">
						<thead className="border-b border-border text-xs font-medium uppercase text-t3">
							<tr>
								<th className="px-4 py-3">Product</th>
								<th className="px-4 py-3">Category</th>
								<th className="px-4 py-3 text-right">Price</th>
								<th className="px-4 py-3 text-right">Stock</th>
								<th className="px-4 py-3">Status</th>
								<th className="px-4 py-3 text-right">Actions</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border">
							{products.map((product) => (
								<tr
									key={product.id}
									className={cn('cursor-pointer transition-colors hover:bg-bg-hover', detailProduct?.id === product.id && 'bg-bg-hover')}
									onClick={() => setDetailProduct((prev) => prev?.id === product.id ? null : product)}
								>
									<td className="px-4 py-3">
										<div className="flex items-center gap-3">
											{product.imageUrl ? (
												<img src={product.imageUrl} alt={product.name} className="h-10 w-10 rounded-lg object-cover" />
											) : (
												<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-bg-input text-t3">
													<Package className="h-4 w-4" />
												</div>
											)}
											<div>
												<div className="font-medium text-t1">{product.name}</div>
												{product.description && <div className="max-w-xs truncate text-xs text-t3">{product.description}</div>}
											</div>
										</div>
									</td>
									<td className="px-4 py-3 text-t2">{product.category}</td>
									<td className="px-4 py-3 text-right font-medium text-t1">{formatPrice(product.price)}</td>
									<td className="px-4 py-3 text-right">
										{product.effectiveStock === null ? (
											<span className="text-t3">Unlimited</span>
										) : product.effectiveStock <= 0 && !product.allowPreOrder ? (
											<span className="font-medium text-error">Out of stock</span>
										) : product.effectiveStock < 0 ? (
											<span className="text-warning">{product.effectiveStock} (pre-order)</span>
										) : (
											<span className="text-t1">{product.effectiveStock}</span>
										)}
									</td>
									<td className="px-4 py-3">
										<Badge variant={product.status === 'Active' ? 'success' : 'secondary'}>
											{product.status}
										</Badge>
									</td>
									<td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
										<div className="flex justify-end gap-1">
											<button onClick={() => handleToggleStatus(product)} className="rounded-lg p-1.5 text-t3 hover:bg-bg-hover hover:text-t1" title={product.status === 'Active' ? 'Deactivate' : 'Activate'}>
												{product.status === 'Active' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
											</button>
											<button onClick={() => { setEditProduct(product); setShowForm(true) }} className="rounded-lg p-1.5 text-t3 hover:bg-bg-hover hover:text-t1" title="Edit">
												<Pencil className="h-4 w-4" />
											</button>
											<button onClick={() => handleDelete(product)} className="rounded-lg p-1.5 text-t3 hover:bg-error-bg hover:text-error" title="Delete">
												<Trash2 className="h-4 w-4" />
											</button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{/* Modals */}
			{showForm && (
				<ProductFormModal
					product={editProduct}
					onClose={() => { setShowForm(false); setEditProduct(null) }}
					onSave={handleSave}
					isSaving={createProduct.isPending || updateProduct.isPending}
				/>
			)}
			{showImport && (
				<CsvImportModal
					onClose={() => { setShowImport(false); setImportResult(null) }}
					onImport={(rows) => importProducts.mutate(rows, { onSuccess: (r) => setImportResult(r) })}
					isImporting={importProducts.isPending}
					result={importResult}
				/>
			)}

			{/* Product Detail Side Panel */}
			{detailProduct && (
				<ProductDetailPanel
					product={detailProduct}
					allProducts={products}
					onClose={() => setDetailProduct(null)}
					onSave={(data) => {
						updateProduct.mutate(
							{ productId: detailProduct.id, body: data },
							{ onSuccess: () => { /* panel stays open, shows toast internally */ } },
						)
					}}
					isSaving={updateProduct.isPending}
				/>
			)}
		</div>
	)
}
