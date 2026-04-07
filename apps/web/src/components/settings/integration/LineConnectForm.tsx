import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useOAuthAuthUrl } from '@/api/useOAuth'
import { useConnectIntegration } from '@/api/useIntegrations'

interface LineConnectFormProps {
	onSuccess: () => void
}

export function LineConnectForm({ onSuccess }: LineConnectFormProps) {
	const [mode, setMode] = useState<'oauth' | 'manual'>('oauth')
	const [channelId, setChannelId] = useState('')
	const [channelSecret, setChannelSecret] = useState('')
	const [channelAccessToken, setChannelAccessToken] = useState('')

	const authUrlMutation = useOAuthAuthUrl()
	const connectMutation = useConnectIntegration()

	function handleOAuthConnect() {
		authUrlMutation.mutate('line', {
			onSuccess: (data) => {
				sessionStorage.setItem('oauth_state', data.state)
				window.location.href = data.authUrl
			},
		})
	}

	function handleManualSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (!channelId || !channelSecret || !channelAccessToken) return

		connectMutation.mutate(
			{
				platform: 'Line',
				body: {
					channelId,
					channelSecret,
					channelAccessToken,
				},
			},
			{ onSuccess },
		)
	}

	if (mode === 'oauth') {
		return (
			<div className="space-y-4">
				<p className="text-sm text-gray-600">
					Connect your LINE Official Account using LINE Module Auth. You will be redirected to LINE to authorize.
				</p>
				<Button
					className="w-full bg-green-500 hover:bg-green-600 text-white"
					loading={authUrlMutation.isPending}
					onClick={handleOAuthConnect}
				>
					Connect with LINE
				</Button>
				{authUrlMutation.isError && (
					<p className="text-sm text-red-600">Failed to start LINE login. Please try again.</p>
				)}
				<p className="text-center text-xs text-gray-400">
					Prefer manual setup?{' '}
					<button type="button" className="text-blue-600 underline hover:text-blue-700" onClick={() => setMode('manual')}>
						Enter tokens manually
					</button>
				</p>
			</div>
		)
	}

	return (
		<form onSubmit={handleManualSubmit} className="space-y-4">
			<p className="text-sm text-gray-600">Enter your LINE Official Account channel credentials from the LINE Developers Console.</p>

			<Input
				label="Channel ID"
				placeholder="e.g., 1234567890"
				value={channelId}
				onChange={(e) => setChannelId(e.target.value)}
				required
			/>
			<Input
				label="Channel Secret"
				type="password"
				placeholder="Channel secret"
				value={channelSecret}
				onChange={(e) => setChannelSecret(e.target.value)}
				required
			/>
			<Input
				label="Channel Access Token"
				type="password"
				placeholder="Long-lived channel access token"
				value={channelAccessToken}
				onChange={(e) => setChannelAccessToken(e.target.value)}
				required
			/>

			{connectMutation.isError && (
				<p className="text-sm text-red-600">Failed to connect. Please check your credentials and try again.</p>
			)}

			<Button
				type="submit"
				className="w-full"
				loading={connectMutation.isPending}
				disabled={!channelId || !channelSecret || !channelAccessToken}
			>
				Connect
			</Button>

			<p className="text-center text-xs text-gray-400">
				Prefer OAuth?{' '}
				<button type="button" className="text-blue-600 underline hover:text-blue-700" onClick={() => setMode('oauth')}>
					Use LINE login
				</button>
			</p>
		</form>
	)
}
