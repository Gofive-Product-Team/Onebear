import { cn } from '@one-bear/ui'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

// Mock data — payment/subscription API does not exist yet
const currentPlan = {
	name: 'Pro',
	price: 2490,
	currency: 'THB',
	billingCycle: 'monthly' as const,
	nextBillingDate: '2026-05-02',
}

const usage = [
	{ label: 'Messages Sent', current: 12_847, limit: 50_000, unit: 'messages' },
	{ label: 'Active Rooms', current: 47, limit: 200, unit: 'rooms' },
	{ label: 'Storage Used', current: 2.4, limit: 10, unit: 'GB' },
]

const plans = [
	{
		name: 'Free',
		price: 0,
		features: [
			'1 integration',
			'1,000 messages/mo',
			'50 rooms',
			'1 GB storage',
			'Community support',
		],
		current: false,
	},
	{
		name: 'Pro',
		price: 2490,
		features: [
			'5 integrations',
			'50,000 messages/mo',
			'200 rooms',
			'10 GB storage',
			'AI Chatbot',
			'Auto assignment',
			'Priority support',
		],
		current: true,
	},
	{
		name: 'Enterprise',
		price: null,
		features: [
			'Unlimited integrations',
			'Unlimited messages',
			'Unlimited rooms',
			'100 GB storage',
			'AI Chatbot (advanced)',
			'Custom auto assignment',
			'Dedicated support',
			'SSO / SAML',
			'SLA guarantee',
		],
		current: false,
	},
]

const billingHistory = [
	{ date: '2026-04-02', amount: 2490, status: 'paid', invoice: 'INV-2026-0042' },
	{ date: '2026-03-02', amount: 2490, status: 'paid', invoice: 'INV-2026-0031' },
	{ date: '2026-02-02', amount: 2490, status: 'paid', invoice: 'INV-2026-0020' },
	{ date: '2026-01-02', amount: 2490, status: 'paid', invoice: 'INV-2026-0009' },
]

function UsageBar({ current, limit }: { current: number; limit: number }) {
	const percentage = Math.min((current / limit) * 100, 100)
	return (
		<div className="h-2 w-full rounded-full bg-bg-input">
			<div
				className={cn(
					'h-2 rounded-full transition-all',
					percentage > 90 ? 'bg-error' : percentage > 70 ? 'bg-warning' : 'bg-primary',
				)}
				style={{ width: `${percentage}%` }}
			/>
		</div>
	)
}

export function PaymentPage() {
	return (
		<div className="mx-auto max-w-7xl space-y-6">
			<div>
				<h1 className="text-2xl font-bold text-t1">Payment & Subscription</h1>
				<p className="mt-1 text-sm text-t2">Manage your plan, usage, and billing</p>
			</div>

			{/* Current Plan */}
			<div className="rounded-lg border border-border bg-bg-card p-6 shadow-sm">
				<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
					<div>
						<div className="flex items-center gap-2">
							<h2 className="text-lg font-semibold text-t1">Current Plan</h2>
							<Badge variant="default">{currentPlan.name}</Badge>
						</div>
						<p className="mt-1 text-sm text-t2">
							Next billing date: {new Date(currentPlan.nextBillingDate).toLocaleDateString('en-US', {
								month: 'long',
								day: 'numeric',
								year: 'numeric',
							})}
						</p>
					</div>
					<div className="text-right">
						<p className="text-3xl font-bold text-t1">
							{currentPlan.price.toLocaleString()}
							<span className="ml-1 text-sm font-normal text-t2">
								{currentPlan.currency}/{currentPlan.billingCycle === 'monthly' ? 'mo' : 'yr'}
							</span>
						</p>
					</div>
				</div>
			</div>

			{/* Usage Stats */}
			<div className="rounded-lg border border-border bg-bg-card p-6 shadow-sm">
				<h2 className="text-lg font-semibold text-t1">Usage</h2>
				<p className="mt-1 text-sm text-t2">Current billing period usage</p>
				<div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-3">
					{usage.map((item) => (
						<div key={item.label} className="space-y-2">
							<div className="flex items-center justify-between">
								<span className="text-sm font-medium text-t2">{item.label}</span>
								<span className="text-xs text-t2">
									{typeof item.current === 'number' && item.current > 999
										? item.current.toLocaleString()
										: item.current}{' '}
									/ {typeof item.limit === 'number' && item.limit > 999
										? item.limit.toLocaleString()
										: item.limit}{' '}
									{item.unit}
								</span>
							</div>
							<UsageBar current={item.current} limit={item.limit} />
						</div>
					))}
				</div>
			</div>

			{/* Plan Comparison */}
			<div>
				<h2 className="text-lg font-semibold text-t1">Plans</h2>
				<p className="mt-1 text-sm text-t2">Compare plans and upgrade</p>
				<div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
					{plans.map((plan) => (
						<div
							key={plan.name}
							className={cn(
								'rounded-lg border p-6',
								plan.current
									? 'border-primary bg-primary-alpha/30 shadow-md'
									: 'border-border bg-bg-card shadow-sm',
							)}
						>
							<div className="mb-4">
								<div className="flex items-center gap-2">
									<h3 className="text-lg font-semibold text-t1">{plan.name}</h3>
									{plan.current && (
										<Badge variant="default" className="text-[10px]">
											Current
										</Badge>
									)}
								</div>
								<p className="mt-2 text-3xl font-bold text-t1">
									{plan.price !== null ? (
										<>
											{plan.price.toLocaleString()}
											<span className="ml-1 text-sm font-normal text-t2">THB/mo</span>
										</>
									) : (
										<span className="text-lg font-semibold">Contact Sales</span>
									)}
								</p>
							</div>
							<ul className="mb-6 space-y-2">
								{plan.features.map((feature) => (
									<li key={feature} className="flex items-center gap-2 text-sm text-t2">
										<svg
											className="h-4 w-4 shrink-0 text-success"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M5 13l4 4L19 7"
											/>
										</svg>
										{feature}
									</li>
								))}
							</ul>
							{plan.current ? (
								<Button variant="outline" className="w-full" disabled>
									Current Plan
								</Button>
							) : plan.price !== null ? (
								<Button className="w-full">
									{plan.price === 0 ? 'Downgrade' : 'Upgrade'}
								</Button>
							) : (
								<Button variant="secondary" className="w-full">
									Contact Sales
								</Button>
							)}
						</div>
					))}
				</div>
			</div>

			{/* Billing History */}
			<div className="rounded-lg border border-border bg-bg-card p-6 shadow-sm">
				<h2 className="text-lg font-semibold text-t1">Billing History</h2>
				<p className="mt-1 text-sm text-t2">Past invoices and payments</p>
				<div className="mt-4 overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-border">
								<th className="pb-3 text-left font-medium text-t2">Date</th>
								<th className="pb-3 text-left font-medium text-t2">Invoice</th>
								<th className="pb-3 text-right font-medium text-t2">Amount</th>
								<th className="pb-3 text-right font-medium text-t2">Status</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border">
							{billingHistory.map((entry) => (
								<tr key={entry.invoice}>
									<td className="py-3 text-t2">
										{new Date(entry.date).toLocaleDateString('en-US', {
											month: 'short',
											day: 'numeric',
											year: 'numeric',
										})}
									</td>
									<td className="py-3 font-medium text-t1">{entry.invoice}</td>
									<td className="py-3 text-right text-t2">
										{entry.amount.toLocaleString()} THB
									</td>
									<td className="py-3 text-right">
										<Badge variant="success">Paid</Badge>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	)
}
