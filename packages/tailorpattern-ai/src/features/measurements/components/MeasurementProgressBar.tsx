import { CheckCircle2 } from 'lucide-react'
import { cn } from '../../../shared/utils/cn'
import { MEASUREMENT_SECTIONS, MEASUREMENT_SECTIONS_MAP } from '../engine/constants'
import type { MeasurementData } from '../types/measurement.types'

interface MeasurementProgressBarProps {
  measurements: Partial<MeasurementData>
  className?: string
}

function countFilled(measurements: Partial<MeasurementData>, fields: Array<{ key: keyof MeasurementData }>): number {
  return fields.filter(f => {
    const v = measurements[f.key]
    return v !== undefined && (v as number) > 0
  }).length
}

export function MeasurementProgressBar({ measurements, className }: MeasurementProgressBarProps): JSX.Element {
  const allFields = Object.values(MEASUREMENT_SECTIONS_MAP).flat()
  const totalFilled = countFilled(measurements, allFields)
  const totalFields = allFields.length
  const pct = totalFields > 0 ? Math.round((totalFilled / totalFields) * 100) : 0

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-text-muted">Measurement progress</span>
        <span className={cn(
          'text-xs font-semibold font-measurement',
          pct === 100 ? 'text-emerald-600' : pct >= 50 ? 'text-brand-mid' : 'text-text-muted',
        )}>
          {totalFilled}/{totalFields}
          {pct === 100 && <CheckCircle2 size={12} className="inline ml-1 text-emerald-500" />}
        </span>
      </div>

      {/* Overall bar */}
      <div className="h-1.5 bg-surface-muted rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            pct === 100 ? 'bg-emerald-500' : 'bg-brand-gold',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Per-section dots */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {MEASUREMENT_SECTIONS.map(section => {
          const fields = MEASUREMENT_SECTIONS_MAP[section] ?? []
          const filled = countFilled(measurements, fields)
          const done = filled === fields.length
          const started = filled > 0
          return (
            <div key={section} className="flex items-center gap-1">
              <div className={cn(
                'w-2 h-2 rounded-full transition-colors',
                done ? 'bg-emerald-500' : started ? 'bg-brand-gold' : 'bg-surface-muted',
              )} />
              <span className="text-[10px] text-text-muted">{section.split(' ')[0]}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
