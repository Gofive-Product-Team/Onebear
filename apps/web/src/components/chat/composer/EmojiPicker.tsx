import { useState, useRef, useEffect } from 'react'

interface Props {
	onSelect: (emoji: string) => void
}

const EMOJI_ROWS = [
	['😀', '😂', '😍', '😎', '😊', '🥰', '😅', '😭', '😤', '🤔'],
	['👍', '👎', '👏', '🙌', '🤝', '❤️', '🔥', '✅', '⭐', '🎉'],
	['🙏', '💪', '👀', '🤣', '😘', '💯', '🚀', '💡', '⚡', '🌟'],
]

export function EmojiPicker({ onSelect }: Props) {
	const [open, setOpen] = useState(false)
	const containerRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (!open) return

		function handleClickOutside(e: MouseEvent) {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setOpen(false)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [open])

	function handleSelect(emoji: string) {
		onSelect(emoji)
		setOpen(false)
	}

	return (
		<div ref={containerRef} className="relative">
			<button
				type="button"
				onClick={() => setOpen((prev) => !prev)}
				className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700"
				title="Emoji"
			>
				😊
			</button>
			{open && (
				<div className="absolute bottom-10 left-0 z-50 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
					{EMOJI_ROWS.map((row, rowIdx) => (
						<div key={rowIdx} className="flex gap-0.5">
							{row.map((emoji) => (
								<button
									key={emoji}
									type="button"
									onClick={() => handleSelect(emoji)}
									className="flex h-8 w-8 items-center justify-center rounded text-lg hover:bg-gray-100"
								>
									{emoji}
								</button>
							))}
						</div>
					))}
				</div>
			)}
		</div>
	)
}
