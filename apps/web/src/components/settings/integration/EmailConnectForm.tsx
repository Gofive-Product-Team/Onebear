import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useOAuthAuthUrl } from '@/api/useOAuth'
import { useConnectIntegration } from '@/api/useIntegrations'

interface EmailConnectFormProps {
	onSuccess: () => void
	onCancel: () => void
}

export function EmailConnectForm({ onSuccess, onCancel }: EmailConnectFormProps) {
	const [mode, setMode] = useState<'oauth' | 'manual'>('oauth')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [smtpHost, setSmtpHost] = useState('')
	const [smtpPort, setSmtpPort] = useState('587')
	const [imapHost, setImapHost] = useState('')
	const [imapPort, setImapPort] = useState('993')

	const authUrlMutation = useOAuthAuthUrl()
	const connectMutation = useConnectIntegration()

	function handleGmailConnect() {
		authUrlMutation.mutate('gmail', {
			onSuccess: (data) => {
				sessionStorage.setItem('oauth_state', data.state)
				window.location.href = data.authUrl
			},
		})
	}

	function handleOutlookConnect() {
		authUrlMutation.mutate('outlook', {
			onSuccess: (data) => {
				sessionStorage.setItem('oauth_state', data.state)
				window.location.href = data.authUrl
			},
		})
	}

	function handleManualSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (!email || !password || !smtpHost || !smtpPort || !imapHost || !imapPort) return

		connectMutation.mutate(
			{
				platform: 'Email',
				body: {
					emailAddress: email,
					emailPassword: password,
					smtpHost,
					smtpPort: Number(smtpPort),
					imapHost,
					imapPort: Number(imapPort),
				},
			},
			{ onSuccess },
		)
	}

	if (mode === 'oauth') {
		return (
			<div className="space-y-4">
				<p className="text-sm text-gray-600">
					Connect your email account to receive and respond to customer messages.
				</p>
				<Button
					className="w-full bg-red-500 hover:bg-red-600 text-white"
					loading={authUrlMutation.isPending}
					onClick={handleGmailConnect}
				>
					Connect Gmail
				</Button>
				<Button
					className="w-full bg-blue-700 hover:bg-blue-800 text-white"
					loading={authUrlMutation.isPending}
					onClick={handleOutlookConnect}
				>
					Connect Outlook
				</Button>
				{authUrlMutation.isError && (
					<p className="text-sm text-red-600">Failed to start email authorization. Please try again.</p>
				)}
				<p className="text-center text-xs text-gray-400">
					<button
						type="button"
						className="text-blue-600 underline hover:text-blue-700"
						onClick={() => setMode('manual')}
					>
						Or configure SMTP manually
					</button>
				</p>
				<Button type="button" variant="ghost" className="w-full" onClick={onCancel}>
					Cancel
				</Button>
			</div>
		)
	}

	return (
		<form onSubmit={handleManualSubmit} className="space-y-4">
			<p className="text-sm text-gray-600">
				Configure your email account using SMTP and IMAP settings.
			</p>

			<Input
				label="Email Address"
				type="email"
				placeholder="you@example.com"
				value={email}
				onChange={(e) => setEmail(e.target.value)}
				required
			/>
			<Input
				label="Email Password"
				type="password"
				placeholder="App password"
				value={password}
				onChange={(e) => setPassword(e.target.value)}
				required
			/>
			<Input
				label="SMTP Host"
				placeholder="smtp.gmail.com"
				value={smtpHost}
				onChange={(e) => setSmtpHost(e.target.value)}
				required
			/>
			<Input
				label="SMTP Port"
				type="number"
				placeholder="587"
				value={smtpPort}
				onChange={(e) => setSmtpPort(e.target.value)}
				required
			/>
			<Input
				label="IMAP Host"
				placeholder="imap.gmail.com"
				value={imapHost}
				onChange={(e) => setImapHost(e.target.value)}
				required
			/>
			<Input
				label="IMAP Port"
				type="number"
				placeholder="993"
				value={imapPort}
				onChange={(e) => setImapPort(e.target.value)}
				required
			/>

			{connectMutation.isError && (
				<p className="text-sm text-red-600">Failed to connect. Please check your settings and try again.</p>
			)}

			<Button
				type="submit"
				className="w-full"
				loading={connectMutation.isPending}
				disabled={!email || !password || !smtpHost || !smtpPort || !imapHost || !imapPort}
			>
				Connect
			</Button>

			<p className="text-center text-xs text-gray-400">
				<button
					type="button"
					className="text-blue-600 underline hover:text-blue-700"
					onClick={() => setMode('oauth')}
				>
					Use Gmail/Outlook instead
				</button>
			</p>

			<Button type="button" variant="ghost" className="w-full" onClick={onCancel}>
				Cancel
			</Button>
		</form>
	)
}
