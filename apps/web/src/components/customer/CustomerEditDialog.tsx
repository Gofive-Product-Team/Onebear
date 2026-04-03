import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useUpdateCustomer, type CustomerDetail } from '@/api/useCustomers'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'

const customerSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	email: z
		.string()
		.optional()
		.transform((v) => v ?? '')
		.refine((v) => v === '' || z.string().email().safeParse(v).success, { message: 'Invalid email address' }),
	phone: z.string().optional(),
	notes: z.string().optional(),
})

type CustomerFormValues = z.infer<typeof customerSchema>

export function CustomerEditDialog({
	customer,
	onClose,
}: {
	customer: CustomerDetail
	onClose: () => void
}) {
	const updateMutation = useUpdateCustomer()

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<CustomerFormValues>({
		resolver: zodResolver(customerSchema),
		defaultValues: {
			name: customer.name,
			email: customer.email ?? '',
			phone: customer.phone ?? '',
			notes: customer.notes ?? '',
		},
	})

	function onSubmit(values: CustomerFormValues) {
		updateMutation.mutate(
			{
				customerId: customer.id,
				body: {
					name: values.name,
					email: values.email || undefined,
					phone: values.phone || undefined,
					notes: values.notes || undefined,
				},
			},
			{
				onSuccess: () => onClose(),
			},
		)
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
			<div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
				<div className="mb-4 flex items-center justify-between">
					<h3 className="text-lg font-semibold text-gray-900">Edit Customer</h3>
					<button
						onClick={onClose}
						className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
					>
						<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					<div className="flex flex-col gap-1.5">
						<Input
							label="Name"
							placeholder="Customer name"
							{...register('name')}
						/>
						{errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
					</div>

					<div className="flex flex-col gap-1.5">
						<Input
							label="Email"
							type="email"
							placeholder="customer@example.com"
							{...register('email')}
						/>
						{errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
					</div>

					<div className="flex flex-col gap-1.5">
						<Input
							label="Phone"
							type="tel"
							placeholder="+66 81 234 5678"
							{...register('phone')}
						/>
						{errors.phone && <p className="text-xs text-red-600">{errors.phone.message}</p>}
					</div>

					<div className="flex flex-col gap-1.5">
						<Textarea
							label="Notes"
							placeholder="Internal notes about this customer..."
							rows={3}
							{...register('notes')}
						/>
						{errors.notes && <p className="text-xs text-red-600">{errors.notes.message}</p>}
					</div>

					<div className="flex justify-end gap-2 pt-2">
						<Button type="button" variant="outline" onClick={onClose}>
							Cancel
						</Button>
						<Button type="submit" loading={updateMutation.isPending}>
							Save Changes
						</Button>
					</div>
				</form>
			</div>
		</div>
	)
}
