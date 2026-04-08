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
} from 'lucide-react'

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
						<input
							value={imageUrl}
							onChange={(e) => setImageUrl(e.target.value)}
							className="w-full rounded-lg border border-border-input bg-bg-input px-3 py-2 text-sm text-t1 placeholder:text-t3 focus:border-primary focus:outline-none"
							placeholder="https://..."
						/>
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
		if (lines.length < 2) return
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

	const params = useMemo(() => {
		const p: Record<string, string> = { pageSize: '50' }
		if (search) p.search = search
		if (categoryFilter) p.category = categoryFilter
		if (statusFilter) p.status = statusFilter
		return p
	}, [search, categoryFilter, statusFilter])

	const { data, isLoading } = useProducts(params)
	const { data: categories } = useProductCategories()
	const createProduct = useCreateProduct()
	const updateProduct = useUpdateProduct()
	const deleteProduct = useDeleteProduct()
	const importProducts = useImportProducts()

	const products = data?.data ?? []

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
		<div className="mx-auto max-w-7xl space-y-5">
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
								<tr key={product.id} className="transition-colors hover:bg-bg-hover">
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
									<td className="px-4 py-3">
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
		</div>
	)
}
