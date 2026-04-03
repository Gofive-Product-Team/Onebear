import { useState } from 'react'
import { cn } from '@one-bear/ui'
import { LineConnectForm } from './LineConnectForm'
import { FacebookConnectForm } from './FacebookConnectForm'
import { InstagramInfo } from './InstagramInfo'
import { WhatsAppConnectForm } from './WhatsAppConnectForm'

const PLATFORMS = [
	{ value: 'Line', label: 'LINE', color: 'bg-green-500', enabled: true },
	{ value: 'Facebook', label: 'Facebook', color: 'bg-blue-500', enabled: true },
	{ value: 'Instagram', label: 'Instagram', color: 'bg-pink-500', enabled: true },
	{ value: 'WhatsApp', label: 'WhatsApp', color: 'bg-emerald-500', enabled: true },
	{ value: 'Email', label: 'Email', color: 'bg-gray-400', enabled: false },
	{ value: 'TikTok', label: 'TikTok', color: 'bg-slate-700', enabled: false },
	{ value: 'Lazada', label: 'Lazada', color: 'bg-orange-500', enabled: false },
	{ value: 'Shopee', label: 'Shopee', color: 'bg-red-500', enabled: false },
]

interface ConnectPlatformDialogProps {
	onClose: () => void
	onSuccess: () => void
}

export function ConnectPlatformDialog({ onClose, onSuccess }: ConnectPlatformDialogProps) {
	const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null)

	function renderForm() {
		switch (selectedPlatform) {
			case 'Line':
				return <LineConnectForm onSuccess={onSuccess} />
			case 'Facebook':
				return <FacebookConnectForm onSuccess={onSuccess} />
			case 'Instagram':
				return <InstagramInfo onClose={onClose} />
			case 'WhatsApp':
				return <WhatsAppConnectForm onSuccess={onSuccess} />
			default:
				return null
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
			<div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
				<div className="mb-4 flex items-center justify-between">
					<div className="flex items-center gap-2">
						{selectedPlatform && (
							<button
								type="button"
								onClick={() => setSelectedPlatform(null)}
								className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
								aria-label="Back to platform picker"
							>
								<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
								</svg>
							</button>
						)}
						<h3 className="text-lg font-semibold text-gray-900">
							{selectedPlatform ? `Connect ${PLATFORMS.find((p) => p.value === selectedPlatform)?.label}` : 'Connect Platform'}
						</h3>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
						aria-label="Close dialog"
					>
						<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				{!selectedPlatform ? (
					<div className="grid grid-cols-4 gap-3">
						{PLATFORMS.map((p) => (
							<button
								key={p.value}
								type="button"
								disabled={!p.enabled}
								onClick={() => p.enabled && setSelectedPlatform(p.value)}
								className={cn(
									'relative flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs font-medium transition-colors',
									p.enabled
										? 'border-gray-200 text-gray-700 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 cursor-pointer'
										: 'border-gray-100 text-gray-400 cursor-not-allowed bg-gray-50',
								)}
							>
								<span className={cn('h-6 w-6 rounded-full', p.enabled ? p.color : 'bg-gray-300')} />
								<span>{p.label}</span>
								{!p.enabled && (
									<span className="absolute -top-1.5 -right-1.5 rounded-full bg-gray-200 px-1 py-0.5 text-[9px] font-semibold text-gray-500 leading-none">
										Phase 2
									</span>
								)}
							</button>
						))}
					</div>
				) : (
					<div className="mt-2">{renderForm()}</div>
				)}
			</div>
		</div>
	)
}
