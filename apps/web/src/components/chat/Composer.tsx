// NOTE: Parent must pass platform prop (e.g., from current room data)
import { useState, useRef, useCallback, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { cn } from '@one-bear/ui'
import { useSendMessage } from '@/api/useMessages'
import { ComposerToolbar } from './composer/ComposerToolbar'
import { AttachmentPreview } from './composer/AttachmentPreview'

interface Props {
	companyId: string
	roomId: string
	platform: string
	sendTyping: (isTyping: boolean) => void
}

export function Composer({ companyId, roomId, platform, sendTyping }: Props) {
	const isRichMode = platform === 'Email'

	const [attachments, setAttachments] = useState<File[]>([])
	const fileInputRef = useRef<HTMLInputElement>(null)
	const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const isTypingRef = useRef(false)

	const { mutate: send, isPending } = useSendMessage(companyId, roomId)

	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				heading: false,
				blockquote: false,
				codeBlock: false,
				code: false,
				horizontalRule: false,
				bulletList: false,
				orderedList: false,
				bold: isRichMode ? {} : false,
				italic: isRichMode ? {} : false,
			}),
			...(isRichMode
				? [
						Link.configure({
							openOnClick: false,
							HTMLAttributes: { class: 'text-primary underline' },
						}),
					]
				: []),
			Placeholder.configure({
				placeholder: 'Type a message...',
			}),
		],
		editorProps: {
			attributes: {
				class: cn(
					'flex-1 min-h-[36px] max-h-[80px] overflow-y-auto px-3 py-2 text-sm text-t1',
					'focus:outline-none',
					'[&_p]:m-0',
				),
			},
			handleKeyDown: (_view, event) => {
				if (event.key === 'Enter' && !event.shiftKey) {
					event.preventDefault()
					handleSend()
					return true
				}
				return false
			},
		},
		onUpdate: ({ editor: ed }) => {
			const text = ed.getText()

			// Typing indicator management
			if (!isTypingRef.current && text.length > 0) {
				isTypingRef.current = true
				sendTyping(true)
			}

			if (typingTimeoutRef.current) {
				clearTimeout(typingTimeoutRef.current)
			}

			if (text.length > 0) {
				typingTimeoutRef.current = setTimeout(() => {
					if (isTypingRef.current) {
						sendTyping(false)
						isTypingRef.current = false
					}
				}, 2000)
			} else {
				if (isTypingRef.current) {
					sendTyping(false)
					isTypingRef.current = false
				}
			}
		},
	})

	const handleSend = useCallback(() => {
		if (!editor) return
		const text = editor.getText().trim()
		if (!text || isPending) return

		const content = isRichMode ? editor.getHTML() : editor.getText()

		send(
			{ content, messageType: 'text' },
			{
				onSuccess: () => {
					editor.commands.clearContent(true)
					if (isTypingRef.current) {
						sendTyping(false)
						isTypingRef.current = false
					}
					setAttachments([])
				},
			},
		)
	}, [editor, isPending, isRichMode, send, sendTyping])

	const handleEmojiSelect = useCallback(
		(emoji: string) => {
			editor?.chain().focus().insertContent(emoji).run()
		},
		[editor],
	)

	const handleAttachClick = useCallback(() => {
		fileInputRef.current?.click()
	}, [])

	const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files ?? [])
		setAttachments((prev) => [...prev, ...files])
		// Reset input so same file can be selected again
		if (fileInputRef.current) fileInputRef.current.value = ''
	}, [])

	const handleRemoveAttachment = useCallback((index: number) => {
		setAttachments((prev) => prev.filter((_, i) => i !== index))
	}, [])

	// Cleanup typing timeout on unmount
	useEffect(() => {
		return () => {
			if (typingTimeoutRef.current) {
				clearTimeout(typingTimeoutRef.current)
			}
			if (isTypingRef.current) {
				sendTyping(false)
			}
		}
	}, [sendTyping])

	// Reset content when room changes
	useEffect(() => {
		editor?.commands.clearContent(true)
		setAttachments([])
	}, [roomId, editor])

	const canSend = (editor?.getText().trim().length ?? 0) > 0 && !isPending

	return (
		<div className="shrink-0 border-t border-border bg-bg-card">
			{/* Toolbar */}
			<ComposerToolbar
				editor={editor}
				isRichMode={isRichMode}
				onEmojiSelect={handleEmojiSelect}
				onAttachClick={handleAttachClick}
			/>

			{/* Attachment previews */}
			<AttachmentPreview files={attachments} onRemove={handleRemoveAttachment} />

			{/* Editor row */}
			<div className="flex items-end gap-2 px-4 pb-3">
				<div
					className={cn(
						'flex-1 rounded-lg border border-border-input bg-bg-input',
						'focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-1',
						isPending && 'cursor-not-allowed opacity-50',
					)}
				>
					<EditorContent editor={editor} />
				</div>

				<button
					type="button"
					onClick={handleSend}
					disabled={!canSend}
					className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-light to-primary flex items-center justify-center shrink-0 shadow-[0_2px_10px_var(--color-primary-alpha)] transition-all duration-250 hover:-translate-y-px hover:shadow-[0_4px_18px_var(--color-primary-glow)] disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isPending ? (
						<svg className="w-[18px] h-[18px] text-white animate-spin" viewBox="0 0 24 24" fill="none">
							<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
							<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
						</svg>
					) : (
						<svg className="w-[18px] h-[18px] text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							<line x1="22" y1="2" x2="11" y2="13" />
							<polygon points="22 2 15 22 11 13 2 9 22 2" />
						</svg>
					)}
				</button>
			</div>

			{/* Hidden file input */}
			<input
				ref={fileInputRef}
				type="file"
				multiple
				className="hidden"
				onChange={handleFileChange}
			/>
		</div>
	)
}
