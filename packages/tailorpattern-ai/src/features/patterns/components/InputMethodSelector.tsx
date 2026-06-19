import { type ChangeEvent } from 'react'
import { Ruler, Sparkles, Shirt, Camera, Upload, PenTool, FileUp, Check } from 'lucide-react'
import { SketchCanvas } from '../../sketch/components/SketchCanvas'
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

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0]
    if (!file) {
      onFileChange(null)
      return
    }
    const reader = new FileReader()
    reader.onload = () => onFileChange(typeof reader.result === 'string' ? reader.result : null)
    reader.readAsDataURL(file)
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

      {selected?.placeholder && (
        <div className="rounded-xl border border-brand-mid/20 bg-brand-mid/5 p-4 space-y-3">
          <p className="text-xs text-brand-mid">
            <strong>AI-ready photo analysis placeholder.</strong> Automatic extraction isn&rsquo;t implemented yet —
            we&rsquo;ll save what you provide here, and you&rsquo;ll confirm measurements manually in the next step.
          </p>

          {value === 'ai-prompt' && (
            <textarea
              value={notes}
              onChange={e => onNotesChange(e.target.value)}
              placeholder="e.g. A slim-fit navy suit jacket with peak lapels and two buttons..."
              rows={3}
              className="w-full rounded-xl border border-surface-muted bg-white text-sm p-3 focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent"
            />
          )}

          {(value === 'garment-photo' || value === 'customer-photo' || value === 'sketch-upload' || value === 'pattern-upload') && (
            <div className="space-y-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                className="block w-full text-sm text-text-muted file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-brand-navy file:text-white file:text-xs file:font-medium hover:file:bg-brand-mid cursor-pointer"
              />
              {fileDataUrl && (
                <img src={fileDataUrl} alt="Uploaded preview" className="max-h-48 rounded-lg border border-surface-muted" />
              )}
            </div>
          )}

          {value === 'sketch-draw' && (
            <SketchCanvas onSave={onSketchSave} className="rounded-xl overflow-hidden border border-surface-muted" />
          )}
        </div>
      )}
    </div>
  )
}
