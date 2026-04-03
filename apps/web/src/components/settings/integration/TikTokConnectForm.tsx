import { Button } from '@/components/ui/Button'
import { useOAuthAuthUrl } from '@/api/useOAuth'

interface TikTokConnectFormProps {
	onSuccess: () => void
	onCancel: () => void
}

export function TikTokConnectForm({ onCancel }: TikTokConnectFormProps) {
	const authUrlMutation = useOAuthAuthUrl()

	function handleConnect() {
		authUrlMutation.mutate('tiktok', {
			onSuccess: (data) => {
				sessionStorage.setItem('oauth_state', data.state)
				window.location.href = data.authUrl
			},
		})
	}

	return (
		<div className="space-y-4">
			<p className="text-sm text-gray-600">Connect your TikTok Shop to manage customer conversations.</p>
			<Button
				className="w-full bg-slate-800 hover:bg-slate-900 text-white"
				loading={authUrlMutation.isPending}
				onClick={handleConnect}
			>
				Connect TikTok Shop
			</Button>
			{authUrlMutation.isError && (
				<p className="text-sm text-red-600">Failed to start TikTok authorization. Please try again.</p>
			)}
			<Button type="button" variant="ghost" className="w-full" onClick={onCancel}>
				Cancel
			</Button>
		</div>
	)
}
