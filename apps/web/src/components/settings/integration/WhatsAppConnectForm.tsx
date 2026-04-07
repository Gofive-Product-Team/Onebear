import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { useWhatsAppConnect } from '@/api/useOAuth'

const FB_SDK_URL = 'https://connect.facebook.net/en_US/sdk.js'
const WHATSAPP_SCOPES = 'whatsapp_business_messaging,whatsapp_business_management'

interface WhatsAppConnectFormProps {
	onSuccess: () => void
}

export function WhatsAppConnectForm({ onSuccess }: WhatsAppConnectFormProps) {
	const sdkReadyRef = useRef(false)
	const connectMutation = useWhatsAppConnect()

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
					connectMutation.mutate({ accessToken: response.authResponse.accessToken }, { onSuccess })
				}
			},
			{ scope: WHATSAPP_SCOPES },
		)
	}

	return (
		<div className="space-y-4">
			<p className="text-sm text-gray-600">
				Connect your WhatsApp Business Account using Facebook embedded signup. You will be asked to grant WhatsApp business permissions.
			</p>
			<Button
				className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
				loading={connectMutation.isPending}
				onClick={handleConnect}
			>
				Connect WhatsApp Business
			</Button>
			{connectMutation.isError && (
				<p className="text-sm text-red-600">Failed to connect WhatsApp Business. Please try again.</p>
			)}
		</div>
	)
}
