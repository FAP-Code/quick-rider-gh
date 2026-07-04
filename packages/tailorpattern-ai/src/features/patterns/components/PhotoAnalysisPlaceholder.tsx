import { Sparkles, Shirt, Ruler, Palette, ChevronRight } from 'lucide-react'
import { cn } from '../../../shared/utils/cn'
import type { InputMethod } from '../types/pattern.types'

interface PhotoAnalysisPlaceholderProps {
  inputMethod: InputMethod
  hasPhoto: boolean
  className?: string
}

const STEPS = [
  { id: 'upload', label: 'Upload' },
  { id: 'detect', label: 'Detect' },
  { id: 'extract', label: 'Extract' },
  { id: 'confirm', label: 'Confirm' },
] as const

const METHOD_CONFIG: Partial<Record<InputMethod, { title: string; description: string; extractionItems: string[] }>> = {
  'garment-photo': {
    title: 'Garment Photo Analysis',
    description: 'AI will scan the garment photo to detect style, silhouette, and design features.',
    extractionItems: ['Garment type & silhouette', 'Collar & sleeve style', 'Pocket & closure details', 'Fabric weight estimate', 'Suggested ease preference'],
  },
  'customer-photo': {
    title: 'Customer Photo Analysis',
    description: 'AI will estimate body proportions for fit guidance. Customer must confirm all measurements.',
    extractionItems: ['Relative body proportions', 'Posture & stance notes', 'Suggested measurement checkpoints', 'Fit preference hints'],
  },
  'pattern-upload': {
    title: 'Pattern File Analysis',
    description: 'AI will read existing pattern pieces and extract construction data.',
    extractionItems: ['Pattern piece outlines', 'Grain line directions', 'Seam allowance values', 'Measurement labels', 'Construction notes'],
  },
}

interface ExtractionRowProps {
  label: string
  comingSoon?: boolean
}

function ExtractionRow({ label }: ExtractionRowProps): JSX.Element {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-surface-muted last:border-0">
      <span className="text-xs text-text-body">{label}</span>
      <span className="text-[10px] font-medium text-brand-mid bg-brand-mid/10 rounded-full px-2 py-0.5">
        Coming soon
      </span>
    </div>
  )
}

export function PhotoAnalysisPlaceholder({ inputMethod, hasPhoto, className }: PhotoAnalysisPlaceholderProps): JSX.Element {
  const config = METHOD_CONFIG[inputMethod]
  if (!config) return <></>

  const activeStep = hasPhoto ? 1 : 0

  return (
    <div className={cn('rounded-2xl border border-brand-mid/20 bg-white overflow-hidden', className)}>
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-navy to-brand-mid px-4 py-3 flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
          <Sparkles size={14} className="text-brand-gold" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-white">{config.title}</p>
          <p className="text-[10px] text-white/60 mt-0.5">AI-ready placeholder — automatic extraction not yet active</p>
        </div>
      </div>

      {/* Step pipeline */}
      <div className="px-4 py-3 bg-surface-subtle border-b border-surface-muted">
        <div className="flex items-center gap-1">
          {STEPS.map((step, i) => (
            <div key={step.id} className="flex items-center gap-1 flex-1">
              <div className={cn(
                'flex-1 flex items-center justify-center py-1 rounded-lg text-[10px] font-medium transition-colors',
                i < activeStep
                  ? 'bg-brand-navy/10 text-brand-navy'
                  : i === activeStep
                    ? 'bg-brand-gold/15 text-brand-gold ring-1 ring-brand-gold/40'
                    : 'bg-surface-muted text-text-muted',
              )}>
                {step.label}
              </div>
              {i < STEPS.length - 1 && (
                <ChevronRight size={10} className="text-text-muted flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
        {!hasPhoto && (
          <p className="text-[10px] text-text-muted mt-2 text-center">Upload a photo above to continue</p>
        )}
        {hasPhoto && (
          <p className="text-[10px] text-brand-mid mt-2 text-center font-medium">
            Photo saved · AI analysis will run automatically once enabled
          </p>
        )}
      </div>

      {/* What AI will extract */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-1.5 mb-2">
          <div className="flex gap-1">
            <Shirt size={11} className="text-text-muted" />
            <Ruler size={11} className="text-text-muted" />
            <Palette size={11} className="text-text-muted" />
          </div>
          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">What AI will extract</p>
        </div>
        <div>
          {config.extractionItems.map(item => (
            <ExtractionRow key={item} label={item} />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 bg-amber-50 border-t border-amber-100">
        <p className="text-[10px] text-amber-700">
          <strong>Manual confirmation required.</strong> Until AI extraction is active, proceed to the Measurements step and confirm all values manually.
        </p>
      </div>
    </div>
  )
}
