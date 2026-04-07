import { useState } from 'react'
import { cn } from '@one-bear/ui'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
	Dialog,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogContent,
	DialogFooter,
	DialogClose,
} from '@/components/ui/Dialog'
import { useMembers, useUpdateMember, useRemoveMember, type MemberItem } from '@/api/useMembers'
import { useRoles, useDeleteRole, type RoleItem } from '@/api/useRoles'
import { ALL_PERMISSION_IDS } from '@/lib/permissions'
import { RoleEditor } from './RoleEditor'
import { AddMemberDialog } from './AddMemberDialog'
import {
	Crown,
	Shield,
	Trash2,
	Plus,
	Edit2,
	Eye,
	UserPlus,
} from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────

function getInitials(name: string | null, email: string): string {
	if (name) {
		const parts = name.trim().split(/\s+/)
		return parts
			.slice(0, 2)
			.map((p) => p[0])
			.join('')
			.toUpperCase()
	}
	return email[0].toUpperCase()
}

const AVATAR_COLORS = [
	'bg-blue-500',
	'bg-emerald-500',
	'bg-purple-500',
	'bg-amber-500',
	'bg-rose-500',
	'bg-cyan-500',
	'bg-indigo-500',
	'bg-pink-500',
]

function getAvatarColor(id: string): string {
	let hash = 0
	for (let i = 0; i < id.length; i++) {
		hash = (hash << 5) - hash + id.charCodeAt(i)
		hash |= 0
	}
	return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function formatRelativeTime(timestamp: number | null): string {
	if (!timestamp) return 'Never'
	const diff = Date.now() - timestamp
	const minutes = Math.floor(diff / 60_000)
	if (minutes < 1) return 'Just now'
	if (minutes < 60) return `${minutes}m ago`
	const hours = Math.floor(minutes / 60)
	if (hours < 24) return `${hours}h ago`
	const days = Math.floor(hours / 24)
	if (days < 30) return `${days}d ago`
	return new Date(timestamp).toLocaleDateString()
}

// ─── MemberRow ────────────────────────────────────────────

function MemberRow({
	member,
	roles,
	isOwner,
	onUpdateRole,
	onRemove,
	isUpdating,
}: {
	member: MemberItem
	roles: RoleItem[]
	isOwner: boolean
	onUpdateRole: (memberId: string, roleId: string) => void
	onRemove: (member: MemberItem) => void
	isUpdating: boolean
}) {
	const initials = getInitials(member.displayName, member.email)
	const avatarColor = getAvatarColor(member.id)
	const selectableRoles = roles.filter((r) => !r.isOwnerRole)

	return (
		<div className="flex items-center gap-3 px-4 py-3">
			{/* Avatar */}
			<div
				className={cn(
					'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-medium text-white',
					avatarColor,
				)}
			>
				{initials}
			</div>

			{/* Info */}
			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-2">
					<p className="truncate text-sm font-medium text-t1">
						{member.displayName ?? member.email}
					</p>
					{isOwner && <Crown className="h-3.5 w-3.5 shrink-0 text-amber-500" />}
					{!member.isActive && (
						<Badge variant="secondary" className="text-[10px]">
							Inactive
						</Badge>
					)}
				</div>
				<p className="truncate text-xs text-t3">{member.email}</p>
			</div>

			{/* Role Badge / Dropdown */}
			<div className="shrink-0">
				{isOwner ? (
					<Badge variant="warning">{member.roleName}</Badge>
				) : (
					<select
						value={member.roleId}
						onChange={(e) => onUpdateRole(member.id, e.target.value)}
						disabled={isUpdating}
						className="rounded-md border border-border-input bg-bg-input px-2 py-1 text-xs text-t1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
					>
						{selectableRoles.map((role) => (
							<option key={role.id} value={role.id}>
								{role.name}
							</option>
						))}
					</select>
				)}
			</div>

			{/* Status */}
			<div className="hidden shrink-0 items-center gap-1.5 sm:flex">
				<div
					className={cn(
						'h-2 w-2 rounded-full',
						member.isActive ? 'bg-green-500' : 'bg-gray-300',
					)}
				/>
				<span className="text-xs text-t3">
					{formatRelativeTime(member.lastLoginTimestamp)}
				</span>
			</div>

			{/* Remove button */}
			{!isOwner && (
				<button
					type="button"
					onClick={() => onRemove(member)}
					disabled={isUpdating}
					className="shrink-0 rounded-md p-1.5 text-t3 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
					aria-label={`Remove ${member.displayName ?? member.email}`}
				>
					<Trash2 className="h-4 w-4" />
				</button>
			)}
		</div>
	)
}

// ─── RoleRow ──────────────────────────────────────────────

function RoleRow({
	role,
	onEdit,
	onDelete,
}: {
	role: RoleItem
	onEdit: (role: RoleItem) => void
	onDelete: (role: RoleItem) => void
}) {
	const permCount = `${(role.permissions?.length ?? 0)}/${ALL_PERMISSION_IDS.length}`

	return (
		<div className="flex items-center gap-3 px-4 py-3">
			{/* Icon */}
			<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bg-input">
				{role.isOwnerRole ? (
					<Crown className="h-4 w-4 text-amber-500" />
				) : (
					<Shield className="h-4 w-4 text-t2" />
				)}
			</div>

			{/* Info */}
			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-2">
					<p className="text-sm font-medium text-t1">{role.name}</p>
					{role.isSystem && (
						<Badge variant="secondary" className="text-[10px]">
							System
						</Badge>
					)}
				</div>
				<p className="text-xs text-t3">
					{role.description ?? `${permCount} permissions`}
				</p>
			</div>

			{/* Permission count */}
			<span className="hidden shrink-0 text-xs text-t3 sm:block">{permCount}</span>

			{/* Actions */}
			<div className="flex shrink-0 items-center gap-1">
				{role.isOwnerRole ? (
					<Button variant="ghost" size="sm" onClick={() => onEdit(role)}>
						<Eye className="h-3.5 w-3.5" />
						<span className="hidden sm:inline">View</span>
					</Button>
				) : (
					<>
						<Button variant="ghost" size="sm" onClick={() => onEdit(role)}>
							<Edit2 className="h-3.5 w-3.5" />
							<span className="hidden sm:inline">Edit</span>
						</Button>
						{!role.isSystem && (
							<button
								type="button"
								onClick={() => onDelete(role)}
								className="rounded-md p-1.5 text-t3 transition-colors hover:bg-red-50 hover:text-red-500"
								aria-label={`Delete ${role.name}`}
							>
								<Trash2 className="h-4 w-4" />
							</button>
						)}
					</>
				)}
			</div>
		</div>
	)
}

// ─── TeamTab ──────────────────────────────────────────────

export function TeamTab() {
	const { data: members, isLoading: membersLoading, isError: membersError } = useMembers()
	const { data: roles, isLoading: rolesLoading, isError: rolesError } = useRoles()
	const updateMember = useUpdateMember()
	const removeMember = useRemoveMember()
	const deleteRole = useDeleteRole()

	const [addMemberOpen, setAddMemberOpen] = useState(false)
	const [roleEditorOpen, setRoleEditorOpen] = useState(false)
	const [roleEditorMode, setRoleEditorMode] = useState<'create' | 'edit'>('create')
	const [editingRole, setEditingRole] = useState<RoleItem | undefined>()
	const [confirmRemoveMember, setConfirmRemoveMember] = useState<MemberItem | null>(null)
	const [confirmDeleteRole, setConfirmDeleteRole] = useState<RoleItem | null>(null)

	function handleEditRole(role: RoleItem) {
		setEditingRole(role)
		setRoleEditorMode('edit')
		setRoleEditorOpen(true)
	}

	function handleCreateRole() {
		setEditingRole(undefined)
		setRoleEditorMode('create')
		setRoleEditorOpen(true)
	}

	function handleUpdateRole(memberId: string, roleId: string) {
		updateMember.mutate({ id: memberId, body: { roleId } })
	}

	async function handleConfirmRemove() {
		if (!confirmRemoveMember) return
		await removeMember.mutateAsync(confirmRemoveMember.id)
		setConfirmRemoveMember(null)
	}

	async function handleConfirmDeleteRole() {
		if (!confirmDeleteRole) return
		await deleteRole.mutateAsync(confirmDeleteRole.id)
		setConfirmDeleteRole(null)
	}

	// Determine which members are owners (by checking their role's isOwnerRole flag)
	const ownerRoleId = roles?.find((r) => r.isOwnerRole)?.id

	const isLoading = membersLoading || rolesLoading

	if (isLoading) {
		return (
			<div className="flex h-48 items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
			</div>
		)
	}

	if (membersError || rolesError) {
		return (
			<div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
				Failed to load team data. Please try again.
			</div>
		)
	}

	return (
		<div className="space-y-8">
			{/* ── Members Section ────────────────────────── */}
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<div>
						<h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
						<p className="text-sm text-gray-500">
							{members?.length ?? 0} member{(members?.length ?? 0) !== 1 ? 's' : ''}
						</p>
					</div>
					<Button size="sm" onClick={() => setAddMemberOpen(true)}>
						<UserPlus className="h-4 w-4" />
						Add Member
					</Button>
				</div>

				<div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
					{members && members.length > 0 ? (
						members.map((member) => (
							<MemberRow
								key={member.id}
								member={member}
								roles={roles ?? []}
								isOwner={member.roleId === ownerRoleId}
								onUpdateRole={handleUpdateRole}
								onRemove={setConfirmRemoveMember}
								isUpdating={updateMember.isPending}
							/>
						))
					) : (
						<div className="px-4 py-8 text-center text-sm text-t3">
							No team members yet. Add your first member to get started.
						</div>
					)}
				</div>
			</div>

			{/* ── Roles Section ──────────────────────────── */}
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<div>
						<h2 className="text-lg font-semibold text-gray-900">Roles</h2>
						<p className="text-sm text-gray-500">
							Manage roles and their permissions
						</p>
					</div>
					<Button size="sm" onClick={handleCreateRole}>
						<Plus className="h-4 w-4" />
						Create Role
					</Button>
				</div>

				<div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
					{roles && roles.length > 0 ? (
						roles.map((role) => (
							<RoleRow
								key={role.id}
								role={role}
								onEdit={handleEditRole}
								onDelete={setConfirmDeleteRole}
							/>
						))
					) : (
						<div className="px-4 py-8 text-center text-sm text-t3">
							No roles configured.
						</div>
					)}
				</div>
			</div>

			{/* ── Dialogs ────────────────────────────────── */}

			<AddMemberDialog open={addMemberOpen} onOpenChange={setAddMemberOpen} />

			<RoleEditor
				mode={roleEditorMode}
				role={editingRole}
				open={roleEditorOpen}
				onOpenChange={setRoleEditorOpen}
			/>

			{/* Remove Member Confirmation */}
			<Dialog
				open={confirmRemoveMember !== null}
				onOpenChange={(open) => {
					if (!open) setConfirmRemoveMember(null)
				}}
			>
				<DialogClose onClose={() => setConfirmRemoveMember(null)} />
				<DialogHeader>
					<DialogTitle>Remove Member</DialogTitle>
					<DialogDescription>
						Are you sure you want to remove{' '}
						<strong>{confirmRemoveMember?.displayName ?? confirmRemoveMember?.email}</strong>{' '}
						from your team? They will lose access to all company data.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="secondary" onClick={() => setConfirmRemoveMember(null)}>
						Cancel
					</Button>
					<Button
						variant="destructive"
						onClick={handleConfirmRemove}
						loading={removeMember.isPending}
					>
						Remove
					</Button>
				</DialogFooter>
			</Dialog>

			{/* Delete Role Confirmation */}
			<Dialog
				open={confirmDeleteRole !== null}
				onOpenChange={(open) => {
					if (!open) setConfirmDeleteRole(null)
				}}
			>
				<DialogClose onClose={() => setConfirmDeleteRole(null)} />
				<DialogHeader>
					<DialogTitle>Delete Role</DialogTitle>
					<DialogDescription>
						Are you sure you want to delete the role{' '}
						<strong>{confirmDeleteRole?.name}</strong>? Members with this role will need
						to be reassigned.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="secondary" onClick={() => setConfirmDeleteRole(null)}>
						Cancel
					</Button>
					<Button
						variant="destructive"
						onClick={handleConfirmDeleteRole}
						loading={deleteRole.isPending}
					>
						Delete
					</Button>
				</DialogFooter>
			</Dialog>
		</div>
	)
}
