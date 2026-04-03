import type { ChatMessage } from '@one-bear/shared-types'

interface Props {
	message: ChatMessage
}

function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
	if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
	return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

function getFileIcon(mimeType: string): string {
	if (mimeType.startsWith('image/')) return '🖼️'
	if (mimeType.startsWith('video/')) return '🎬'
	if (mimeType.startsWith('audio/')) return '🎵'
	if (mimeType === 'application/pdf') return '📄'
	if (mimeType.includes('word') || mimeType.includes('document')) return '📝'
	if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊'
	if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📊'
	if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('archive')) return '🗜️'
	return '📎'
}

export function FileMessage({ message }: Props) {
	const attachment = message.attachments?.[0]
	const url = attachment?.url ?? message.content ?? '#'
	const fileName = attachment?.fileName ?? message.content?.split('/').pop() ?? 'File'
	const mimeType = attachment?.mimeType ?? ''
	const fileSize = attachment?.fileSize

	return (
		<a
			href={url}
			target="_blank"
			rel="noopener noreferrer"
			download={fileName}
			className="inline-flex items-center gap-2 rounded-lg border border-current/20 px-2 py-1.5 text-sm underline-offset-2 hover:underline"
		>
			<span className="text-base leading-none">{getFileIcon(mimeType)}</span>
			<span className="flex flex-col">
				<span className="font-medium leading-tight">{fileName}</span>
				{fileSize !== undefined && (
					<span className="text-[10px] opacity-70 leading-tight">{formatFileSize(fileSize)}</span>
				)}
			</span>
		</a>
	)
}
