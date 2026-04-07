import type { Editor } from '@tiptap/react'
import { cn } from '@one-bear/ui'
import { EmojiPicker } from './EmojiPicker'

interface Props {
	editor: Editor | null
	isRichMode: boolean
	onEmojiSelect: (emoji: string) => void
	onAttachClick: () => void
}

export function ComposerToolbar({ editor, isRichMode, onEmojiSelect, onAttachClick }: Props) {
	return (
		<div className="flex items-center gap-0.5 px-2 py-1">
			{isRichMode && (
				<>
					<button
						type="button"
						onClick={() => editor?.chain().focus().toggleBold().run()}
						disabled={!editor}
						className={cn(
							'flex h-8 w-8 items-center justify-center rounded-md text-sm font-bold text-gray-500 hover:bg-gray-100 hover:text-gray-700',
							editor?.isActive('bold') && 'bg-gray-200 text-gray-900',
						)}
						title="Bold"
					>
						B
					</button>
					<button
						type="button"
						onClick={() => editor?.chain().focus().toggleItalic().run()}
						disabled={!editor}
						className={cn(
							'flex h-8 w-8 items-center justify-center rounded-md text-sm italic text-gray-500 hover:bg-gray-100 hover:text-gray-700',
							editor?.isActive('italic') && 'bg-gray-200 text-gray-900',
						)}
						title="Italic"
					>
						I
					</button>
				</>
			)}
			<EmojiPicker onSelect={onEmojiSelect} />
			<button
				type="button"
				onClick={onAttachClick}
				className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700"
				title="Attach file"
			>
				<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
					/>
				</svg>
			</button>
		</div>
	)
}
