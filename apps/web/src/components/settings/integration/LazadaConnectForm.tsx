import { Button } from '@/components/ui/Button'
import { useOAuthAuthUrl } from '@/api/useOAuth'

interface LazadaConnectFormProps {
	onSuccess: () => void
	onCancel: () => void
}

export function LazadaConnectForm({ onCancel }: LazadaConnectFormProps) {
	const authUrlMutation = useOAuthAuthUrl()

	function handleConnect() {
		authUrlMutation.mutate('lazada', {
			onSuccess: (data) => {
				sessionStorage.setItem('oauth_state', data.state)
				window.location.href = data.authUrl
			},
		})
	}

	return (
		<div className="space-y-4">
			<p className="text-sm text-gray-600">Connect your Lazada seller account to manage customer messages.</p>
			<Button
				className="w-full bg-blue-600 hover:bg-blue-700 text-white"
				loading={authUrlMutation.isPending}
				onClick={handleConnect}
			>
				Connect Lazada
			</Button>
			{authUrlMutation.isError && (
				<p className="text-sm text-red-600">Failed to start Lazada authorization. Please try again.</p>
			)}
			<Button type="button" variant="ghost" className="w-full" onClick={onCancel}>
				Cancel
			</Button>
		</div>
	)
}
