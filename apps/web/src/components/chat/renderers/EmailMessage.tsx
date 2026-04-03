import { useEffect, useRef } from 'react'
import type { ChatMessage } from '@one-bear/shared-types'

interface Props {
	message: ChatMessage
}

function AutoResizeIframe({ srcDoc }: { srcDoc: string }) {
	const iframeRef = useRef<HTMLIFrameElement>(null)

	useEffect(() => {
		const iframe = iframeRef.current
		if (!iframe) return

		const resize = () => {
			try {
				const body = iframe.contentDocument?.body
				if (body) {
					iframe.style.height = `${body.scrollHeight + 16}px`
				}
			} catch {
				// sandboxed iframe — cross-origin restriction, use a fixed fallback height
				iframe.style.height = '200px'
			}
		}

		iframe.addEventListener('load', resize)
		return () => iframe.removeEventListener('load', resize)
	}, [srcDoc])

	return (
		<iframe
			ref={iframeRef}
			srcDoc={srcDoc}
			sandbox=""
			className="w-full min-h-[100px] rounded border-0"
			title="Email body"
		/>
	)
}

export function EmailMessage({ message }: Props) {
	const meta = message.metadata ?? {}
	const subject = typeof meta.subject === 'string' ? meta.subject : undefined
	const htmlBody = typeof meta.htmlBody === 'string' ? meta.htmlBody : undefined

	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-gray-400">
				<span>✉️</span>
				<span>Email</span>
			</div>
			{subject && (
				<div className="text-sm font-semibold leading-snug">{subject}</div>
			)}
			{htmlBody ? (
				<AutoResizeIframe srcDoc={htmlBody} />
			) : (
				<p className="whitespace-pre-wrap text-sm">{message.content ?? ''}</p>
			)}
		</div>
	)
}
