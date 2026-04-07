interface Props {
	files: File[]
	onRemove: (index: number) => void
}

export function AttachmentPreview({ files, onRemove }: Props) {
	if (files.length === 0) return null

	return (
		<div className="flex flex-wrap gap-2 px-3 pt-2">
			{files.map((file, index) => (
				<div
					key={`${file.name}-${index}`}
					className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-700"
				>
					<span className="max-w-[120px] truncate font-medium">{file.name}</span>
					<span className="shrink-0 text-gray-400">{(file.size / 1024).toFixed(1)} KB</span>
					<button
						type="button"
						onClick={() => onRemove(index)}
						className="ml-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600"
						aria-label={`Remove ${file.name}`}
					>
						×
					</button>
				</div>
			))}
		</div>
	)
}
