import { useState } from 'react'
import { BookOpen, ChevronDown, ChevronRight, Clock, Sparkles } from 'lucide-react'
import type { GarmentType } from '../types/pattern.types'

interface Step {
  title: string
  detail: string
  tip?: string
  estimateMin?: number
}

interface Section {
  label: string
  steps: Step[]
}

const INSTRUCTIONS: Partial<Record<GarmentType, Section[]>> = {
  'mens-suit-jacket': [
    {
      label: 'Preparation',
      steps: [
        { title: 'Pre-shrink & press fabric', detail: 'Steam press all fabric panels before cutting. Iron interfacing to front facings.', estimateMin: 20 },
        { title: 'Cut & mark pieces', detail: 'Cut all pieces on grain. Transfer all notches, dart lines, and pocket placements.', estimateMin: 30 },
      ],
    },
    {
      label: 'Front Construction',
      steps: [
        { title: 'Sew chest dart', detail: 'Stitch chest dart from wide end to point. Press toward side seam.', tip: 'Taper the last 2cm to avoid a bubble at the point.', estimateMin: 10 },
        { title: 'Attach welt pockets', detail: 'Baste pocket placement. Stitch welt strips, slash, turn, press.', estimateMin: 40 },
        { title: 'Pad-stitch lapels', detail: 'Hand or machine pad-stitch lapel roll line to build structure.', estimateMin: 30 },
      ],
    },
    {
      label: 'Back & Panels',
      steps: [
        { title: 'Stitch back seam & vent', detail: 'Join centre back. Prepare vent extension on left back piece.', estimateMin: 15 },
        { title: 'Join side panels', detail: 'Stitch front to side panel, then side panel to back. Notch curves.', estimateMin: 20 },
      ],
    },
    {
      label: 'Collar & Lapels',
      steps: [
        { title: 'Construct under-collar', detail: 'Sew CB seam of under-collar. Trim, notch, press open.', estimateMin: 15 },
        { title: 'Attach collar', detail: 'Pin under-collar to jacket neckline. Stitch, clip seam allowance.', estimateMin: 20 },
      ],
    },
    {
      label: 'Sleeves',
      steps: [
        { title: 'Stitch sleeve seams', detail: 'Join front and back sleeve seams. Press open.', estimateMin: 15 },
        { title: 'Ease & set sleeve', detail: 'Machine-ease stitch sleeve cap. Pin into armhole matching notches. Stitch.', tip: 'Set sleeve with the cap facing up to control ease.', estimateMin: 30 },
      ],
    },
    {
      label: 'Lining & Finishing',
      steps: [
        { title: 'Construct lining', detail: 'Sew lining pieces together, leaving vent area open.', estimateMin: 30 },
        { title: 'Attach lining', detail: 'Pin lining to jacket at facing edges and hem. Slip-stitch hem.', estimateMin: 30 },
        { title: 'Buttonholes & buttons', detail: 'Mark, stitch, and slash buttonholes. Sew buttons to correspond.', estimateMin: 20 },
        { title: 'Final press', detail: 'Press entire jacket on a tailor\'s ham. Use press cloth on fashion fabric.', estimateMin: 20 },
      ],
    },
  ],
  'mens-trouser': [
    {
      label: 'Preparation',
      steps: [
        { title: 'Cut & transfer markings', detail: 'Cut front and back panels, waistband, pocket bags. Mark all pleat and pocket placements.', estimateMin: 20 },
      ],
    },
    {
      label: 'Pockets & Pleats',
      steps: [
        { title: 'Stitch side pockets', detail: 'Join pocket bag to front panel opening. Understitch. Baste top of pocket to waistline.', estimateMin: 20 },
        { title: 'Press & baste pleats', detail: 'Fold pleats toward side seam (or centre per style). Press and baste at waistline.', estimateMin: 10 },
      ],
    },
    {
      label: 'Leg Construction',
      steps: [
        { title: 'Stitch inside leg seams', detail: 'Join front to back at inseam. Clip curve at crotch.', estimateMin: 15 },
        { title: 'Join crotch seam', detail: 'Pull one leg inside the other. Stitch crotch from front rise to back rise. Reinforce with second row.', estimateMin: 15 },
        { title: 'Stitch side seams', detail: 'Join front to back at outseam. Press open.', estimateMin: 10 },
      ],
    },
    {
      label: 'Waistband & Fly',
      steps: [
        { title: 'Construct fly front', detail: 'Attach zip fly extension. Stitch fly shield. Topstitch fly curve.', estimateMin: 25 },
        { title: 'Attach waistband', detail: 'Stitch waistband to trouser top. Turn, press, slip-stitch or stitch in ditch.', estimateMin: 20 },
      ],
    },
    {
      label: 'Finishing',
      steps: [
        { title: 'Hem legs', detail: 'Turn hem allowance, press, hand-slip-stitch or machine blind-stitch.', estimateMin: 15 },
        { title: 'Bar tack stress points', detail: 'Bar tack at pocket openings and fly base.', estimateMin: 10 },
        { title: 'Final press', detail: 'Press crease lines along front of each leg.', estimateMin: 15 },
      ],
    },
  ],
  'mens-formal-shirt': [
    { label: 'Preparation', steps: [{ title: 'Cut & mark all pieces', detail: 'Cut collar, cuffs, front plackets, yoke, and body panels.', estimateMin: 20 }] },
    { label: 'Collar', steps: [
      { title: 'Construct collar', detail: 'Stitch upper to under-collar. Trim, turn, press.', estimateMin: 15 },
    ] },
    { label: 'Yoke & Body', steps: [
      { title: 'Attach yoke', detail: 'Sandwich back panel between yoke layers (fell method). Press yoke seam down.', estimateMin: 20 },
      { title: 'Stitch side seams', detail: 'Join front to back at sides. Overlock raw edges.', estimateMin: 10 },
    ] },
    { label: 'Sleeves & Cuffs', steps: [
      { title: 'Pleat sleeve head', detail: 'Fold and baste sleeve head pleats per style.', estimateMin: 10 },
      { title: 'Set sleeve', detail: 'Match sleeve notches to shirt notches. Stitch. Press seam toward sleeve.', estimateMin: 15 },
      { title: 'Attach cuffs', detail: 'Stitch cuff to sleeve end. Interface, fold, stitch.', estimateMin: 20 },
    ] },
    { label: 'Finishing', steps: [
      { title: 'Attach collar to neckline', detail: 'Pin collar stand to neckline. Stitch. Slip-stitch or stitch in ditch.', estimateMin: 20 },
      { title: 'Buttonholes & buttons', detail: 'Work buttonholes on placket and cuffs. Attach buttons.', estimateMin: 20 },
      { title: 'Hem shirt tail', detail: 'Fold and stitch shirt tail hem, curving the side vents.', estimateMin: 10 },
    ] },
  ],
  'womens-blouse': [
    { label: 'Preparation', steps: [{ title: 'Cut & mark', detail: 'Cut all fabric panels. Mark dart placements and notches.', estimateMin: 15 }] },
    { label: 'Darts & Bodice', steps: [
      { title: 'Stitch bust darts', detail: 'Fold and stitch from wide end to point. Press downward.', estimateMin: 10 },
      { title: 'Join shoulder & side seams', detail: 'Stitch shoulders together. Join side seams. Press open.', estimateMin: 15 },
    ] },
    { label: 'Neck & Sleeves', steps: [
      { title: 'Finish neckline', detail: 'Attach facing or bias binding to neckline. Press under.', estimateMin: 15 },
      { title: 'Hem sleeves, attach', detail: 'Ease and stitch sleeves into armholes.', estimateMin: 20 },
    ] },
    { label: 'Finishing', steps: [
      { title: 'Hem blouse', detail: 'Press, fold, and stitch lower hem.', estimateMin: 10 },
      { title: 'Buttons & closure', detail: 'Work buttonholes. Sew buttons.', estimateMin: 15 },
    ] },
  ],
  'womens-aline-skirt': [
    { label: 'Construction', steps: [
      { title: 'Stitch side seams', detail: 'Join front to back at sides leaving zip opening. Press open.', estimateMin: 10 },
      { title: 'Insert zip', detail: 'Attach invisible or lapped zip at left side or centre back.', estimateMin: 20 },
      { title: 'Attach waistband', detail: 'Stitch waistband to skirt top. Turn and finish.', estimateMin: 20 },
      { title: 'Hem', detail: 'Mark even hem. Fold, press, stitch.', estimateMin: 15 },
    ] },
  ],
  'womens-shift-dress': [
    { label: 'Preparation', steps: [{ title: 'Cut all pieces', detail: 'Cut front, back, and optional lining panels.', estimateMin: 15 }] },
    { label: 'Construction', steps: [
      { title: 'Stitch shoulder seams', detail: 'Join at shoulders. Press open.', estimateMin: 8 },
      { title: 'Finish neckline & armholes', detail: 'Attach facings, understitch, press.', estimateMin: 20 },
      { title: 'Stitch side seams', detail: 'Join sides. Leave zip opening if needed.', estimateMin: 10 },
      { title: 'Zip & hem', detail: 'Insert zip. Press and stitch hem.', estimateMin: 20 },
    ] },
  ],
}

