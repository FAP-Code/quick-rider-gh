import { useState, useEffect, useRef } from 'react'
import { RotateCcw, Play, Pause, Boxes } from 'lucide-react'
import { DigitalTwinSVG } from './DigitalTwinSVG'
import type { MeasurementData } from '../../measurements/types/measurement.types'

interface AvatarPreviewCardProps {
  measurements: MeasurementData
  className?: string
}

const VIEWS = [
  { label: 'Front', rotateY: 0 },
  { label: '45°',   rotateY: 45 },
  { label: 'Side',  rotateY: 90 },
  { label: '135°',  rotateY: 135 },
  { label: 'Back',  rotateY: 180 },
  { label: '225°',  rotateY: 225 },
  { label: 'Side',  rotateY: 270 },
  { label: '315°',  rotateY: 315 },
]

export function AvatarPreviewCard({ measurements, className }: AvatarPreviewCardProps): JSX.Element {
  const [viewIdx, setViewIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // VIEWS is a non-empty const tuple; viewIdx is always in range
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const view = (VIEWS[viewIdx] ?? VIEWS[0])!

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setViewIdx(i => (i + 1) % VIEWS.length)
      }, 800)
    } else {
      if (intervalRef.current !== null) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current !== null) clearInterval(intervalRef.current) }
  }, [playing])

  const isAngled = view.rotateY !== 0 && view.rotateY !== 180
  const isSide   = view.rotateY === 90 || view.rotateY === 270
  const isBack   = view.rotateY === 180

  // CSS 3D perspective effect on the SVG wrapper
  const scaleX = isSide ? 0.18 : isAngled ? 0.65 : 1
  const opacity = isSide ? 0.55 : isAngled ? 0.82 : 1
  const shadowBlur = isSide ? 2 : 8

  return (
    <div className={`bg-white rounded-2xl border border-surface-muted overflow-hidden ${className ?? ''}`}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-surface-muted bg-surface-subtle">
        <Boxes size={13} className="text-brand-mid" />
        <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider flex-1">
          3D Avatar Preview
        </span>
        <span className="text-[10px] font-medium text-amber-700 bg-amber-100 rounded-full px-1.5 py-0.5">
          Coming Soon
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* 3D viewport */}
        <div
          className="relative rounded-xl bg-gradient-to-b from-surface-subtle to-slate-100 overflow-hidden flex items-center justify-center"
          style={{ height: 220, perspective: '400px' }}
        >
          {/* Ground shadow */}
          <div
            className="absolute bottom-5 rounded-full bg-black/10 transition-all duration-700"
            style={{
              width: `${80 * scaleX}px`,
              height: 8,
              filter: `blur(${shadowBlur}px)`,
            }}
          />

          {/* Figure */}
          <div
            className="transition-all duration-700 ease-in-out"
            style={{
              transform: `scaleX(${scaleX}) ${isBack ? 'scaleX(-1)' : ''}`,
              opacity,
              filter: isSide ? 'brightness(0.75)' : 'none',
            }}
          >
            {isSide ? (
              // Side view: show a narrow silhouette strip
              <div
                className="bg-slate-300 rounded-sm mx-auto"
                style={{ width: 18, height: 170, opacity: 0.8 }}
              />
            ) : (
              <DigitalTwinSVG
                measurements={measurements}
                showAnnotations={false}
                className="w-24 block"
              />
            )}
          </div>

          {/* View label overlay */}
          <div className="absolute top-2 left-2 bg-black/20 backdrop-blur-sm rounded-md px-2 py-0.5">
            <span className="text-[10px] text-white font-semibold">{view.label} view</span>
          </div>

          {/* Coming soon watermark */}
          <div className="absolute bottom-2 right-2">
            <span className="text-[9px] text-text-muted italic">Placeholder · real 3D coming</span>
          </div>
        </div>

        {/* View selector dots */}
        <div className="flex justify-center gap-1">
          {VIEWS.map((v, i) => (
            <button
              key={v.rotateY}
              type="button"
              onClick={() => { setPlaying(false); setViewIdx(i) }}
              className={`w-2 h-2 rounded-full transition-all ${
                i === viewIdx ? 'bg-brand-gold scale-125' : 'bg-surface-muted hover:bg-slate-300'
              }`}
              aria-label={`${v.label} view`}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => { setPlaying(false); setViewIdx(0) }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-subtle hover:bg-surface-muted transition-colors text-[11px] text-text-muted"
          >
            <RotateCcw size={10} />
            Reset
          </button>
          <button
            type="button"
            onClick={() => setPlaying(p => !p)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors text-[11px] font-medium ${
              playing
                ? 'bg-brand-mid text-white'
                : 'bg-surface-subtle hover:bg-surface-muted text-text-muted'
            }`}
          >
            {playing ? <Pause size={10} /> : <Play size={10} />}
            {playing ? 'Pause' : 'Rotate'}
          </button>
        </div>

        {/* Info strip */}
        <div className="rounded-xl bg-brand-mid/5 border border-brand-mid/10 px-3 py-2 space-y-1">
          <p className="text-[10px] font-semibold text-brand-mid">What's coming in Phase 3D</p>
          <ul className="space-y-0.5">
            {[
              'Full 360° photorealistic cloth simulation',
              'Fabric drape & texture preview',
              'Pattern piece overlay on avatar',
              'Pose and proportion adjustment',
            ].map(f => (
              <li key={f} className="flex items-center gap-1.5 text-[10px] text-text-muted">
                <div className="w-1 h-1 rounded-full bg-brand-gold flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-surface-muted bg-amber-50">
        <p className="text-[9px] text-amber-700 text-center">
          CSS perspective simulation only · no real 3D rendering yet
        </p>
      </div>
    </div>
  )
}
