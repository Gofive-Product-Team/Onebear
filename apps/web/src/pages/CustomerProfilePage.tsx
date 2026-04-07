import { useNavigate } from '@tanstack/react-router'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { Tabs, TabList, Tab, TabPanel } from '@/components/ui/Tabs'
import { useCustomer } from '@/api/useCustomers'
import { GeneralInfoTab } from '@/components/customer/profile/GeneralInfoTab'
import { OrderHistoryTab } from '@/components/customer/profile/OrderHistoryTab'
import { ConversationHistoryTab } from '@/components/customer/profile/ConversationHistoryTab'
import { ActivityLogTab } from '@/components/customer/profile/ActivityLogTab'

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function ProfileSkeleton() {
	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Skeleton className="h-16 w-16 rounded-full" />
				<div className="flex-1 space-y-2">
					<Skeleton className="h-5 w-40" />
					<Skeleton className="h-4 w-24" />
				</div>
			</div>
			<div className="flex gap-2">
				{Array.from({ length: 4 }).map((_, i) => (
					<Skeleton key={i} className="h-9 w-32 rounded-md" />
				))}
			</div>
			<div className="space-y-3">
				<Skeleton className="h-24 rounded-lg" />
				<Skeleton className="h-16 rounded-lg" />
				<Skeleton className="h-32 rounded-lg" />
			</div>
		</div>
	)
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
	customerId: string
}

export function CustomerProfilePage({ customerId }: Props) {
	const navigate = useNavigate()
	const { data: customer, isLoading, isError } = useCustomer(customerId)

	return (
		<div className="mx-auto max-w-4xl space-y-6 pb-20">
			{/* Back button */}
			<div>
				<Button
					variant="outline"
					size="sm"
					onClick={() => navigate({ to: '/customer' })}
					className="flex items-center gap-1.5"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="h-4 w-4"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="M19 12H5" />
						<path d="M12 5l-7 7 7 7" />
					</svg>
					Back to Customers
				</Button>
			</div>

			{/* Loading */}
			{isLoading && <ProfileSkeleton />}

			{/* Error */}
			{isError && (
				<div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-bg-card py-16 text-center">
					<p className="text-sm text-t2">Could not load customer profile.</p>
					<Button variant="outline" size="sm" onClick={() => navigate({ to: '/customer' })}>
						Back to list
					</Button>
				</div>
			)}

			{/* Profile content */}
			{customer && !isLoading && (
				<Tabs defaultValue="general">
					{/* Tab list */}
					<TabList className="w-full sm:w-auto">
						<Tab value="general">General Info</Tab>
						<Tab value="orders">Order History</Tab>
						<Tab value="conversations">Conversations</Tab>
						<Tab value="activity">Activity Log</Tab>
					</TabList>

					{/* Tab panels */}
					<TabPanel value="general" className="mt-6">
						<GeneralInfoTab customer={customer} />
					</TabPanel>

					<TabPanel value="orders" className="mt-6">
						<OrderHistoryTab customer={customer} />
					</TabPanel>

					<TabPanel value="conversations" className="mt-6">
						<ConversationHistoryTab customer={customer} />
					</TabPanel>

					<TabPanel value="activity" className="mt-6">
						<ActivityLogTab customerId={customer.id} />
					</TabPanel>
				</Tabs>
			)}
		</div>
	)
}
