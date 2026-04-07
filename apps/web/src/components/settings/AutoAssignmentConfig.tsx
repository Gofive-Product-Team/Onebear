import { useState, useEffect } from 'react'
import { cn } from '@one-bear/ui'
import {
	useIntegrations,
	useAutoAssignment,
	useUpdateAutoAssignment,
	useUsers,
} from '@/api/useIntegrations'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'

export function AutoAssignmentConfig() {
	const { data: integrations, isLoading: loadingIntegrations } = useIntegrations()
	const [selectedIntegrationId, setSelectedIntegrationId] = useState('')
	const { data: config, isLoading: loadingConfig } = useAutoAssignment(selectedIntegrationId)
	const updateMutation = useUpdateAutoAssignment(selectedIntegrationId)
	const { data: users } = useUsers()

	const [enabled, setEnabled] = useState(false)
	const [mode, setMode] = useState<'round-robin'>('round-robin')
	const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([])
	const [hasChanges, setHasChanges] = useState(false)

	// Sync local state when config loads
	useEffect(() => {
		if (config) {
			setEnabled(config.enabled)
			setMode(config.mode)
			setSelectedAgentIds(config.agentIds)
			setHasChanges(false)
		}
	}, [config])

	function handleToggleAgent(agentId: string) {
		setSelectedAgentIds((prev) =>
			prev.includes(agentId)
				? prev.filter((id) => id !== agentId)
				: [...prev, agentId],
		)
		setHasChanges(true)
	}

	function handleSave() {
		updateMutation.mutate(
			{ enabled, mode, agentIds: selectedAgentIds },
			{ onSuccess: () => setHasChanges(false) },
		)
	}

	return (
		<div className="space-y-4">
			<div>
				<h2 className="text-lg font-semibold text-gray-900">Auto Assignment</h2>
				<p className="text-sm text-gray-500">
					Automatically assign incoming conversations to agents
				</p>
			</div>

			{/* Integration selector */}
			<div className="flex flex-col gap-1.5">
				<label className="text-sm font-medium text-gray-700">Select Integration</label>
				<select
					value={selectedIntegrationId}
					onChange={(e) => setSelectedIntegrationId(e.target.value)}
					className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
					disabled={loadingIntegrations}
				>
					<option value="">Choose an integration...</option>
					{integrations?.map((int) => (
						<option key={int.id} value={int.id}>
							{int.name} ({int.platform})
						</option>
					))}
				</select>
			</div>

			{!selectedIntegrationId && (
				<div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
					Select an integration above to configure auto assignment
				</div>
			)}

			{selectedIntegrationId && loadingConfig && (
				<div className="flex h-32 items-center justify-center">
					<div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
				</div>
			)}

			{selectedIntegrationId && !loadingConfig && (
				<div className="space-y-6 rounded-lg border border-gray-200 bg-white p-6">
					{/* Enable toggle */}
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium text-gray-900">Enable Auto Assignment</p>
							<p className="text-xs text-gray-500">
								Automatically assign new conversations to available agents
							</p>
						</div>
						<button
							type="button"
							onClick={() => {
								setEnabled(!enabled)
								setHasChanges(true)
							}}
							className={cn(
								'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors',
								enabled ? 'bg-blue-600' : 'bg-gray-300',
							)}
						>
							<span
								className={cn(
									'inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow-sm transition-transform',
									enabled ? 'translate-x-5' : 'translate-x-0.5',
								)}
							/>
						</button>
					</div>

					{/* Mode selector */}
					<div
						className={cn(
							'space-y-3 transition-opacity',
							!enabled && 'pointer-events-none opacity-50',
						)}
					>
						<div className="flex flex-col gap-1.5">
							<label className="text-sm font-medium text-gray-700">
								Assignment Mode
							</label>
							<select
								value={mode}
								onChange={(e) => {
									setMode(e.target.value as 'round-robin')
									setHasChanges(true)
								}}
								className="h-9 w-full max-w-xs rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
							>
								<option value="round-robin">Round Robin</option>
							</select>
							<p className="text-xs text-gray-500">
								Round Robin distributes conversations evenly across selected agents
							</p>
						</div>

						{/* Agent list */}
						<div className="flex flex-col gap-1.5">
							<label className="text-sm font-medium text-gray-700">
								Agents ({selectedAgentIds.length} selected)
							</label>
							<div className="max-h-64 space-y-1 overflow-y-auto rounded-md border border-gray-200 p-2">
								{(Array.isArray(users) ? users : []).map((user) => {
									const isSelected = selectedAgentIds.includes(user.id)
									return (
										<label
											key={user.id}
											className={cn(
												'flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 transition-colors',
												isSelected ? 'bg-blue-50' : 'hover:bg-gray-50',
											)}
										>
											<input
												type="checkbox"
												checked={isSelected}
												onChange={() => handleToggleAgent(user.id)}
												className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
											/>
											<Avatar
												fallback={(user.displayName ?? user.email ?? '?').slice(0, 2)}
												size="sm"
											/>
											<div className="min-w-0 flex-1">
												<p className="text-sm font-medium text-gray-900">
													{user.displayName ?? user.email}
												</p>
												<p className="truncate text-xs text-gray-500">
													{user.email}
												</p>
											</div>
										</label>
									)
								})}

								{(!users || users.length === 0) && (
									<p className="py-4 text-center text-sm text-gray-500">
										No agents found
									</p>
								)}
							</div>
						</div>
					</div>

					{/* Save button */}
					<div className="flex justify-end">
						<Button
							onClick={handleSave}
							loading={updateMutation.isPending}
							disabled={!hasChanges}
						>
							Save Changes
						</Button>
					</div>
				</div>
			)}
		</div>
	)
}
