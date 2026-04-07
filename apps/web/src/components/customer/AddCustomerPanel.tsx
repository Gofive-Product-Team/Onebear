import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { cn } from '@one-bear/ui'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Sheet, SheetHeader, SheetTitle, SheetContent, SheetClose } from '@/components/ui/Sheet'
import { useCreateCustomer, useCheckDuplicate } from '@/api/useCustomers'

const schema = z.object({
	name: z.string().min(1, 'Name is required'),
	email: z.string().email('Invalid email').optional().or(z.literal('')),
	phone: z.string().optional(),
	customerType: z.enum(['Individual', 'Organization']),
})

type FormValues = z.infer<typeof schema>

interface Props {
	open: boolean
	onOpenChange: (open: boolean) => void
	/** Pre-fill name from the search no-results prompt */
	initialName?: string
}

// ─── Duplicate warning state ──────────────────────────────────────────────────

interface DuplicateWarning {
	field: 'name' | 'email' | 'phone'
	matchId: string
	matchName: string
}

// ─── Duplicate warning banner ─────────────────────────────────────────────────

interface DuplicateWarningBannerProps {
	warning: DuplicateWarning
	onViewProfile: (id: string) => void
	onAddAnyway: () => void
}

function DuplicateWarningBanner({ warning, onViewProfile, onAddAnyway }: DuplicateWarningBannerProps) {
	return (
		<div className="flex flex-col gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
			<p>
				<span aria-hidden="true" className="mr-1">⚠️</span>
				A customer with matching <strong>{warning.field}</strong> already exists —{' '}
				<strong>{warning.matchName}</strong>
			</p>
			<div className="flex gap-2">
				<button
					type="button"
					onClick={() => onViewProfile(warning.matchId)}
					className="rounded px-2 py-0.5 text-xs font-semibold text-amber-900 underline underline-offset-2 hover:text-amber-700"
				>
					View Profile
				</button>
				<button
					type="button"
					onClick={onAddAnyway}
					className="rounded px-2 py-0.5 text-xs font-medium text-amber-700 hover:text-amber-900"
				>
					Add Anyway
				</button>
			</div>
		</div>
	)
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AddCustomerPanel({ open, onOpenChange, initialName }: Props) {
	const createCustomer = useCreateCustomer()
	const checkDuplicate = useCheckDuplicate()
	const [duplicateWarning, setDuplicateWarning] = useState<DuplicateWarning | null>(null)
	const [addAnyway, setAddAnyway] = useState(false)

	const {
		register,
		handleSubmit,
		reset,
		setValue,
		formState: { errors, isSubmitting },
	} = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: { customerType: 'Individual' },
	})

	// Pre-fill name when opened from "Add new customer '{term}'" prompt
	useEffect(() => {
		if (open && initialName) {
			setValue('name', initialName)
		}
	}, [open, initialName, setValue])

	// Reset form on close
	useEffect(() => {
		if (!open) {
			reset({ customerType: 'Individual' })
			setDuplicateWarning(null)
			setAddAnyway(false)
		}
	}, [open, reset])

	async function checkField(field: 'name' | 'email' | 'phone', value: string) {
		if (!value.trim() || addAnyway) return
		const result = await checkDuplicate.mutateAsync({ [field]: value.trim() })
		if (result.hasDuplicate && result.matches.length > 0) {
			const match = result.matches[0]
			setDuplicateWarning({ field, matchId: match.id, matchName: match.name })
		} else if (duplicateWarning?.field === field) {
			setDuplicateWarning(null)
		}
	}

	function handleViewProfile(id: string) {
		// Navigate to customer profile — use window for simplicity since we don't have router access here
		window.location.href = `/customer/${id}`
	}

	function handleAddAnyway() {
		setDuplicateWarning(null)
		setAddAnyway(true)
	}

	async function onSubmit(values: FormValues) {
		await createCustomer.mutateAsync({
			name: values.name,
			email: values.email || undefined,
			phone: values.phone || undefined,
			customerType: values.customerType,
		})
		onOpenChange(false)
	}

	return (
		<Sheet open={open} onOpenChange={onOpenChange} side="right">
			<SheetHeader>
				<SheetTitle>Add Customer</SheetTitle>
				<SheetClose onClose={() => onOpenChange(false)} />
			</SheetHeader>

			<SheetContent>
				<form
					id="add-customer-form"
					onSubmit={handleSubmit(onSubmit)}
					noValidate
					className="flex flex-col gap-5 p-4"
				>
					{/* Name */}
					<div className="flex flex-col gap-1.5">
						<label htmlFor="ac-name" className="text-sm font-medium text-t1">
							Name <span className="text-error">*</span>
						</label>
						<Input
							id="ac-name"
							placeholder="Customer name"
							aria-invalid={!!errors.name}
							{...register('name', {
								onBlur: (e) => checkField('name', e.target.value),
							})}
						/>
						{errors.name && (
							<p className="text-xs text-error">{errors.name.message}</p>
						)}
						{duplicateWarning?.field === 'name' && (
							<DuplicateWarningBanner
								warning={duplicateWarning}
								onViewProfile={handleViewProfile}
								onAddAnyway={handleAddAnyway}
							/>
						)}
					</div>

					{/* Email */}
					<div className="flex flex-col gap-1.5">
						<label htmlFor="ac-email" className="text-sm font-medium text-t1">
							Email
						</label>
						<Input
							id="ac-email"
							type="email"
							placeholder="customer@example.com"
							aria-invalid={!!errors.email}
							{...register('email', {
								onBlur: (e) => checkField('email', e.target.value),
							})}
						/>
						{errors.email && (
							<p className="text-xs text-error">{errors.email.message}</p>
						)}
						{duplicateWarning?.field === 'email' && (
							<DuplicateWarningBanner
								warning={duplicateWarning}
								onViewProfile={handleViewProfile}
								onAddAnyway={handleAddAnyway}
							/>
						)}
					</div>

					{/* Phone */}
					<div className="flex flex-col gap-1.5">
						<label htmlFor="ac-phone" className="text-sm font-medium text-t1">
							Phone
						</label>
						<Input
							id="ac-phone"
							type="tel"
							placeholder="+66 8x xxx xxxx"
							{...register('phone', {
								onBlur: (e) => checkField('phone', e.target.value),
							})}
						/>
						{duplicateWarning?.field === 'phone' && (
							<DuplicateWarningBanner
								warning={duplicateWarning}
								onViewProfile={handleViewProfile}
								onAddAnyway={handleAddAnyway}
							/>
						)}
					</div>

					{/* Customer Type */}
					<div className="flex flex-col gap-1.5">
						<label htmlFor="ac-type" className="text-sm font-medium text-t1">
							Customer Type
						</label>
						<select
							id="ac-type"
							{...register('customerType')}
							className={cn(
								'h-9 rounded-md border border-border-input bg-bg-input px-3 text-sm text-t1',
								'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
							)}
						>
							<option value="Individual">Individual</option>
							<option value="Organization">Organization</option>
						</select>
					</div>

					{/* API error */}
					{createCustomer.isError && (
						<div className="rounded-md border border-error bg-error-bg p-3 text-sm text-error">
							Failed to create customer. Please try again.
						</div>
					)}
				</form>
			</SheetContent>

			{/* Footer */}
			<div className="flex gap-3 border-t border-border p-4">
				<Button
					type="button"
					variant="outline"
					className="flex-1"
					onClick={() => onOpenChange(false)}
				>
					Cancel
				</Button>
				<Button
					type="submit"
					form="add-customer-form"
					className="flex-1"
					loading={isSubmitting || createCustomer.isPending}
				>
					Add Customer
				</Button>
			</div>
		</Sheet>
	)
}
