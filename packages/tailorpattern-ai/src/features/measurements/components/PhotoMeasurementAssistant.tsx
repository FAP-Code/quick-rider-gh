import { useState } from 'react'
import { Sparkles, Camera, ChevronDown, ChevronRight } from 'lucide-react'
import { BodyDiagram } from './BodyDiagram'
import { cn } from '../../../shared/utils/cn'

interface SectionTip {
  landmarks: string[]
  howTo: string
  aiWillExtract: string[]
}

const SECTION_TIPS: Record<string, SectionTip> = {
  'Upper Body': {
    landmarks: ['Chest / Bust', 'Waist', 'Hips', 'Shoulder width'],
    howTo: 'Ensure the tape is parallel to the floor for chest and hips. The waist is the narrowest point of the torso.',
    aiWillExtract: ['Chest circumference estimate', 'Shoulder width proportion', 'Waist-to-hip ratio'],
  },
  'Neck & Collar': {
    landmarks: ['Base of neck', 'Collar stand height'],
    howTo: 'Measure around the base of the neck. Keep one finger under the tape for ease. Photo angle matters — front-facing or 45° works best.',
    aiWillExtract: ['Neck circumference estimate', 'Collar style preference hint'],
  },
  'Arms & Sleeves': {
    landmarks: ['Shoulder point to wrist', 'Bicep fullness', 'Wrist width'],
    howTo: 'Arm slightly bent for sleeve length. Measure bicep relaxed at the widest point.',
    aiWillExtract: ['Arm length proportion', 'Bicep circumference estimate'],
  },
  'Torso Lengths': {
    landmarks: ['Shoulder to natural waist (front & back)', 'Bust point to waist'],
    howTo: 'The 7th cervical vertebra (prominent bone at base of neck) is the back length starting point.',
    aiWillExtract: ['Front vs. back length difference', 'Torso length estimate'],
  },
  'Lower Body': {
    landmarks: ['Crotch to ankle (inseam)', 'Waist to ankle (outseam)', 'Thigh', 'Knee', 'Ankle'],
    howTo: 'Sit on a flat surface to measure rise. Measure inseam with legs slightly apart.',
    aiWillExtract: ['Leg length proportion', 'Thigh circumference estimate'],
  },
}

interface PhotoMeasurementAssistantProps {
  photoUrl?: string | null
  activeSection?: string
  className?: string
}

export function PhotoMeasurementAssistant({
  photoUrl,
  activeSection,
  className,
}: PhotoMeasurementAssistantProps): JSX.Element {
  const [aiOpen, setAiOpen] = useState(false)
  const tip = activeSection ? SECTION_TIPS[activeSection] : null

  return (
    <div className={cn('space-y-3', className)}>
      {/* Reference photo */}
      {photoUrl ? (
        <div className="rounded-2xl overflow-hidden border border-surface-muted bg-surface-subtle">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-surface-muted bg-white">
            <Camera size={12} className="text-text-muted" />
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider flex-1">Customer Photo</span>
            <span className="text-[10px] font-medium text-brand-mid bg-brand-mid/10 rounded-full px-1.5 py-0.5">
              AI-ready
            </span>
          </div>
          <img
            src={photoUrl}
            alt="Customer reference"
            className="w-full max-h-56 object-contain"
          />
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-surface-muted bg-surface-subtle p-5 text-center">
          <Camera size={20} className="mx-auto text-text-muted mb-2" />
          <p className="text-xs text-text-muted">No customer photo attached.</p>
          <p className="text-[10px] text-text-muted mt-1">
            Add a photo via the Pattern wizard using the &ldquo;Customer Photo&rdquo; input method.
          </p>
        </div>
      )}

      {/* Body diagram */}
      <div className="bg-white rounded-2xl border border-surface-muted p-4">
        <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3">
          {activeSection ?? 'Body sections'}
        </p>
        <BodyDiagram {...(activeSection !== undefined ? { activeSection } : {})} className="max-w-[80px] mx-auto" />
      </div>

      {/* Section tips */}
      {tip && (
        <div className="bg-white rounded-2xl border border-surface-muted p-4 space-y-3">
          <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
            How to measure
          </p>
          <p className="text-xs text-text-body">{tip.howTo}</p>
          <div>
            <p className="text-[10px] font-semibold text-text-muted mb-1.5">Key landmarks</p>
            <ul className="space-y-1">
              {tip.landmarks.map(l => (
                <li key={l} className="flex items-center gap-1.5 text-xs text-text-body">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-gold flex-shrink-0" />
                  {l}
                </li>
              ))}
            </ul>
          </div>

          {/* AI extraction placeholder — collapsible */}
          <div className="border-t border-surface-muted pt-3">
            <button
              type="button"
              onClick={() => setAiOpen(o => !o)}
              className="flex items-center gap-1.5 w-full text-left"
            >
              <Sparkles size={11} className="text-brand-gold flex-shrink-0" />
              <span className="text-[11px] font-semibold text-brand-mid flex-1">AI will extract</span>
              <span className="text-[10px] font-medium text-brand-mid bg-brand-mid/10 rounded-full px-1.5 py-0.5 mr-1">
                Coming soon
              </span>
              {aiOpen ? <ChevronDown size={11} className="text-text-muted" /> : <ChevronRight size={11} className="text-text-muted" />}
            </button>
            {aiOpen && (
              <ul className="mt-2 space-y-1">
                {tip.aiWillExtract.map(item => (
                  <li key={item} className="flex items-center justify-between py-1 border-b border-surface-muted last:border-0">
                    <span className="text-[11px] text-text-body">{item}</span>
                    <span className="text-[10px] text-text-muted italic ml-2">—</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="rounded-xl bg-amber-50 border border-amber-100 px-3 py-2">
        <p className="text-[10px] text-amber-700">
          <strong>AI extraction not yet active.</strong> All measurements must be taken and entered manually. The photo is for visual reference only.
        </p>
      </div>
    </div>
  )
}
