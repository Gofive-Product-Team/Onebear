import { Button } from '@/components/ui/Button'
import { useOAuthAuthUrl } from '@/api/useOAuth'

interface ShopeeConnectFormProps {
	onSuccess: () => void
	onCancel: () => void
}

export function ShopeeConnectForm({ onCancel }: ShopeeConnectFormProps) {
	const authUrlMutation = useOAuthAuthUrl()

	function handleConnect() {
		authUrlMutation.mutate('shopee', {
			onSuccess: (data) => {
				sessionStorage.setItem('oauth_state', data.state)
				window.location.href = data.authUrl
			},
		})
	}

	return (
		<div className="space-y-4">
			<p className="text-sm text-gray-600">
				Connect your Shopee Shop to receive and respond to customer messages.
			</p>
			<Button
				className="w-full bg-orange-500 hover:bg-orange-600 text-white"
				loading={authUrlMutation.isPending}
				onClick={handleConnect}
			>
				Connect Shopee Shop
			</Button>
			{authUrlMutation.isError && (
				<p className="text-sm text-red-600">Failed to start Shopee authorization. Please try again.</p>
			)}
			<Button type="button" variant="ghost" className="w-full" onClick={onCancel}>
				Cancel
			</Button>
		</div>
	)
}
