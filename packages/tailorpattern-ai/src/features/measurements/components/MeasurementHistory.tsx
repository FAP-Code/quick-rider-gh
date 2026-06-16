import { Star, Copy, Ruler } from 'lucide-react'
import { Badge } from '../../../shared/components/ui/Badge'
import { Button } from '../../../shared/components/ui/Button'
import { EmptyState } from '../../../shared/components/ui/EmptyState'
import { formatDate } from '../../../shared/utils/format'
import { useMeasurements, useSetDefaultMeasurement } from '../hooks/useMeasurements'
import type { MeasurementSet } from '../types/measurement.types'

interface MeasurementHistoryProps {
  customerId: string
  onSelect?: (set: MeasurementSet) => void
  selectedId?: string
}

export function MeasurementHistory({
  customerId,
  onSelect,
  selectedId,
}: MeasurementHistoryProps): JSX.Element {
  const { data: sets, isLoading } = useMeasurements(customerId)
  const setDefault = useSetDefaultMeasurement(customerId)

  if (isLoading) {
    return <div className="animate-pulse space-y-2">{[1, 2].map(i => <div key={i} className="h-16 bg-surface-muted rounded-xl" />)}</div>
  }

  if (!sets?.length) {
    return (
      <EmptyState
        icon={<Ruler size={24} />}
        title="No measurements yet"
        description="Add measurement sets to start generating patterns"
      />
    )
  }

  return (
    <div className="space-y-2">
      {sets.map(set => (
        <button
          key={set.id}
          onClick={() => onSelect?.(set)}
          className={`w-full text-left p-3 rounded-xl border transition-all ${
            selectedId === set.id
              ? 'border-brand-gold bg-brand-gold/8'
              : 'border-surface-muted bg-white hover:border-brand-gold/30'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{set.label}</p>
              <p className="text-xs text-text-muted mt-0.5">
                {formatDate(set.takenAt)} · {set.measurements.unit}
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {set.isDefault && (
                <Badge variant="gold" size="sm">
                  <Star size={10} />Default
                </Badge>
              )}
              {!set.isDefault && (
                <button
                  onClick={e => {
                    e.stopPropagation()
                    void setDefault.mutateAsync(set.id)
                  }}
                  className="text-[10px] text-text-muted hover:text-brand-gold transition-colors"
                >
                  Set default
                </button>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
