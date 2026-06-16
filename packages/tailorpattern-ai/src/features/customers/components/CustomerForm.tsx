import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '../../../shared/components/ui/Input'
import { Textarea } from '../../../shared/components/ui/Textarea'
import { Button } from '../../../shared/components/ui/Button'
import { CustomerFormSchema, type CustomerFormData } from '../types/customer.types'
import type { Customer } from '../types/customer.types'

interface CustomerFormProps {
  defaultValues?: Partial<CustomerFormData>
  onSubmit: (data: CustomerFormData) => void
  isSubmitting?: boolean
  onCancel?: () => void
}

export function CustomerForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  onCancel,
}: CustomerFormProps): JSX.Element {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(CustomerFormSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      notes: '',
      tags: [],
      ...defaultValues,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Full Name"
        placeholder="e.g. Kwame Mensah"
        required
        error={errors.fullName?.message}
        {...register('fullName')}
      />

      <Input
        label="Phone Number"
        type="tel"
        placeholder="e.g. +44 7700 900000"
        error={errors.phone?.message}
        {...register('phone')}
      />

      <Input
        label="Email Address"
        type="email"
        placeholder="e.g. kwame@example.com"
        error={errors.email?.message}
        {...register('email')}
      />

      <Textarea
        label="Notes"
        placeholder="Fitting notes, style preferences, special requirements…"
        rows={3}
        error={errors.notes?.message}
        {...register('notes')}
      />

      <div className="flex gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} fullWidth>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={isSubmitting} fullWidth>
          Save Customer
        </Button>
      </div>
    </form>
  )
}
