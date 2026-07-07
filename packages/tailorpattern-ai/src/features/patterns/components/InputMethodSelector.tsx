import { Ruler, Sparkles, Shirt, Camera, Upload, PenTool, FileUp, Check } from 'lucide-react'
import { SketchCanvas } from '../../sketch/components/SketchCanvas'
import { PhotoUploadZone } from './PhotoUploadZone'
import { PhotoAnalysisPlaceholder } from './PhotoAnalysisPlaceholder'
import { cn } from '../../../shared/utils/cn'
import type { InputMethod } from '../types/pattern.types'
import type { PhotoAnalysisResult, AnalysisStatus } from '../types/photoAnalysis.types'

interface InputMethodOption {
  value: InputMethod
  label: string
  description: string
  icon: typeof Ruler
  aiActive: boolean
}

const OPTIONS: InputMethodOption[] = [
  { value: 'manual', label: 'Manual Measurements', description: 'Enter or confirm body measurements yourself', icon: Ruler, aiActive: false },
  { value: 'ai-prompt', label: 'AI Prompt', description: 'Describe the garment in your own words', icon: Sparkles, aiActive: false },
  { value: 'garment-photo', label: 'Upload Garment Photo', description: 'A photo of the dress, suit or shirt to recreate', icon: Shirt, aiActive: true },
  { value: 'customer-photo', label: 'Upload Customer Photo', description: 'A photo of the customer for fit reference', icon: Camera, aiActive: true },
  { value: 'sketch-upload', label: 'Upload Sketch', description: 'A hand-drawn or digital sketch image', icon: Upload, aiActive: false },
  { value: 'sketch-draw', label: 'Draw Sketch', description: 'Sketch the design directly in the app', icon: PenTool, aiActive: false },
  { value: 'pattern-upload', label: 'Upload Existing Pattern', description: 'A pattern file to use as a starting point', icon: FileUp, aiActive: true },
]

const PHOTO_ANALYSIS_METHODS: InputMethod[] = ['garment-photo', 'customer-photo', 'pattern-upload']

interface InputMethodSelectorProps {
  value: InputMethod
  onChange: (method: InputMethod) => void
  notes: string
  onNotesChange: (value: string) => void
  fileDataUrl: string | null
  onFileChange: (dataUrl: string | null) => void
  onSketchSave: (dataUrl: string) => void
  onAnalyze?: (dataUrl: string, method: InputMethod) => void
  analysisStatus?: AnalysisStatus
  analysisResult?: PhotoAnalysisResult | null
  analysisError?: string | null
}

export function InputMethodSelector({
  value,
  onChange,
  notes,
  onNotesChange,
  fileDataUrl,
  onFileChange,
  onSketchSave,
  onAnalyze,
  analysisStatus,
  analysisResult,
  analysisError,
}: InputMethodSelectorProps): JSX.Element {
  const selected = OPTIONS.find(o => o.value === value)
  const isPhotoMethod = PHOTO_ANALYSIS_METHODS.includes(value)

  function handleFileChange(dataUrl: string | null): void {
    onFileChange(dataUrl)
    if (dataUrl && isPhotoMethod && onAnalyze) {
      onAnalyze(dataUrl, value)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {OPTIONS.map(opt => {
          const Icon = opt.icon
          const active = value === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={cn(
                'flex items-start gap-3 p-3 rounded-xl border text-left transition-all',
                active
                  ? 'border-brand-gold bg-brand-gold/8 ring-1 ring-brand-gold'
                  : 'border-surface-muted bg-white hover:border-brand-gold/30',
              )}
            >
              <div
                className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                  active ? 'bg-brand-gold/20 text-brand-gold' : 'bg-surface-muted text-text-muted',
                )}
              >
                <Icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-text-primary">{opt.label}</p>
                  {opt.aiActive ? (
                    <span className="text-[10px] font-medium text-green-700 bg-green-100 rounded-full px-1.5 py-0.5">
                      AI
                    </span>
                  ) : opt.value !== 'manual' ? (
                    <span className="text-[10px] font-medium text-brand-mid bg-brand-mid/10 rounded-full px-1.5 py-0.5">
                      Soon
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-text-muted mt-0.5">{opt.description}</p>
              </div>
              {active && <Check size={16} className="text-brand-gold flex-shrink-0" />}
            </button>
          )
        })}
      </div>

      {/* AI-prompt text input */}
      {value === 'ai-prompt' && (
        <div className="rounded-xl border border-brand-mid/20 bg-brand-mid/5 p-4 space-y-3">
          <p className="text-xs text-brand-mid">
            <strong>Coming soon.</strong> Describe the garment — style, fabric, fit — and AI will use this to guide pattern generation.
          </p>
          <textarea
            value={notes}
            onChange={e => onNotesChange(e.target.value)}
            placeholder="e.g. A slim-fit navy suit jacket with peak lapels and two buttons..."
            rows={4}
            className="w-full rounded-xl border border-surface-muted bg-white text-sm p-3 focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent resize-none"
          />
        </div>
      )}

      {/* Photo upload + AI analysis */}
      {isPhotoMethod && selected && (
        <div className="space-y-3">
          <PhotoUploadZone
            dataUrl={fileDataUrl}
            onChange={handleFileChange}
            label={
              value === 'garment-photo' ? 'garment photo' :
              value === 'customer-photo' ? 'customer photo' :
              'pattern file'
            }
          />
          <PhotoAnalysisPlaceholder
            inputMethod={value}
            hasPhoto={!!fileDataUrl}
            {...(analysisStatus !== undefined ? { analysisStatus } : {})}
            {...(analysisResult !== undefined ? { analysisResult } : {})}
            {...(analysisError !== undefined ? { analysisError } : {})}
          />
        </div>
      )}

      {/* Sketch upload */}
      {value === 'sketch-upload' && (
        <div className="rounded-xl border border-brand-mid/20 bg-brand-mid/5 p-4 space-y-3">
          <p className="text-xs text-brand-mid">
            <strong>Sketch reference.</strong> Your sketch will be saved alongside the pattern for tailor reference. Manual measurements still required.
          </p>
          <PhotoUploadZone
            dataUrl={fileDataUrl}
            onChange={(url) => onFileChange(url)}
            label="sketch image"
          />
        </div>
      )}

      {/* Sketch draw canvas */}
      {value === 'sketch-draw' && (
        <div className="rounded-xl border border-brand-mid/20 bg-brand-mid/5 p-4 space-y-3">
          <p className="text-xs text-brand-mid">
            <strong>Sketch pad.</strong> Draw your design — saved alongside the pattern as a tailor reference.
          </p>
          <SketchCanvas onSave={onSketchSave} className="rounded-xl overflow-hidden border border-surface-muted" />
        </div>
      )}
    </div>
  )
}
