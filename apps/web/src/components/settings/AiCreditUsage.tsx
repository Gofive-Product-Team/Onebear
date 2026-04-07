import { useState } from 'react'
import { cn } from '@one-bear/ui'
import { useCreditStatus, useTopUpCredit, type CreditStatus } from '@/api/useChatbot'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent, DialogFooter, DialogClose } from '@/components/ui/Dialog'

function getWarningColor(warning: CreditStatus['warning']) {
	switch (warning) {
		case 'Exhausted':
			return { bar: 'bg-red-500', text: 'text-red-600', bg: 'bg-red-50', pulse: true }
		case 'Red10':
			return { bar: 'bg-red-500', text: 'text-red-600', bg: 'bg-red-50', pulse: false }
		case 'Yellow20':
			return { bar: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-50', pulse: false }
		default:
			return { bar: 'bg-green-500', text: 'text-green-600', bg: 'bg-green-50', pulse: false }
	}
}

function getWarningLabel(warning: CreditStatus['warning']) {
	switch (warning) {
		case 'Exhausted':
			return 'Credits Exhausted'
		case 'Red10':
			return 'Low Credits (<10%)'
		case 'Yellow20':
			return 'Credits Running Low (<20%)'
		default:
			return 'Healthy'
	}
}

export function AiCreditUsage() {
	const { data: credit, isLoading } = useCreditStatus()
	const topUpMutation = useTopUpCredit()
	const [showTopUp, setShowTopUp] = useState(false)
	const [topUpAmount, setTopUpAmount] = useState('')

	function handleTopUp() {
		const amount = parseInt(topUpAmount, 10)
		if (!amount || amount <= 0) return
		topUpMutation.mutate(amount, {
			onSuccess: () => {
				setShowTopUp(false)
				setTopUpAmount('')
			},
		})
	}

	if (isLoading) {
		return (
			<div className="rounded-lg border border-gray-200 bg-white p-6">
				<div className="flex h-20 items-center justify-center">
					<div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
				</div>
			</div>
		)
	}

	if (!credit) {
		return (
			<div className="rounded-lg border border-gray-200 bg-white p-6">
				<p className="text-sm text-t3">Credit information unavailable</p>
			</div>
		)
	}

	const usagePercent = credit.creditLimit > 0 ? (credit.creditUsed / credit.creditLimit) * 100 : 0
	const colors = getWarningColor(credit.warning)

	return (
		<div className="rounded-lg border border-gray-200 bg-white p-6">
			<div className="mb-4">
				<h3 className="text-base font-semibold text-t1">AI Credit Usage</h3>
				<p className="text-sm text-t3">Monitor and manage your AI chatbot credit balance</p>
			</div>

			{/* Warning banner */}
			{credit.warning !== 'None' && (
				<div className={cn('mb-4 rounded-lg px-4 py-3', colors.bg)}>
					<div className="flex items-center gap-2">
						{colors.pulse && (
							<span className="relative flex h-3 w-3">
								<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
								<span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
							</span>
						)}
						<p className={cn('text-sm font-medium', colors.text)}>
							{getWarningLabel(credit.warning)}
						</p>
					</div>
				</div>
			)}

			{/* Plan info */}
			<div className="mb-4 flex items-center gap-2">
				<span className="text-sm text-t3">Current Plan:</span>
				<span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
					{credit.planId}
				</span>
			</div>

			{/* Progress bar */}
			<div className="mb-2">
				<div className="mb-1 flex items-center justify-between">
					<span className="text-sm text-t2">Credit Usage</span>
					<span className="text-sm font-medium text-t1">
						{credit.creditUsed.toLocaleString()} / {credit.creditLimit.toLocaleString()}
					</span>
				</div>
				<div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
					<div
						className={cn(
							'h-full rounded-full transition-all duration-500',
							colors.bar,
							colors.pulse && 'animate-pulse',
						)}
						style={{ width: `${Math.min(usagePercent, 100)}%` }}
					/>
				</div>
			</div>

			{/* Stats */}
			<div className="mb-6 grid grid-cols-2 gap-4">
				<div className="rounded-lg border border-gray-200 p-3 text-center">
					<p className="text-xs text-t3">Credits Used</p>
					<p className="mt-1 text-lg font-semibold text-t1">
						{credit.creditUsed.toLocaleString()}
					</p>
				</div>
				<div className="rounded-lg border border-gray-200 p-3 text-center">
					<p className="text-xs text-t3">Credits Remaining</p>
					<p className={cn('mt-1 text-lg font-semibold', colors.text)}>
						{credit.creditRemaining.toLocaleString()}
					</p>
				</div>
			</div>

			{/* Top-up button */}
			<div className="flex justify-end">
				<Button onClick={() => setShowTopUp(true)}>Top Up Credits</Button>
			</div>

			{/* Top-up dialog */}
			<Dialog open={showTopUp} onOpenChange={setShowTopUp}>
				<DialogClose onClose={() => setShowTopUp(false)} />
				<DialogHeader>
					<DialogTitle>Top Up Credits</DialogTitle>
					<DialogDescription>
						Add more AI credits to your account
					</DialogDescription>
				</DialogHeader>
				<DialogContent>
					<Input
						label="Amount"
						type="number"
						min="1"
						placeholder="Enter credit amount"
						value={topUpAmount}
						onChange={(e) => setTopUpAmount(e.target.value)}
					/>
				</DialogContent>
				<DialogFooter>
					<Button variant="outline" onClick={() => setShowTopUp(false)}>
						Cancel
					</Button>
					<Button
						onClick={handleTopUp}
						loading={topUpMutation.isPending}
						disabled={!topUpAmount || parseInt(topUpAmount, 10) <= 0}
					>
						Confirm Top Up
					</Button>
				</DialogFooter>
			</Dialog>
		</div>
	)
}
