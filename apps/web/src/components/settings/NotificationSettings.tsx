import { useNotificationPreferences, useUpdateNotificationPreferences, type NotificationPreferences } from '@/api/useNotifications'

interface ToggleRowProps {
	label: string
	description: string
	checked: boolean
	onChange: (checked: boolean) => void
	disabled?: boolean
}

function ToggleRow({ label, description, checked, onChange, disabled }: ToggleRowProps) {
	return (
		<div className="flex items-center justify-between py-4">
			<div className="flex-1 pr-4">
				<p className="text-sm font-medium text-gray-900">{label}</p>
				<p className="text-xs text-gray-500">{description}</p>
			</div>
			<button
				role="switch"
				aria-checked={checked}
				disabled={disabled}
				onClick={() => onChange(!checked)}
				className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
					checked ? 'bg-blue-600' : 'bg-gray-200'
				}`}
			>
				<span className="sr-only">{label}</span>
				<span
					className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
						checked ? 'translate-x-5' : 'translate-x-0'
					}`}
				/>
			</button>
		</div>
	)
}

const NOTIFICATION_ROWS: Array<{
	key: keyof NotificationPreferences
	label: string
	description: string
}> = [
	{
		key: 'pushEnabled',
		label: 'Push Notifications',
		description: 'Receive push notifications in your browser',
	},
	{
		key: 'emailEnabled',
		label: 'Email Notifications',
		description: 'Receive notification summaries via email',
	},
	{
		key: 'soundEnabled',
		label: 'Sound Alerts',
		description: 'Play a sound when new messages arrive',
	},
	{
		key: 'newMessageEnabled',
		label: 'New Messages',
		description: 'Notify when a new message arrives in any room',
	},
	{
		key: 'roomAssignmentEnabled',
		label: 'Room Assignments',
		description: 'Notify when a room is assigned to you',
	},
	{
		key: 'mentionEnabled',
		label: 'Mentions',
		description: 'Notify when someone mentions you in a conversation',
	},
]

export function NotificationSettings() {
	const { data: prefs, isLoading, isError } = useNotificationPreferences()
	const updateMutation = useUpdateNotificationPreferences()

	function handleToggle(key: keyof NotificationPreferences, value: boolean) {
		if (!prefs) return
		updateMutation.mutate({ ...prefs, [key]: value })
	}

	if (isLoading) {
		return (
			<div className="flex h-48 items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
			</div>
		)
	}

	if (isError || !prefs) {
		return (
			<div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
				Failed to load notification preferences. Please try again.
			</div>
		)
	}

	return (
		<div className="space-y-4">
			<div>
				<h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
				<p className="text-sm text-gray-500">Choose how and when you receive notifications</p>
			</div>

			<div className="rounded-lg border border-gray-200 bg-white px-6 divide-y divide-gray-100">
				{NOTIFICATION_ROWS.map((row) => (
					<ToggleRow
						key={row.key}
						label={row.label}
						description={row.description}
						checked={prefs[row.key]}
						onChange={(value) => handleToggle(row.key, value)}
						disabled={updateMutation.isPending}
					/>
				))}
			</div>
		</div>
	)
}
