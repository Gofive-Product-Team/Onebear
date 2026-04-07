import { useState, useEffect, useMemo } from 'react'
import { cn } from '@one-bear/ui'
import { Sheet, SheetHeader, SheetTitle, SheetContent, SheetClose } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { useCreateRole, useUpdateRole, type RoleItem } from '@/api/useRoles'
import { PERMISSION_GROUPS, ALL_PERMISSION_IDS } from '@/lib/permissions'
import {
	MessageCircle,
	Users,
	Settings,
	UserCog,
	BarChart3,
	Bot,
	Shield,
} from 'lucide-react'

const ICON_MAP: Record<string, typeof MessageCircle> = {
	MessageCircle,
	Users,
	Settings,
	UserCog,
	BarChart3,
	Bot,
}

interface Props {
	mode: 'create' | 'edit'
	role?: RoleItem
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function RoleEditor({ mode, role, open, onOpenChange }: Props) {
	const [name, setName] = useState('')
	const [description, setDescription] = useState('')
	const [selectedPermissions, setSelectedPermissions] = useState<Set<number>>(new Set())
	const [error, setError] = useState<string | null>(null)

	const createRole = useCreateRole()
	const updateRole = useUpdateRole()

	const isOwnerRole = role?.isOwnerRole ?? false
	const isReadOnly = isOwnerRole

	useEffect(() => {
		if (open) {
			if (mode === 'edit' && role) {
				setName(role.name)
				setDescription(role.description ?? '')
				setSelectedPermissions(new Set(role.permissions))
			} else {
				setName('')
				setDescription('')
				setSelectedPermissions(new Set())
			}
			setError(null)
		}
	}, [open, mode, role])

	function togglePermission(permissionId: number) {
		if (isReadOnly) return
		setSelectedPermissions((prev) => {
			const next = new Set(prev)
			if (next.has(permissionId)) {
				next.delete(permissionId)
			} else {
				next.add(permissionId)
			}
			return next
		})
	}

	function toggleModule(modulePermissionIds: number[]) {
		if (isReadOnly) return
		const allSelected = modulePermissionIds.every((id) => selectedPermissions.has(id))
		setSelectedPermissions((prev) => {
			const next = new Set(prev)
			if (allSelected) {
				modulePermissionIds.forEach((id) => next.delete(id))
			} else {
				modulePermissionIds.forEach((id) => next.add(id))
			}
			return next
		})
	}

	const permissionCount = useMemo(
		() => `${selectedPermissions.size}/${ALL_PERMISSION_IDS.length}`,
		[selectedPermissions.size],
	)

	async function handleSave() {
		if (!name.trim()) {
			setError('Role name is required')
			return
		}
		setError(null)

		try {
			if (mode === 'create') {
				await createRole.mutateAsync({
					name: name.trim(),
					description: description.trim() || undefined,
					permissions: Array.from(selectedPermissions),
				})
			} else if (role) {
				await updateRole.mutateAsync({
					roleId: role.id,
					body: {
						name: name.trim(),
						description: description.trim() || undefined,
						permissions: Array.from(selectedPermissions),
					},
				})
			}
			onOpenChange(false)
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Failed to save role'
			setError(message)
		}
	}

	const isPending = createRole.isPending || updateRole.isPending

	return (
		<Sheet open={open} onOpenChange={onOpenChange} side="right">
			<SheetHeader>
				<SheetTitle>
					<div className="flex items-center gap-2">
						<Shield className="h-5 w-5 text-primary" />
						{mode === 'create' ? 'Create Role' : `Edit Role`}
					</div>
				</SheetTitle>
				<SheetClose onClose={() => onOpenChange(false)} />
			</SheetHeader>
			<SheetContent className="p-4">
				<div className="space-y-6">
					{/* Name & Description */}
					<div className="space-y-4">
						<Input
							label="Role Name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="e.g. Supervisor"
							disabled={isReadOnly}
							error={error && !name.trim() ? error : undefined}
						/>
						<Textarea
							label="Description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Optional description for this role"
							disabled={isReadOnly}
							rows={2}
						/>
					</div>

					{/* Permission Count */}
					<div className="flex items-center justify-between">
						<p className="text-sm font-medium text-t1">
							Permissions ({permissionCount})
						</p>
					</div>

					{isOwnerRole && (
						<div className="rounded-md border border-primary/20 bg-primary-alpha px-3 py-2 text-xs text-primary">
							Owner role has all permissions and cannot be modified.
						</div>
					)}

					{/* Permission Groups */}
					<div className="space-y-4">
						{PERMISSION_GROUPS.map((group) => {
							const Icon = ICON_MAP[group.icon]
							const modulePermIds = group.permissions.map((p) => p.id)
							const allChecked = modulePermIds.every((id) => selectedPermissions.has(id))
							const someChecked = modulePermIds.some((id) => selectedPermissions.has(id))

							return (
								<div key={group.module} className="rounded-lg border border-gray-200 bg-white">
									{/* Module Header */}
									<label
										className={cn(
											'flex cursor-pointer items-center gap-3 px-4 py-3',
											isReadOnly && 'cursor-default',
										)}
									>
										<input
											type="checkbox"
											checked={allChecked}
											ref={(el) => {
												if (el) el.indeterminate = someChecked && !allChecked
											}}
											onChange={() => toggleModule(modulePermIds)}
											disabled={isReadOnly}
											className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
										/>
										{Icon && <Icon className="h-4 w-4 text-t2" />}
										<span className="text-sm font-medium text-t1">{group.module}</span>
										<span className="ml-auto text-xs text-t3">
											{modulePermIds.filter((id) => selectedPermissions.has(id)).length}/
											{modulePermIds.length}
										</span>
									</label>

									{/* Individual Permissions */}
									<div className="border-t border-gray-100 px-4 py-2">
										{group.permissions.map((perm) => (
											<label
												key={perm.id}
												className={cn(
													'flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-bg-hover',
													isReadOnly && 'cursor-default hover:bg-transparent',
												)}
											>
												<input
													type="checkbox"
													checked={selectedPermissions.has(perm.id)}
													onChange={() => togglePermission(perm.id)}
													disabled={isReadOnly}
													className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
												/>
												<div className="flex-1">
													<p className="text-sm text-t1">{perm.label}</p>
													<p className="text-xs text-t3">{perm.description}</p>
												</div>
											</label>
										))}
									</div>
								</div>
							)
						})}
					</div>

					{/* Error */}
					{error && name.trim() && (
						<div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
							{error}
						</div>
					)}

					{/* Save Button */}
					{!isReadOnly && (
						<div className="sticky bottom-0 border-t border-border bg-bg-page pt-4">
							<Button onClick={handleSave} loading={isPending} className="w-full">
								{mode === 'create' ? 'Create Role' : 'Save Changes'}
							</Button>
						</div>
					)}
				</div>
			</SheetContent>
		</Sheet>
	)
}