const GENERIC_STEPS: Section[] = [
  {
    label: 'General Construction',
    steps: [
      { title: 'Press all pieces before sewing', detail: 'A well-pressed seam is the sign of quality work. Press each seam after stitching.', estimateMin: 15 },
      { title: 'Stay-stitch curved edges', detail: 'Stitch 3mm inside seam allowance on necklines, armholes, and any bias-cut edges to prevent stretch.', estimateMin: 10 },
      { title: 'Assemble body, then details', detail: 'Join major body pieces first. Add collars, cuffs, pockets, and trims last.', estimateMin: 30 },
      { title: 'Final fit check', detail: 'Try the garment on a dress form or the customer before final hem and button placement.', estimateMin: 15 },
    ],
  },
]

interface SewingInstructorPanelProps {
  garmentType: GarmentType
  className?: string
}

export function SewingInstructorPanel({ garmentType, className }: SewingInstructorPanelProps): JSX.Element {
  const sections = INSTRUCTIONS[garmentType] ?? GENERIC_STEPS
  const [openSections, setOpenSections] = useState<Set<number>>(new Set([0]))
  const [openSteps, setOpenSteps] = useState<Set<string>>(new Set())

  const totalMin = sections.flatMap(s => s.steps).reduce((acc, step) => acc + (step.estimateMin ?? 0), 0)

  const toggleSection = (i: number): void => {
    setOpenSections(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  const toggleStep = (key: string): void => {
    setOpenSteps(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <div className={`bg-white rounded-2xl border border-surface-muted overflow-hidden ${className ?? ''}`}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-surface-muted bg-surface-subtle">
        <BookOpen size={13} className="text-brand-mid" />
        <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider flex-1">
          AI Sewing Instructor
        </span>
        <span className="flex items-center gap-1 text-[10px] font-medium text-brand-mid bg-brand-mid/10 rounded-full px-1.5 py-0.5">
          <Sparkles size={9} />
          Rule-based · AI-ready
        </span>
      </div>

      {/* Time estimate */}
      {totalMin > 0 && (
        <div className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 border-b border-amber-100">
          <Clock size={11} className="text-amber-600" />
          <span className="text-[11px] text-amber-700">
            Estimated sewing time: <strong>{totalMin >= 60 ? `${Math.floor(totalMin / 60)}h ${totalMin % 60}m` : `${totalMin} min`}</strong>
          </span>
        </div>
      )}

      {/* Instruction sections */}
      <div className="divide-y divide-surface-muted">
        {sections.map((section, si) => {
          const isOpen = openSections.has(si)
          return (
            <div key={section.label}>
              <button
                type="button"
                className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-surface-subtle transition-colors"
                onClick={() => toggleSection(si)}
              >
                {isOpen
                  ? <ChevronDown size={13} className="text-text-muted flex-shrink-0" />
                  : <ChevronRight size={13} className="text-text-muted flex-shrink-0" />
                }
                <span className="text-xs font-semibold text-text-primary flex-1">{section.label}</span>
                <span className="text-[10px] text-text-muted">{section.steps.length} step{section.steps.length !== 1 ? 's' : ''}</span>
              </button>

              {isOpen && (
                <div className="pb-2 px-4 space-y-1.5">
                  {section.steps.map((step, sti) => {
                    const key = `${si}-${sti}`
                    const stepOpen = openSteps.has(key)
                    return (
                      <div key={key} className="rounded-xl border border-surface-muted overflow-hidden">
                        <button
                          type="button"
                          className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-surface-subtle transition-colors"
                          onClick={() => toggleStep(key)}
                        >
                          <div className="w-5 h-5 rounded-full bg-brand-mid/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-[9px] font-bold text-brand-mid">{sti + 1}</span>
                          </div>
                          <span className="text-[11px] font-medium text-text-body flex-1 text-left">{step.title}</span>
                          {step.estimateMin && (
                            <span className="text-[9px] text-text-muted flex-shrink-0">{step.estimateMin}m</span>
                          )}
                          {stepOpen
                            ? <ChevronDown size={11} className="text-text-muted flex-shrink-0" />
                            : <ChevronRight size={11} className="text-text-muted flex-shrink-0" />
                          }
                        </button>
                        {stepOpen && (
                          <div className="px-3 pb-3 space-y-2 bg-surface-subtle">
                            <p className="text-[11px] text-text-body">{step.detail}</p>
                            {step.tip && (
                              <div className="flex items-start gap-1.5 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1.5">
                                <span className="text-[9px] font-bold text-amber-600 uppercase tracking-wide flex-shrink-0 mt-0.5">Tip</span>
                                <p className="text-[10px] text-amber-700">{step.tip}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-surface-muted bg-amber-50">
        <p className="text-[9px] text-amber-700 text-center">
          Rule-based instructions · AI personalisation coming soon
        </p>
      </div>
    </div>
  )
}
