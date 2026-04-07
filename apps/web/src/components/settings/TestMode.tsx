import { useState, useRef, useEffect } from 'react'
import { cn } from '@one-bear/ui'
import { useTestChatbot } from '@/api/useChatbot'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ScrollArea } from '@/components/ui/ScrollArea'

interface TestMessage {
	id: string
	role: 'user' | 'ai'
	content: string
	timestamp: number
}

export function TestMode() {
	const testMutation = useTestChatbot()
	const [input, setInput] = useState('')
	const [messages, setMessages] = useState<TestMessage[]>([])
	const scrollRef = useRef<HTMLDivElement>(null)

	// Auto-scroll to bottom on new messages
	useEffect(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight
		}
	}, [messages, testMutation.isPending])

	function handleSend(e: React.FormEvent) {
		e.preventDefault()
		const text = input.trim()
		if (!text) return

		const userMsg: TestMessage = {
			id: crypto.randomUUID(),
			role: 'user',
			content: text,
			timestamp: Date.now(),
		}
		setMessages((prev) => [...prev, userMsg])
		setInput('')

		testMutation.mutate(text, {
			onSuccess: (data) => {
				const aiMsg: TestMessage = {
					id: crypto.randomUUID(),
					role: 'ai',
					content: data?.response ?? 'Request sent, awaiting callback',
					timestamp: Date.now(),
				}
				setMessages((prev) => [...prev, aiMsg])
			},
			onError: () => {
				const aiMsg: TestMessage = {
					id: crypto.randomUUID(),
					role: 'ai',
					content: 'Error: Failed to get response. Please try again.',
					timestamp: Date.now(),
				}
				setMessages((prev) => [...prev, aiMsg])
			},
		})
	}

	return (
		<div className="rounded-lg border border-gray-200 bg-white p-6">
			<div className="mb-4">
				<h3 className="text-base font-semibold text-t1">Test Mode</h3>
				<p className="text-sm text-t3">
					Send test messages to the AI chatbot and see how it responds
				</p>
			</div>

			{/* Chat-like area */}
			<div className="flex flex-col rounded-lg border border-gray-200 bg-gray-50">
				<ScrollArea
					ref={scrollRef}
					className="h-80 p-4"
				>
					{messages.length === 0 && (
						<div className="flex h-full items-center justify-center">
							<p className="text-sm text-t3">Send a message to test the AI chatbot</p>
						</div>
					)}

					<div className="space-y-3">
						{messages.map((msg) => (
							<div
								key={msg.id}
								className={cn(
									'flex',
									msg.role === 'user' ? 'justify-end' : 'justify-start',
								)}
							>
								<div
									className={cn(
										'max-w-[80%] rounded-2xl px-4 py-2 text-sm',
										msg.role === 'user'
											? 'bg-primary text-white rounded-[16px_16px_4px_16px]'
											: 'bg-white text-t1 border border-gray-200 rounded-[16px_16px_16px_4px]',
									)}
								>
									{msg.role === 'ai' && (
										<div className="mb-1 flex items-center gap-1.5">
											<div className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-100">
												<svg className="h-3 w-3 text-purple-600" viewBox="0 0 24 24" fill="currentColor">
													<path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 110 2h-1.07A7.001 7.001 0 0113 22h-2a7.001 7.001 0 01-6.93-6H3a1 1 0 110-2h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2zm-1 9a5 5 0 00-5 5 5 5 0 005 5h2a5 5 0 005-5 5 5 0 00-5-5h-2zm-1 3a1 1 0 110 2 1 1 0 010-2zm4 0a1 1 0 110 2 1 1 0 010-2z" />
												</svg>
											</div>
											<span className="text-[10px] font-semibold text-purple-700">AI</span>
										</div>
									)}
									<p className="whitespace-pre-wrap">{msg.content}</p>
								</div>
							</div>
						))}

						{/* Loading indicator */}
						{testMutation.isPending && (
							<div className="flex justify-start">
								<div className="rounded-2xl rounded-bl border border-gray-200 bg-white px-4 py-3">
									<div className="flex gap-1">
										<span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
										<span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
										<span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
									</div>
								</div>
							</div>
						)}
					</div>
				</ScrollArea>

				{/* Input */}
				<form onSubmit={handleSend} className="flex gap-2 border-t border-gray-200 p-3">
					<input
						type="text"
						value={input}
						onChange={(e) => setInput(e.target.value)}
						placeholder="Type a test message..."
						className={cn(
							'flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-t1',
							'placeholder:text-t3 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
						)}
						disabled={testMutation.isPending}
					/>
					<Button type="submit" size="sm" loading={testMutation.isPending} disabled={!input.trim()}>
						Send
					</Button>
				</form>
			</div>
		</div>
	)
}
