import type { ReactNode } from 'react'
import { Image, Video, Music, FileText, FileSpreadsheet, Archive, Paperclip } from 'lucide-react'
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

function getFileIcon(mimeType: string): ReactNode {
	if (mimeType.startsWith('image/')) return <Image className="h-5 w-5" />
	if (mimeType.startsWith('video/')) return <Video className="h-5 w-5" />
	if (mimeType.startsWith('audio/')) return <Music className="h-5 w-5" />
	if (mimeType === 'application/pdf') return <FileText className="h-5 w-5" />
	if (mimeType.includes('word') || mimeType.includes('document')) return <FileText className="h-5 w-5" />
	if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return <FileSpreadsheet className="h-5 w-5" />
	if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return <FileSpreadsheet className="h-5 w-5" />
	if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('archive')) return <Archive className="h-5 w-5" />
	return <Paperclip className="h-5 w-5" />
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
			<span className="leading-none shrink-0">{getFileIcon(mimeType)}</span>
			<span className="flex flex-col">
				<span className="font-medium leading-tight">{fileName}</span>
				{fileSize !== undefined && (
					<span className="text-[10px] opacity-70 leading-tight">{formatFileSize(fileSize)}</span>
				)}
			</span>
		</a>
	)
}
