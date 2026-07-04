import { User2 } from 'lucide-react'
import { DigitalTwinSVG } from './DigitalTwinSVG'
import type { MeasurementSet } from '../../measurements/types/measurement.types'

interface DigitalTwinCardProps {
  measurementSet: MeasurementSet | null | undefined
  className?: string
}

const KEY_FIELDS = ['chest', 'waist', 'hips', 'shoulderWidth', 'sleeveLength', 'trouserInseam'] as const

function fitStatus(cm: number | undefined, lo: number, hi: number): 'ok' | 'watch' | 'missing' {
  if (cm === undefined) return 'missing'
  if (cm >= lo && cm <= hi) return 'ok'
  return 'watch'
}

export function DigitalTwinCard({ measurementSet, className }: DigitalTwinCardProps): JSX.Element {
  const m = measurementSet?.measurements

  const totalFields = KEY_FIELDS.length
  const filledFields = m ? KEY_FIELDS.filter(f => m[f] !== undefined).length : 0
  const pct = m ? Math.round((filledFields / totalFields) * 100) : 0

  type Indicator = { label: string; status: 'ok' | 'watch' | 'missing'; value?: number }
  const indicators: Indicator[] = m
    ? [
        { label: 'Chest',    status: fitStatus(m.chest,         80, 130), ...(m.chest !== undefined          ? { value: m.chest }         : {}) },
        { label: 'Waist',    status: fitStatus(m.waist,         60, 110), ...(m.waist !== undefined          ? { value: m.waist }         : {}) },
        { label: 'Hips',     status: fitStatus(m.hips,          80, 130), ...(m.hips !== undefined           ? { value: m.hips }          : {}) },
        { label: 'Shoulder', status: fitStatus(m.shoulderWidth, 35,  55), ...(m.shoulderWidth !== undefined  ? { value: m.shoulderWidth } : {}) },
      ]
    : []

  const statusColors = {
    ok: 'bg-emerald-400',
    watch: 'bg-amber-400',
    missing: 'bg-surface-muted',
  }

  return (
    <div className={`bg-white rounded-2xl border border-surface-muted overflow-hidden ${className ?? ''}`}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-surface-muted bg-surface-subtle">
        <User2 size={13} className="text-brand-mid" />
        <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider flex-1">
          Digital Twin
        </span>
        <span className="text-[10px] font-medium text-brand-mid bg-brand-mid/10 rounded-full px-1.5 py-0.5">
          2D Foundation
        </span>
      </div>

      {m ? (
        <div className="p-4 space-y-4">
          {/* SVG silhouette */}
          <DigitalTwinSVG
            measurements={m}
            showAnnotations
            className="w-32 mx-auto block"
          />

          {/* Completion bar */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] text-text-muted">Measurement coverage</span>
              <span className="text-[10px] font-semibold text-text-body">{pct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-surface-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-emerald-400' : 'bg-brand-gold'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Fit indicators */}
          {indicators.length > 0 && (
            <div className="grid grid-cols-2 gap-1.5">
              {indicators.map(ind => (
                <div
                  key={ind.label}
                  className="flex items-center gap-1.5 bg-surface-subtle rounded-lg px-2 py-1"
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusColors[ind.status]}`} />
                  <span className="text-[10px] text-text-muted flex-1">{ind.label}</span>
                  {ind.value !== undefined && (
                    <span className="text-[10px] font-semibold text-text-body">{ind.value}cm</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Set label */}
          {measurementSet && (
            <p className="text-[10px] text-text-muted text-center">
              Based on: <span className="font-medium text-text-body">{measurementSet.label}</span>
            </p>
          )}
        </div>
      ) : (
        <div className="p-6 text-center space-y-2">
          <User2 size={28} className="mx-auto text-surface-muted" />
          <p className="text-xs text-text-muted">No measurements yet</p>
          <p className="text-[10px] text-text-muted">
            Add a measurement set to see the digital twin.
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-2 border-t border-surface-muted bg-amber-50">
        <p className="text-[9px] text-amber-700 text-center">
          2D silhouette only · 3D avatar preview coming in Phase 7
        </p>
      </div>
    </div>
  )
}
