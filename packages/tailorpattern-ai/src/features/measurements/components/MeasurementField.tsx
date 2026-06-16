import { type ChangeEvent } from 'react'
import { HelpCircle, CheckCircle, AlertTriangle } from 'lucide-react'
import { Tooltip } from '../../../shared/components/ui/Tooltip'
import { cn } from '../../../shared/utils/cn'
import type { FieldDefinition } from '../engine/constants'

interface MeasurementFieldProps {
  field: FieldDefinition
  value: number | undefined
  unit: 'cm' | 'inches'
  onChange: (value: number | undefined) => void
  warning?: string
}

export function MeasurementField({
  field,
  value,
  unit,
  onChange,
  warning,
}: MeasurementFieldProps): JSX.Element {
  const hasValue = value !== undefined && value > 0

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const raw = e.target.value
    onChange(raw === '' ? undefined : parseFloat(raw))
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <label className="text-sm text-text-body flex-1">{field.label}</label>
        <Tooltip content={field.hint} position="left">
          <button type="button" className="text-text-muted hover:text-text-body transition-colors">
            <HelpCircle size={13} />
          </button>
        </Tooltip>
        {hasValue && !warning && (
          <CheckCircle size={13} className="text-emerald-500 flex-shrink-0" />
        )}
        {warning && (
          <AlertTriangle size={13} className="text-amber-500 flex-shrink-0" />
        )}
      </div>
      <div className="relative flex items-center">
        <input
          type="number"
          value={value ?? ''}
          onChange={handleChange}
          step={unit === 'cm' ? '0.5' : '0.25'}
          min={0}
          className={cn(
            'w-full rounded-xl border bg-white text-text-body text-sm h-10 pl-3 pr-12',
            'focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent',
            'transition-colors font-measurement',
            warning ? 'border-amber-300' : hasValue ? 'border-emerald-300' : 'border-surface-muted',
          )}
          placeholder="—"
        />
        <span className="absolute right-3 text-xs text-text-muted font-measurement pointer-events-none">
          {unit}
        </span>
      </div>
      {warning && <p className="text-xs text-amber-600">{warning}</p>}
    </div>
  )
}
