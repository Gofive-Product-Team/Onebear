import { useState, useEffect } from 'react'
import {
	Dialog,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogContent,
	DialogFooter,
	DialogClose,
} from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAddMember } from '@/api/useMembers'
import { useRoles } from '@/api/useRoles'
import { ApiError } from '@/lib/api-client'

interface Props {
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function AddMemberDialog({ open, onOpenChange }: Props) {
	const [email, setEmail] = useState('')
	const [roleId, setRoleId] = useState('')
	const [error, setError] = useState<string | null>(null)

	const { data: roles } = useRoles()
	const addMember = useAddMember()

	// Set default role when roles load
	useEffect(() => {
		if (roles && roles.length > 0 && !roleId) {
			// Default to the first non-owner role, or fallback to first role
			const defaultRole = roles.find((r) => !r.isOwnerRole) ?? roles[0]
			setRoleId(defaultRole.id)
		}
	}, [roles, roleId])

	// Reset state when dialog opens
	useEffect(() => {
		if (open) {
			setEmail('')
			setError(null)
			if (roles && roles.length > 0) {
				const defaultRole = roles.find((r) => !r.isOwnerRole) ?? roles[0]
				setRoleId(defaultRole.id)
			}
		}
	}, [open, roles])

	async function handleAdd() {
		if (!email.trim()) {
			setError('Email is required')
			return
		}
		if (!roleId) {
			setError('Please select a role')
			return
		}
		setError(null)

		try {
			await addMember.mutateAsync({ email: email.trim(), roleId })
			onOpenChange(false)
		} catch (err: unknown) {
			if (err instanceof ApiError) {
				if (err.status === 404) {
					setError('User not found. They must register a Keycloak account first.')
				} else if (err.status === 409) {
					setError('This user is already a member of your team.')
				} else {
					setError(err.message || 'Failed to add member')
				}
			} else {
				setError('Failed to add member')
			}
		}
	}

	// Filter out owner role from the selectable list
	const selectableRoles = roles?.filter((r) => !r.isOwnerRole) ?? []

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogClose onClose={() => onOpenChange(false)} />
			<DialogHeader>
				<DialogTitle>Add Team Member</DialogTitle>
				<DialogDescription>
					Invite a user to your team by their email address.
				</DialogDescription>
			</DialogHeader>
			<DialogContent>
				<div className="space-y-4">
					<Input
						label="Email"
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder="user@example.com"
						error={error && !email.trim() ? 'Email is required' : undefined}
					/>

					<div className="flex flex-col gap-1.5">
						<label className="text-sm font-medium text-t3">Role</label>
						<select
							value={roleId}
							onChange={(e) => setRoleId(e.target.value)}
							className="flex h-9 w-full rounded-md border border-border-input bg-bg-input px-3 py-1 text-sm text-t1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
						>
							{selectableRoles.map((role) => (
								<option key={role.id} value={role.id}>
									{role.name}
								</option>
							))}
						</select>
					</div>

					<p className="text-xs text-t3">
						The user must have a registered Keycloak account before they can be added.
					</p>

					{error && email.trim() && (
						<div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
							{error}
						</div>
					)}
				</div>
			</DialogContent>
			<DialogFooter>
				<Button variant="secondary" onClick={() => onOpenChange(false)}>
					Cancel
				</Button>
				<Button onClick={handleAdd} loading={addMember.isPending}>
					Add Member
				</Button>
			</DialogFooter>
		</Dialog>
	)
}
