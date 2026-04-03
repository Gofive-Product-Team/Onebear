import { useState } from 'react'
import { cn } from '@one-bear/ui'
import {
	useIntegrations,
	useConnectIntegration,
	useDeleteIntegration,
	useUpdateIntegration,
	type Integration,
} from '@/api/useIntegrations'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { ConnectPlatformDialog } from './integration/ConnectPlatformDialog'
import { IntegrationDetailPanel } from './integration/IntegrationDetailPanel'

const AVAILABLE_PLATFORMS = [
	{ value: 'Line', label: 'LINE', color: 'bg-green-500' },
	{ value: 'Facebook', label: 'Facebook', color: 'bg-blue-500' },
	{ value: 'Instagram', label: 'Instagram', color: 'bg-pink-500' },
	{ value: 'WhatsApp', label: 'WhatsApp', color: 'bg-emerald-500' },
	{ value: 'Email', label: 'Email', color: 'bg-gray-500' },
	{ value: 'TikTok', label: 'TikTok', color: 'bg-slate-700' },
	{ value: 'Lazada', label: 'Lazada', color: 'bg-orange-500' },
	{ value: 'Shopee', label: 'Shopee', color: 'bg-red-500' },
]

function ConnectModal({
	onClose,
	editIntegration,
}: {
	onClose: () => void
	editIntegration?: Integration
}) {
	const isEditing = !!editIntegration
	const [selectedPlatform, setSelectedPlatform] = useState(editIntegration?.platform ?? '')
	const [name, setName] = useState(editIntegration?.name ?? '')
	const [token, setToken] = useState('')
	const [secret, setSecret] = useState('')

	const connectMutation = useConnectIntegration()
	const updateMutation = useUpdateIntegration()

	const isPending = isEditing ? updateMutation.isPending : connectMutation.isPending

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (!name) return

		if (isEditing) {
			updateMutation.mutate(
				{
					integrationId: editIntegration.id,
					body: { name, token, secret },
				},
				{ onSuccess: () => onClose() },
			)
		} else {
			if (!selectedPlatform) return
			connectMutation.mutate(
				{
					platform: selectedPlatform,
					body: { name, token, secret },
				},
				{ onSuccess: () => onClose() },
			)
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
			<div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
				<div className="mb-4 flex items-center justify-between">
					<h3 className="text-lg font-semibold text-gray-900">
						{isEditing ? 'Edit Integration' : 'Connect Platform'}
					</h3>
					<button
						onClick={onClose}
						className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
					>
						<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					{!isEditing && (
						<div className="flex flex-col gap-1.5">
							<label className="text-sm font-medium text-gray-700">Platform</label>
							<div className="grid grid-cols-4 gap-2">
								{AVAILABLE_PLATFORMS.map((p) => (
									<button
										key={p.value}
										type="button"
										onClick={() => setSelectedPlatform(p.value)}
										className={cn(
											'flex flex-col items-center gap-1 rounded-md border p-2 text-xs font-medium transition-colors',
											selectedPlatform === p.value
												? 'border-blue-500 bg-blue-50 text-blue-700'
												: 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50',
										)}
									>
										<span className={cn('h-3 w-3 rounded-full', p.color)} />
										{p.label}
									</button>
								))}
							</div>
						</div>
					)}

					{isEditing && (
						<div className="flex items-center gap-2 rounded-md bg-gray-50 px-3 py-2">
							<span className="text-xs font-medium text-gray-500">Platform:</span>
							<Badge platform={editIntegration.platform}>{editIntegration.platform}</Badge>
						</div>
					)}

					<Input
						label="Integration Name"
						placeholder="e.g., Main LINE Account"
						value={name}
						onChange={(e) => setName(e.target.value)}
						required
					/>

					<Input
						label="Access Token"
						placeholder="Platform access token"
						value={token}
						onChange={(e) => setToken(e.target.value)}
					/>

					<Input
						label="Secret Key"
						type="password"
						placeholder="Platform secret key"
						value={secret}
						onChange={(e) => setSecret(e.target.value)}
					/>

					<div className="flex justify-end gap-2 pt-2">
						<Button type="button" variant="outline" onClick={onClose}>
							Cancel
						</Button>
						<Button
							type="submit"
							loading={isPending}
							disabled={!name || (!isEditing && !selectedPlatform)}
						>
							{isEditing ? 'Save Changes' : 'Connect'}
						</Button>
					</div>
				</form>
			</div>
		</div>
	)
}

