import { useState } from 'react'
import { cn } from '@one-bear/ui'
import { type Integration, type IntegrationCredentialSummary } from '@/api/useIntegrations'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

const PLATFORM_COLORS: Record<string, string> = {
	Line: 'bg-green-500',
	Facebook: 'bg-blue-500',
	Instagram: 'bg-pink-500',
	WhatsApp: 'bg-emerald-500',
	Email: 'bg-gray-500',
	TikTok: 'bg-slate-700',
	Lazada: 'bg-orange-500',
	Shopee: 'bg-red-500',
}

function formatDate(timestamp: number | null | undefined): string {
	if (!timestamp) return 'Never'
	return new Date(timestamp).toLocaleString('en-GB', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	})
}

function CredentialRow({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div className="flex items-start justify-between gap-4 py-2">
			<span className="min-w-0 shrink-0 text-sm text-gray-500">{label}</span>
			<span className="min-w-0 break-all text-right text-sm font-medium text-gray-900">{value}</span>
		</div>
	)
}

function ConnectionDetails({ credentials, platform }: { credentials: IntegrationCredentialSummary; platform: string }) {
	const rows: { label: string; value: React.ReactNode }[] = []

	if (credentials.channelId) {
		rows.push({ label: 'Channel ID', value: credentials.channelId })
	}

	if (credentials.pageName) {
		rows.push({ label: 'Page Name', value: credentials.pageName })
	}

	if (credentials.pageId) {
		rows.push({ label: 'Page ID', value: credentials.pageId })
	}

	if (credentials.phoneNumber && platform === 'WhatsApp') {
		const masked =
			credentials.phoneNumber.length > 4
				? '•'.repeat(credentials.phoneNumber.length - 4) + credentials.phoneNumber.slice(-4)
				: credentials.phoneNumber
		rows.push({ label: 'Phone Number', value: masked })
	}

	if (credentials.shopId) {
		rows.push({ label: 'Shop ID', value: credentials.shopId })
	}

	if (credentials.shopName) {
		rows.push({ label: 'Shop Name', value: credentials.shopName })
	}

	if (credentials.emailAddress) {
		rows.push({ label: 'Email Address', value: credentials.emailAddress })
	}

	rows.push({
		label: 'Access Token:',
		value: credentials.hasAccessToken ? (
			<span className="flex items-center justify-end gap-1 text-green-600">
				<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
				</svg>
				Connected
			</span>
		) : (
			<span className="flex items-center justify-end gap-1 text-red-500">
				<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
				</svg>
				Not connected
			</span>
		),
	})

	rows.push({
		label: 'Refresh Token:',
		value: credentials.hasRefreshToken ? (
			<span className="text-gray-700">Available</span>
		) : (
			<span className="text-gray-400">Not available</span>
		),
	})

	return (
		<div className="divide-y divide-gray-100">
			{rows.map(({ label, value }) => (
				<CredentialRow key={label} label={label} value={value} />
			))}
		</div>
	)
}

function TokenStatus({ credentials }: { credentials: IntegrationCredentialSummary }) {
	const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'destructive' }> = {
		valid: { label: 'Valid', variant: 'success' },
		expiring_soon: { label: 'Expiring Soon', variant: 'warning' },
		expired: { label: 'Expired', variant: 'destructive' },
	}

	const status = credentials.tokenStatus
	const config = status ? statusConfig[status] : null

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<span className="text-sm text-gray-500">Token Status</span>
				{config ? (
					<Badge variant={config.variant}>{config.label}</Badge>
				) : (
					<span className="text-sm text-gray-400">Unknown</span>
				)}
			</div>
			{credentials.tokenExpiresAt && (
				<div className="flex items-center justify-between">
					<span className="text-sm text-gray-500">Expires At</span>
					<span className="text-sm font-medium text-gray-900">{formatDate(credentials.tokenExpiresAt)}</span>
				</div>
			)}
			<Button variant="outline" size="sm" disabled title="Coming soon" className="w-full">
				Refresh Token
			</Button>
		</div>
	)
}

