import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '../../../shared/components/ui/Input'
import { Textarea } from '../../../shared/components/ui/Textarea'
import { Button } from '../../../shared/components/ui/Button'

const PatternProjectFormSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100),
  notes: z.string().max(500).optional(),
})

type PatternProjectFormData = z.infer<typeof PatternProjectFormSchema>

interface PatternProjectFormProps {
  onSubmit: (data: PatternProjectFormData) => void
  isSubmitting?: boolean
  onCancel?: () => void
  defaultValues?: Partial<PatternProjectFormData>
}

export function PatternProjectForm({
  onSubmit,
  isSubmitting,
  onCancel,
  defaultValues,
}: PatternProjectFormProps): JSX.Element {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PatternProjectFormData>({
    resolver: zodResolver(PatternProjectFormSchema),
    defaultValues: { name: '', notes: '', ...defaultValues },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Project Name"
        placeholder="e.g. Kwame’s Wedding Suit"
        required
        error={errors.name?.message}
        {...register('name')}
      />
      <Textarea
        label="Notes"
        placeholder="Any special notes about this pattern project…"
        rows={3}
        {...register('notes')}
      />
      <div className="flex gap-2">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} fullWidth>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={isSubmitting} fullWidth>
          Save
        </Button>
      </div>
    </form>
  )
}
