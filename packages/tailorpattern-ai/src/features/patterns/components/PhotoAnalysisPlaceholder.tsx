import { Sparkles, Shirt, Ruler, Palette, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '../../../shared/utils/cn'
import type { InputMethod } from '../types/pattern.types'
import type { PhotoAnalysisResult, AnalysisStatus } from '../types/photoAnalysis.types'

interface PhotoAnalysisPlaceholderProps {
  inputMethod: InputMethod
  hasPhoto: boolean
  analysisStatus?: AnalysisStatus
  analysisResult?: PhotoAnalysisResult | null
  analysisError?: string | null
  className?: string
}

const METHOD_CONFIG: Partial<Record<InputMethod, { title: string; extractionItems: string[] }>> = {
  'garment-photo': {
    title: 'Garment Photo Analysis',
    extractionItems: ['Garment type & silhouette', 'Collar & sleeve style', 'Pocket & closure details', 'Fabric weight estimate', 'Suggested ease preference'],
  },
  'customer-photo': {
    title: 'Customer Photo Analysis',
    extractionItems: ['Relative body proportions', 'Posture & stance notes', 'Suggested measurement checkpoints', 'Fit preference hints'],
  },
  'pattern-upload': {
    title: 'Pattern File Analysis',
    extractionItems: ['Pattern piece outlines', 'Grain line directions', 'Seam allowance values', 'Construction notes'],
  },
}

const STEPS = [
  { id: 'upload', label: 'Upload' },
  { id: 'detect', label: 'Detect' },
  { id: 'extract', label: 'Extract' },
  { id: 'confirm', label: 'Confirm' },
] as const

function getActiveStep(status: AnalysisStatus, hasPhoto: boolean): number {
  if (status === 'done') return 3
  if (status === 'loading') return 2
  if (hasPhoto) return 1
  return 0
}

interface ExtractedRow {
  label: string
  value: string | null
}

function buildRows(inputMethod: InputMethod, result: PhotoAnalysisResult | null | undefined): ExtractedRow[] {
  if (result?.type === 'garment-photo' && inputMethod === 'garment-photo') {
    const d = result.data
    return [
      { label: 'Garment type & silhouette', value: `${d.garmentType} — ${d.silhouette}` },
      { label: 'Collar & sleeve style', value: `${d.collarStyle} / ${d.sleeveStyle}` },
      { label: 'Pocket & closure details', value: `${d.pocketDetails}; ${d.closureType}` },
      { label: 'Fabric weight estimate', value: d.fabricType },
      { label: 'Suggested ease preference', value: d.easePreference },
    ]
  }
  if (result?.type === 'customer-photo' && inputMethod === 'customer-photo') {
    const d = result.data
    return [
      { label: 'Relative body proportions', value: d.proportionNotes },
      { label: 'Posture & stance notes', value: d.postureNotes },
      { label: 'Suggested measurement checkpoints', value: d.recommendedCheckpoints.join(', ') },
      { label: 'Fit preference hints', value: d.fitHints.join(', ') },
    ]
  }
  if (result?.type === 'pattern-upload' && inputMethod === 'pattern-upload') {
    const d = result.data
    return [
      { label: 'Pattern piece outlines', value: d.detectedPieces.join(', ') || 'None detected' },
      { label: 'Grain line directions', value: d.grainLineNotes },
      { label: 'Seam allowance values', value: d.seamAllowanceEstimate },
      { label: 'Construction notes', value: d.constructionNotes },
    ]
  }
  const items = METHOD_CONFIG[inputMethod]?.extractionItems ?? []
  return items.map(label => ({ label, value: null }))
}

interface RowProps {
  label: string
  value: string | null
  loading: boolean
}

function Row({ label, value, loading }: RowProps): JSX.Element {
  return (
    <div className="flex items-start justify-between py-1.5 border-b border-surface-muted last:border-0 gap-3">
      <span className="text-xs text-text-body flex-shrink-0">{label}</span>
      {loading ? (
        <div className="h-3 w-28 rounded-full bg-surface-muted animate-pulse mt-0.5" />
      ) : value ? (
        <span className="text-xs font-medium text-text-primary text-right">{value}</span>
      ) : (
        <span className="text-[10px] font-medium text-brand-mid bg-brand-mid/10 rounded-full px-2 py-0.5 flex-shrink-0">
          Coming soon
        </span>
      )}
    </div>
  )
}

export function PhotoAnalysisPlaceholder({
  inputMethod,
  hasPhoto,
  analysisStatus = 'idle',
  analysisResult,
  analysisError,
  className,
}: PhotoAnalysisPlaceholderProps): JSX.Element {
  const config = METHOD_CONFIG[inputMethod]
  if (!config) return <></>

  const activeStep = getActiveStep(analysisStatus, hasPhoto)
  const isLoading = analysisStatus === 'loading'
  const isDone = analysisStatus === 'done'
  const isError = analysisStatus === 'error'
  const isApiKeyError = isError && (analysisError?.includes('VITE_ANTHROPIC_API_KEY') ?? false)

  const rows = buildRows(inputMethod, analysisResult)
  const confidence = analysisResult
    ? (analysisResult.data as { confidence?: string }).confidence
    : undefined

  const headerSubtitle = isDone
    ? 'Analysis complete — review extracted details below'
    : isLoading
      ? 'Analysing with Claude AI...'
      : isError
        ? 'Analysis failed — see details below'
        : hasPhoto
          ? 'Photo ready — starting analysis...'
          : 'Upload a photo to begin'

  const footerMsg = isDone
    ? 'Results ready — check extracted details below'
    : isLoading
      ? 'Sending image to Claude AI...'
      : !hasPhoto
        ? 'Upload a photo above to continue'
        : 'Ready to analyse'

  return (
    <div className={cn('rounded-2xl border border-brand-mid/20 bg-white overflow-hidden', className)}>
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-navy to-brand-mid px-4 py-3 flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
          <Sparkles size={14} className={cn('text-brand-gold', isLoading && 'animate-pulse')} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-white">{config.title}</p>
          <p className="text-[10px] text-white/60 mt-0.5">{headerSubtitle}</p>
        </div>
        {isDone && <CheckCircle2 size={16} className="text-green-300 flex-shrink-0" />}
        {isError && <AlertCircle size={16} className="text-red-300 flex-shrink-0" />}
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
                    ? isDone
                      ? 'bg-green-100 text-green-700 ring-1 ring-green-300'
                      : isLoading
                        ? 'bg-brand-gold/15 text-brand-gold ring-1 ring-brand-gold/40 animate-pulse'
                        : 'bg-brand-gold/15 text-brand-gold ring-1 ring-brand-gold/40'
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
        <p className={cn(
          'text-[10px] mt-2 text-center font-medium',
          isDone ? 'text-green-600' : isLoading ? 'text-brand-gold' : 'text-text-muted',
        )}>
          {footerMsg}
        </p>
      </div>

      {/* Error notice */}
      {isError && (
        <div className="px-4 py-3 bg-red-50 border-b border-red-100">
          {isApiKeyError ? (
            <p className="text-[10px] text-red-700">
              <strong>API key not configured.</strong> Add{' '}
              <code className="bg-red-100 px-1 rounded">VITE_ANTHROPIC_API_KEY=sk-ant-...</code> to your{' '}
              <code className="bg-red-100 px-1 rounded">.env</code> file and restart the dev server.
            </p>
          ) : (
            <p className="text-[10px] text-red-700">
              <strong>Analysis failed.</strong>{' '}
              {analysisError ?? 'Unknown error.'} You can continue and fill in details manually.
            </p>
          )}
        </div>
      )}

      {/* Design notes quote (garment photo only) */}
      {isDone && analysisResult?.type === 'garment-photo' && analysisResult.data.designNotes && (
        <div className="px-4 py-2.5 bg-brand-gold/5 border-b border-brand-gold/20">
          <p className="text-[10px] text-brand-navy italic">"{analysisResult.data.designNotes}"</p>
        </div>
      )}

      {/* Extraction rows */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-1.5 mb-2">
          <div className="flex gap-1">
            <Shirt size={11} className="text-text-muted" />
            <Ruler size={11} className="text-text-muted" />
            <Palette size={11} className="text-text-muted" />
          </div>
          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
            {isDone ? 'Extracted Details' : 'What AI will extract'}
          </p>
          {isDone && confidence && (
            <span className={cn(
              'ml-auto text-[10px] font-medium rounded-full px-2 py-0.5',
              confidence === 'high' ? 'bg-green-100 text-green-700' :
              confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700',
            )}>
              {confidence} confidence
            </span>
          )}
        </div>
        <div>
          {rows.map(row => (
            <Row key={row.label} label={row.label} value={row.value} loading={isLoading} />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 bg-amber-50 border-t border-amber-100">
        <p className="text-[10px] text-amber-700">
          <strong>Manual confirmation required.</strong>{' '}
          {isDone
            ? 'AI results are a guide — always confirm measurements with the customer before cutting.'
            : 'Until AI extraction runs, proceed to the Measurements step and confirm all values manually.'}
        </p>
      </div>
    </div>
  )
}