function DeleteConfirmation({
	integration,
	onClose,
	onConfirm,
}: {
	integration: Integration
	onClose: () => void
	onConfirm: () => void
}) {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
			<div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
				<h3 className="text-lg font-semibold text-gray-900">Delete Integration</h3>
				<p className="mt-2 text-sm text-gray-500">
					Are you sure you want to delete <strong>{integration.name}</strong>? This action cannot
					be undone and will disconnect the platform.
				</p>
				<div className="mt-6 flex justify-end gap-2">
					<Button variant="outline" onClick={onClose}>
						Cancel
					</Button>
					<Button variant="destructive" onClick={onConfirm}>
						Delete
					</Button>
				</div>
			</div>
		</div>
	)
}

export function IntegrationList() {
	const [showConnect, setShowConnect] = useState(false)
	const [deleteTarget, setDeleteTarget] = useState<Integration | null>(null)
	const [editTarget, setEditTarget] = useState<Integration | null>(null)
	const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null)

	const { data: integrations, isLoading, isError } = useIntegrations()
	const deleteMutation = useDeleteIntegration()

	function handleDelete() {
		if (!deleteTarget) return
		deleteMutation.mutate(deleteTarget.id, {
			onSuccess: () => setDeleteTarget(null),
		})
	}

	if (isLoading) {
		return (
			<div className="flex h-48 items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
			</div>
		)
	}

	if (isError) {
		return (
			<div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
				Failed to load integrations. Please try again.
			</div>
		)
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-lg font-semibold text-gray-900">Integrations</h2>
					<p className="text-sm text-gray-500">Manage connected messaging platforms</p>
				</div>
				<Button onClick={() => setShowConnect(true)}>Connect Platform</Button>
			</div>

			{(!Array.isArray(integrations) || integrations.length === 0) ? (
				<div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
					<svg
						className="mx-auto h-12 w-12 text-gray-300"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={1}
							d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
						/>
					</svg>
					<p className="mt-4 text-sm font-medium text-gray-900">No integrations connected</p>
					<p className="mt-1 text-sm text-gray-500">
						Connect a messaging platform to start receiving messages.
					</p>
					<Button className="mt-4" onClick={() => setShowConnect(true)}>
						Connect your first platform
					</Button>
				</div>
			) : (
				<div className="space-y-3">
					{(Array.isArray(integrations) ? integrations : []).map((integration) => (
						<div
							key={integration.id}
							className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:border-blue-300"
							onClick={() => setSelectedIntegration(integration)}
						>
							<div className="flex items-center gap-4">
								<div
									className={cn(
										'flex h-10 w-10 items-center justify-center rounded-lg text-white text-xs font-bold',
										integration.platform === 'Line' && 'bg-green-500',
										integration.platform === 'Facebook' && 'bg-blue-500',
										integration.platform === 'Instagram' && 'bg-pink-500',
										integration.platform === 'WhatsApp' && 'bg-emerald-500',
										integration.platform === 'Email' && 'bg-gray-500',
										integration.platform === 'TikTok' && 'bg-slate-700',
										integration.platform === 'Lazada' && 'bg-orange-500',
										integration.platform === 'Shopee' && 'bg-red-500',
									)}
								>
									{integration.platform.slice(0, 2).toUpperCase()}
								</div>
								<div>
									<p className="font-medium text-gray-900">{integration.name ?? integration.platform}</p>
									<div className="mt-0.5 flex items-center gap-2">
										<Badge platform={integration.platform}>{integration.platform}</Badge>
										<Badge
											variant={integration.status === 'active' ? 'success' : 'secondary'}
										>
											{integration.status}
										</Badge>
										{integration.credentials?.tokenStatus && (
											<Badge
												variant={
													integration.credentials.tokenStatus === 'valid'
														? 'success'
														: integration.credentials.tokenStatus === 'expiring_soon'
															? 'warning'
															: 'destructive'
												}
											>
												{integration.credentials.tokenStatus}
											</Badge>
										)}
									</div>
								</div>
							</div>
							<div className="flex items-center gap-1">
								<button
									type="button"
									onClick={() => setEditTarget(integration)}
									className="rounded-md p-2 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
									title="Edit integration"
								>
									<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={1.5}
											d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
										/>
									</svg>
								</button>
								<button
									type="button"
									onClick={() => setDeleteTarget(integration)}
									className="rounded-md p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
									title="Delete integration"
								>
									<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={1.5}
											d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
										/>
									</svg>
								</button>
							</div>
						</div>
					))}
				</div>
			)}

			{selectedIntegration && (
				<IntegrationDetailPanel
					integration={selectedIntegration}
					onClose={() => setSelectedIntegration(null)}
				/>
			)}
			{showConnect && (
				<ConnectPlatformDialog onClose={() => setShowConnect(false)} onSuccess={() => setShowConnect(false)} />
			)}
			{editTarget && <ConnectModal editIntegration={editTarget} onClose={() => setEditTarget(null)} />}
			{deleteTarget && (
				<DeleteConfirmation
					integration={deleteTarget}
					onClose={() => setDeleteTarget(null)}
					onConfirm={handleDelete}
				/>
			)}
		</div>
	)
}
