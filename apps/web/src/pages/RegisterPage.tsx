import { useState } from 'react'

const API_BASE = '/api/v1'

export function RegisterPage() {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [displayName, setDisplayName] = useState('')
	const [companyName, setCompanyName] = useState('')
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState(false)
	const [loading, setLoading] = useState(false)

	const handleRegister = async () => {
		setError(null)

		if (!email || !password || !confirmPassword || !displayName || !companyName) {
			setError('กรุณากรอกข้อมูลให้ครบทุกช่อง')
			return
		}
		if (password !== confirmPassword) {
			setError('รหัสผ่านไม่ตรงกัน')
			return
		}
		if (password.length < 8) {
			setError('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร')
			return
		}

		setLoading(true)
		try {
			const response = await fetch(`${API_BASE}/auth/register`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password, displayName, companyName }),
			})

			if (!response.ok) {
				const body = await response.json().catch(() => null)
				const detail = body?.detail ?? body?.message ?? `Registration failed (${response.status})`
				throw new Error(detail)
			}

			setSuccess(true)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Registration failed')
		} finally {
			setLoading(false)
		}
	}

	if (success) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-gray-50">
				<div className="w-full max-w-sm space-y-4 rounded-xl bg-white p-8 text-center shadow-lg">
					<h1 className="text-2xl font-bold text-t1">สร้างบัญชีสำเร็จ</h1>
					<p className="text-sm text-t3">
						บัญชีของคุณถูกสร้างเรียบร้อยแล้ว กรุณาเข้าสู่ระบบเพื่อเริ่มใช้งาน
					</p>
					<a
						href="/"
						className="inline-block w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white hover:bg-primary/90"
					>
						ไปหน้าเข้าสู่ระบบ
					</a>
				</div>
			</div>
		)
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50">
			<div className="w-full max-w-sm space-y-5 rounded-xl bg-white p-8 shadow-lg">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-t1">สมัครใช้งาน</h1>
					<p className="mt-1 text-sm text-t3">สร้างร้านค้าใหม่บน One Bear</p>
				</div>

				{error && (
					<div className="rounded-lg border border-error bg-error/5 px-4 py-3 text-sm text-error">
						{error}
					</div>
				)}

				<div className="space-y-3">
					<div>
						<label className="mb-1 block text-sm font-medium text-t2">อีเมล</label>
						<input
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="you@company.com"
							className="w-full rounded-lg border border-border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
						/>
					</div>
					<div>
						<label className="mb-1 block text-sm font-medium text-t2">รหัสผ่าน</label>
						<input
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="อย่างน้อย 8 ตัวอักษร"
							className="w-full rounded-lg border border-border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
						/>
					</div>
					<div>
						<label className="mb-1 block text-sm font-medium text-t2">ยืนยันรหัสผ่าน</label>
						<input
							type="password"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							placeholder="กรอกรหัสผ่านอีกครั้ง"
							className="w-full rounded-lg border border-border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
						/>
					</div>
					<div>
						<label className="mb-1 block text-sm font-medium text-t2">ชื่อที่แสดง</label>
						<input
							type="text"
							value={displayName}
							onChange={(e) => setDisplayName(e.target.value)}
							placeholder="ชื่อ-นามสกุล"
							className="w-full rounded-lg border border-border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
						/>
					</div>
					<div>
						<label className="mb-1 block text-sm font-medium text-t2">ชื่อบริษัท</label>
						<input
							type="text"
							value={companyName}
							onChange={(e) => setCompanyName(e.target.value)}
							placeholder="ชื่อบริษัทหรือร้านค้า"
							className="w-full rounded-lg border border-border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
						/>
					</div>
				</div>

				<button
					onClick={handleRegister}
					disabled={loading}
					className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
				>
					{loading ? 'กำลังสร้างบัญชี...' : 'สมัครใช้งาน'}
				</button>

				<div className="text-center">
					<a href="/" className="text-sm text-primary hover:underline">
						มีบัญชีอยู่แล้ว — เข้าสู่ระบบ
					</a>
				</div>
			</div>
		</div>
	)
}
