import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Input } from '../../../shared/components/ui/Input'
import { Textarea } from '../../../shared/components/ui/Textarea'
import { Button } from '../../../shared/components/ui/Button'
import { MeasurementField } from './MeasurementField'
import { MeasurementProgressBar } from './MeasurementProgressBar'
import { MeasurementFormSchema, type MeasurementFormData } from '../types/measurement.types'
import { MEASUREMENT_SECTIONS_MAP } from '../engine/constants'
import { validateMeasurements } from '../engine/validation'

interface MeasurementFormProps {
  onSubmit: (data: MeasurementFormData) => void
  isSubmitting?: boolean
  onCancel?: () => void
  defaultValues?: Partial<MeasurementFormData>
  onSectionChange?: (section: string) => void
}

export function MeasurementForm({
  onSubmit,
  isSubmitting,
  onCancel,
  defaultValues,
  onSectionChange,
}: MeasurementFormProps): JSX.Element {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'Upper Body': true,
    'Neck & Collar': false,
    'Arms & Sleeves': false,
    'Torso Lengths': false,
    'Lower Body': false,
  })

  const { register, handleSubmit, control, watch, formState: { errors } } =
    useForm<MeasurementFormData>({
      resolver: zodResolver(MeasurementFormSchema),
      defaultValues: {
        label: `Measurements — ${new Date().toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`,
        takenAt: new Date().toISOString().split('T')[0] ?? new Date().toISOString(),
        unit: 'cm',
        measurements: { unit: 'cm' },
        ...defaultValues,
      },
    })

  const unit = watch('unit')
  const measurements = watch('measurements')
  const warnings = validateMeasurements(measurements, unit)
  const warningMap = Object.fromEntries(warnings.map(w => [w.field, w.message]))

  const toggleSection = (section: string): void => {
    const willOpen = !openSections[section]
    setOpenSections(prev => ({ ...prev, [section]: willOpen }))
    if (willOpen) onSectionChange?.(section)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Meta section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-text-primary">Measurement Info</h3>
        <Input
          label="Label"
          required
          error={errors.label?.message}
          {...register('label')}
        />
        <Input
          label="Date Taken"
          type="date"
          {...register('takenAt')}
        />
        <div>
          <p className="text-sm font-medium text-text-primary mb-2">Unit</p>
          <div className="flex gap-2">
            {(['cm', 'inches'] as const).map(u => (
              <label key={u} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" value={u} {...register('unit')} className="accent-brand-navy" />
                <span className="text-sm">{u}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Measurement sections */}
      {Object.entries(MEASUREMENT_SECTIONS_MAP).map(([section, fields]) => (
        <div key={section} className="border border-surface-muted rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection(section)}
            className="w-full flex items-center justify-between px-4 py-3 bg-surface-subtle text-sm font-semibold text-text-primary hover:bg-surface-muted transition-colors"
          >
            {section}
            {openSections[section] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          {openSections[section] && (
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {fields.map(field => (
                <Controller
                  key={field.key}
                  name={`measurements.${field.key}` as keyof MeasurementFormData}
                  control={control}
                  render={({ field: formField }) => (
                    <MeasurementField
                      field={field}
                      value={formField.value as number | undefined}
                      unit={unit}
                      onChange={val => formField.onChange(val)}
                      warning={warningMap[field.key]}
                    />
                  )}
                />
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Posture notes */}
      <Textarea
        label="Posture & Fitting Notes"
        placeholder="e.g. Slightly forward posture, right shoulder slightly higher, prefers slim fit…"
        rows={3}
        {...register('postureNotes')}
      />

      {warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-xs font-medium text-amber-700 mb-1">Measurement warnings</p>
          <ul className="text-xs text-amber-600 space-y-0.5">
            {warnings.map(w => (
              <li key={w.field}>• {w.message}</li>
            ))}
          </ul>
        </div>
      )}

      <MeasurementProgressBar measurements={measurements} />

      <div className="flex gap-2">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} fullWidth>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={isSubmitting} fullWidth>
          Save Measurements
        </Button>
      </div>
    </form>
  )
}
