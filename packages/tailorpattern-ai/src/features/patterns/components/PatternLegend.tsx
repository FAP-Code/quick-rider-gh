import type { PatternData } from '../types/pattern.types'

interface PatternLegendProps {
  patternData: PatternData
}

export function PatternLegend({ patternData }: PatternLegendProps): JSX.Element {
  return (
    <div className="bg-white rounded-2xl border border-surface-muted p-4">
      <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Pattern Pieces</p>
      <div className="space-y-1.5">
        {patternData.pieces.map(piece => (
          <div key={piece.id} className="space-y-0.5">
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded flex-shrink-0 opacity-80"
                style={{ backgroundColor: piece.color ?? '#1A1A2E' }}
              />
              <span className="text-xs text-text-body">{piece.name}</span>
              {piece.quantity && piece.quantity > 1 && (
                <span className="text-xs text-text-muted ml-auto">×{piece.quantity}</span>
              )}
              {piece.mirror && (
                <span className="text-[10px] text-text-muted">(mirror)</span>
              )}
            </div>
            {piece.keyMeasurements && piece.keyMeasurements.length > 0 && (
              <p className="text-[10px] text-text-muted pl-6">{piece.keyMeasurements.join(' · ')}</p>
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-surface-muted space-y-1">
        <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">Key</p>
        <div className="flex items-center gap-2">
          <div className="w-6 border-t-2 border-dashed border-indigo-400" />
          <span className="text-[10px] text-text-muted">Fold line</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 border-t border-dashed border-slate-400" />
          <span className="text-[10px] text-text-muted">Grain line</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 border-t border-dashed border-slate-300 border-opacity-50" />
          <span className="text-[10px] text-text-muted">Seam allowance</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-brand-navy" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
          <span className="text-[10px] text-text-muted">Notch mark</span>
        </div>
      </div>
    </div>
  )
}