function WebhookUrl({ url }: { url: string | null }) {
	const [copied, setCopied] = useState(false)

	function handleCopy() {
		if (!url) return
		navigator.clipboard.writeText(url).then(() => {
			setCopied(true)
			setTimeout(() => setCopied(false), 2000)
		})
	}

	if (!url) {
		return <p className="text-sm text-gray-400">No webhook URL</p>
	}

	return (
		<div className="space-y-2">
			<div className="rounded-md bg-gray-50 px-3 py-2 font-mono text-xs text-gray-700 break-all border border-gray-200">
				{url}
			</div>
			<Button variant="outline" size="sm" onClick={handleCopy} className="w-full">
				{copied ? 'Copied!' : 'Copy'}
			</Button>
		</div>
	)
}

interface IntegrationDetailPanelProps {
	integration: Integration
	onClose: () => void
}

export function IntegrationDetailPanel({ integration, onClose }: IntegrationDetailPanelProps) {
	const platformColor = PLATFORM_COLORS[integration.platform] ?? 'bg-gray-400'
	const abbrev = integration.platform.slice(0, 2).toUpperCase()
	const displayName = integration.name ?? integration.platform

	return (
		<>
			{/* Backdrop */}
			<div className="fixed inset-0 z-30 bg-black/20" onClick={onClose} aria-hidden="true" />

			{/* Panel */}
			<div className="fixed right-0 top-0 z-40 flex h-full w-96 flex-col border-l border-gray-200 bg-white shadow-xl">
				{/* Header */}
				<div className="flex items-center gap-3 border-b border-gray-200 px-4 py-4">
					<div
						className={cn(
							'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white',
							platformColor,
						)}
					>
						{abbrev}
					</div>
					<div className="min-w-0 flex-1">
						<p className="truncate font-semibold text-gray-900">{displayName}</p>
						<Badge variant={integration.status === 'active' ? 'success' : 'secondary'} className="mt-0.5">
							{integration.status}
						</Badge>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
						aria-label="Close panel"
					>
						<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				{/* Scrollable body */}
				<div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
					{/* Section 1: Connection Details */}
					{integration.credentials && (
						<section>
							<h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
								Connection Details
							</h3>
							<div className="rounded-lg border border-gray-200 bg-white px-3">
								<ConnectionDetails
									credentials={integration.credentials}
									platform={integration.platform}
								/>
							</div>
						</section>
					)}

					{/* Section 2: Token Status */}
					{integration.credentials?.tokenStatus != null && integration.credentials && (
						<section>
							<h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
								Token Status
							</h3>
							<div className="rounded-lg border border-gray-200 bg-white px-3 py-3">
								<TokenStatus credentials={integration.credentials} />
							</div>
						</section>
					)}

					{/* Section 3: Webhook URL */}
					<section>
						<h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
							Webhook URL
						</h3>
						<div className="rounded-lg border border-gray-200 bg-white px-3 py-3">
							<WebhookUrl url={integration.webhookUrl} />
						</div>
					</section>

					{/* Section 4: Connection Info */}
					<section>
						<h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
							Connection Info
						</h3>
						<div className="rounded-lg border border-gray-200 bg-white px-3 py-1">
							<CredentialRow label="Connected" value={formatDate(integration.createdTimestamp)} />
							<CredentialRow
								label="Last updated"
								value={integration.updatedTimestamp ? formatDate(integration.updatedTimestamp) : 'Never'}
							/>
							<CredentialRow
								label="Chat feature"
								value={
									integration.hasChatFeature ? (
										<span className="font-medium text-green-600">Enabled</span>
									) : (
										<span className="font-medium text-gray-400">Disabled</span>
									)
								}
							/>
						</div>
					</section>
				</div>

				{/* Sticky bottom actions */}
				<div className="border-t border-gray-200 px-4 py-4">
					<Button variant="destructive" className="w-full">
						Disconnect
					</Button>
				</div>
			</div>
		</>
	)
}
