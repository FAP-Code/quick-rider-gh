import { Ruler, Sparkles, Shirt, Camera, Upload, PenTool, FileUp, Check } from 'lucide-react'
import { SketchCanvas } from '../../sketch/components/SketchCanvas'
import { PhotoUploadZone } from './PhotoUploadZone'
import { PhotoAnalysisPlaceholder } from './PhotoAnalysisPlaceholder'
import { cn } from '../../../shared/utils/cn'
import type { InputMethod } from '../types/pattern.types'

interface InputMethodOption {
  value: InputMethod
  label: string
  description: string
  icon: typeof Ruler
  placeholder: boolean
}

const OPTIONS: InputMethodOption[] = [
  { value: 'manual', label: 'Manual Measurements', description: 'Enter or confirm body measurements yourself', icon: Ruler, placeholder: false },
  { value: 'ai-prompt', label: 'AI Prompt', description: 'Describe the garment in your own words', icon: Sparkles, placeholder: true },
  { value: 'garment-photo', label: 'Upload Garment Photo', description: 'A photo of the dress, suit or shirt to recreate', icon: Shirt, placeholder: true },
  { value: 'customer-photo', label: 'Upload Customer Photo', description: 'A photo of the customer for fit reference', icon: Camera, placeholder: true },
  { value: 'sketch-upload', label: 'Upload Sketch', description: 'A hand-drawn or digital sketch image', icon: Upload, placeholder: true },
  { value: 'sketch-draw', label: 'Draw Sketch', description: 'Sketch the design directly in the app', icon: PenTool, placeholder: true },
  { value: 'pattern-upload', label: 'Upload Existing Pattern', description: 'A pattern file to use as a starting point', icon: FileUp, placeholder: true },
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
}

export function InputMethodSelector({
  value,
  onChange,
  notes,
  onNotesChange,
  fileDataUrl,
  onFileChange,
  onSketchSave,
}: InputMethodSelectorProps): JSX.Element {
  const selected = OPTIONS.find(o => o.value === value)
  const isPhotoMethod = PHOTO_ANALYSIS_METHODS.includes(value)

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
                  {opt.placeholder && (
                    <span className="text-[10px] font-medium text-brand-mid bg-brand-mid/10 rounded-full px-1.5 py-0.5">
                      AI-ready
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-muted mt-0.5">{opt.description}</p>
              </div>
              {active && <Check size={16} className="text-brand-gold flex-shrink-0" />}
            </button>
          )
        })}
      </div>

      {/* AI-prompt text input */}
      {selected?.placeholder && value === 'ai-prompt' && (
        <div className="rounded-xl border border-brand-mid/20 bg-brand-mid/5 p-4 space-y-3">
          <p className="text-xs text-brand-mid">
            <strong>AI-ready text prompt.</strong> Describe the garment — style, fabric, fit — and AI will use this to guide pattern generation once the feature is active.
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

      {/* Photo upload + analysis placeholder */}
      {selected?.placeholder && isPhotoMethod && (
        <div className="space-y-3">
          <PhotoUploadZone
            dataUrl={fileDataUrl}
            onChange={(url) => onFileChange(url)}
            label={value === 'garment-photo' ? 'garment photo' : value === 'customer-photo' ? 'customer photo' : 'pattern file'}
          />
          <PhotoAnalysisPlaceholder
            inputMethod={value}
            hasPhoto={!!fileDataUrl}
          />
        </div>
      )}

      {/* Sketch upload — simple file input (no AI analysis card) */}
      {selected?.placeholder && value === 'sketch-upload' && (
        <div className="rounded-xl border border-brand-mid/20 bg-brand-mid/5 p-4 space-y-3">
          <p className="text-xs text-brand-mid">
            <strong>AI-ready sketch upload.</strong> Your sketch will be saved as a reference. Manual measurements are still required.
          </p>
          <PhotoUploadZone
            dataUrl={fileDataUrl}
            onChange={(url) => onFileChange(url)}
            label="sketch image"
          />
        </div>
      )}

      {/* Sketch draw canvas */}
      {selected?.placeholder && value === 'sketch-draw' && (
        <div className="rounded-xl border border-brand-mid/20 bg-brand-mid/5 p-4 space-y-3">
          <p className="text-xs text-brand-mid">
            <strong>AI-ready sketch pad.</strong> Draw your design — this will be saved alongside the pattern for tailor reference.
          </p>
          <SketchCanvas onSave={onSketchSave} className="rounded-xl overflow-hidden border border-surface-muted" />
        </div>
      )}
    </div>
  )
}
