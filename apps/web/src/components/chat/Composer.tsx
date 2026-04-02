import { useState, useRef, useCallback, useEffect, type KeyboardEvent, type ChangeEvent } from 'react'
import { cn } from '@one-bear/ui'
import { useSendMessage } from '@/api/useMessages'
import { Button } from '@/components/ui/Button'

interface Props {
	companyId: string
	roomId: string
	sendTyping: (isTyping: boolean) => void
}

const MAX_ROWS = 4
const LINE_HEIGHT = 20

export function Composer({ companyId, roomId, sendTyping }: Props) {
	const [content, setContent] = useState('')
	const textareaRef = useRef<HTMLTextAreaElement>(null)
	const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const isTypingRef = useRef(false)

	const { mutate: send, isPending } = useSendMessage(companyId, roomId)

	const canSend = content.trim().length > 0 && !isPending

	// Auto-resize textarea
	const adjustHeight = useCallback(() => {
		const textarea = textareaRef.current
		if (!textarea) return
		textarea.style.height = 'auto'
		const maxHeight = LINE_HEIGHT * MAX_ROWS + 16 // padding
		textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`
	}, [])

	const handleSend = useCallback(() => {
		const trimmed = content.trim()
		if (!trimmed || isPending) return

		send(
			{ content: trimmed, messageType: 'text' },
			{
				onSuccess: () => {
					setContent('')
					// Reset textarea height
					if (textareaRef.current) {
						textareaRef.current.style.height = 'auto'
					}
					// Stop typing indicator
					if (isTypingRef.current) {
						sendTyping(false)
						isTypingRef.current = false
					}
				},
			},
		)
	}, [content, isPending, send, sendTyping])

	const handleKeyDown = useCallback(
		(e: KeyboardEvent<HTMLTextAreaElement>) => {
			if (e.key === 'Enter' && !e.shiftKey) {
				e.preventDefault()
				handleSend()
			}
		},
		[handleSend],
	)

	const handleChange = useCallback(
		(e: ChangeEvent<HTMLTextAreaElement>) => {
			setContent(e.target.value)

			// Typing indicator management
			if (!isTypingRef.current && e.target.value.length > 0) {
				isTypingRef.current = true
				sendTyping(true)
			}

			// Clear previous timeout
			if (typingTimeoutRef.current) {
				clearTimeout(typingTimeoutRef.current)
			}

			// Stop typing after 2 seconds of inactivity
			if (e.target.value.length > 0) {
				typingTimeoutRef.current = setTimeout(() => {
					if (isTypingRef.current) {
						sendTyping(false)
						isTypingRef.current = false
					}
				}, 2000)
			} else {
				// Content was cleared
				if (isTypingRef.current) {
					sendTyping(false)
					isTypingRef.current = false
				}
			}
		},
		[sendTyping],
	)

	// Adjust height when content changes
	useEffect(() => {
		adjustHeight()
	}, [content, adjustHeight])

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
		setContent('')
		if (textareaRef.current) {
			textareaRef.current.style.height = 'auto'
		}
	}, [roomId])

	return (
		<div className="shrink-0 border-t border-gray-200 bg-white px-4 py-3">
			<div className="flex items-end gap-2">
				<textarea
					ref={textareaRef}
					value={content}
					onChange={handleChange}
					onKeyDown={handleKeyDown}
					placeholder="Type a message..."
					rows={1}
					className={cn(
						'flex-1 resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm',
						'placeholder:text-gray-400',
						'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1',
						'disabled:cursor-not-allowed disabled:opacity-50',
					)}
					style={{ lineHeight: `${LINE_HEIGHT}px` }}
					disabled={isPending}
				/>
				<Button
					onClick={handleSend}
					disabled={!canSend}
					size="md"
					className="shrink-0"
				>
					{isPending ? (
						<svg
							className="h-4 w-4 animate-spin"
							viewBox="0 0 24 24"
							fill="none"
						>
							<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
							<path
								className="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							/>
						</svg>
					) : (
						<svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
							<path d="M1.5 1.5l13 6.5-13 6.5V9l8-1-8-1V1.5z" />
						</svg>
					)}
					<span className="sr-only">Send</span>
				</Button>
			</div>
		</div>
	)
}
