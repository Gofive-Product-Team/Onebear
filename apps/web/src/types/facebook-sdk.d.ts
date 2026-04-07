export {}

declare global {
	interface Window {
		FB: {
			init: (params: { appId: string; version: string; cookie?: boolean; xfbml?: boolean }) => void
			login: (
				callback: (response: {
					authResponse: { accessToken: string; userID: string } | null
					status: string
				}) => void,
				options?: { scope: string },
			) => void
		}
		fbAsyncInit: () => void
	}
}
