import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { useFacebookConnect } from '@/api/useOAuth'

const FB_SDK_URL = 'https://connect.facebook.net/en_US/sdk.js'
const FB_SCOPES =
	'pages_messaging,pages_manage_metadata,pages_show_list,instagram_basic,instagram_manage_messages,pages_read_user_content'

interface FacebookConnectFormProps {
	onSuccess: () => void
}

export function FacebookConnectForm({ onSuccess }: FacebookConnectFormProps) {
	const sdkReadyRef = useRef(false)
	const connectMutation = useFacebookConnect()

	useEffect(() => {
		if (sdkReadyRef.current) return

		const existingScript = document.getElementById('facebook-jssdk')
		if (existingScript) {
			sdkReadyRef.current = true
			return
		}

		window.fbAsyncInit = () => {
			window.FB.init({
				appId: import.meta.env.VITE_FB_APP_ID as string,
				version: 'v21.0',
				cookie: true,
				xfbml: true,
			})
			sdkReadyRef.current = true
		}

		const script = document.createElement('script')
		script.id = 'facebook-jssdk'
		script.src = FB_SDK_URL
		script.async = true
		script.defer = true
		document.body.appendChild(script)
	}, [])

	function handleConnect() {
		window.FB.login(
			(response) => {
				if (response.authResponse?.accessToken) {
					connectMutation.mutate(
						{ accessToken: response.authResponse.accessToken, name: 'Facebook Page' },
						{ onSuccess },
					)
				}
			},
			{ scope: FB_SCOPES },
		)
	}

	return (
		<div className="space-y-4">
			<p className="text-sm text-gray-600">
				Connect your Facebook Page to receive and reply to messages. You will be prompted to grant page access permissions.
			</p>
			<Button
				className="w-full bg-blue-600 hover:bg-blue-700 text-white"
				loading={connectMutation.isPending}
				onClick={handleConnect}
			>
				Connect with Facebook
			</Button>
			{connectMutation.isError && (
				<p className="text-sm text-red-600">Failed to connect Facebook. Please try again.</p>
			)}
			<p className="text-xs text-gray-400 text-center">
				Connecting Facebook will also allow linking Instagram Business Accounts.
			</p>
		</div>
	)
}
