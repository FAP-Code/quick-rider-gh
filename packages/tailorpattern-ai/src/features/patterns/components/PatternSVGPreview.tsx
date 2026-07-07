import { useState, useRef, useEffect, useCallback } from 'react'
import { ZoomIn, ZoomOut, Maximize2, Layers, Tag, AlignCenter } from 'lucide-react'
import { cn } from '../../../shared/utils/cn'
import { renderPatternToSVG } from '../engine/svg/svgRenderer'
import type { PatternData } from '../types/pattern.types'

interface PatternSVGPreviewProps {
  patternData: PatternData
  className?: string
}

export function PatternSVGPreview({ patternData, className }: PatternSVGPreviewProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [showSeamAllowances, setShowSeamAllowances] = useState(false)
  const [showGrainLines, setShowGrainLines] = useState(true)
  const [showLabels, setShowLabels] = useState(true)

  const svgString = renderPatternToSVG(patternData, {
    showSeamAllowances,
    showGrainLines,
    showLabels,
    scale: zoom,
  })

  const handleWheel = useCallback((e: WheelEvent): void => {
    e.preventDefault()
    setZoom(z => Math.max(0.3, Math.min(4, z - e.deltaY * 0.001)))
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  const handleMouseDown = (e: React.MouseEvent): void => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e: React.MouseEvent): void => {
    if (!isDragging) return
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
  }

  const handleMouseUp = (): void => setIsDragging(false)

  const fitToScreen = (): void => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  return (
    <div className={cn('relative bg-surface-subtle rounded-2xl overflow-hidden', className)}>
      {/* Toolbar */}
      <div className="absolute top-3 right-3 z-10 flex gap-1">
        <div className="bg-white rounded-xl shadow-card flex gap-0.5 p-1">
          <button
            onClick={() => setZoom(z => Math.min(4, z + 0.2))}
            className="p-1.5 rounded-lg hover:bg-surface-subtle transition-colors"
            title="Zoom in"
          >
            <ZoomIn size={14} />
          </button>
          <span className="text-xs text-text-muted px-1 self-center font-measurement">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(z => Math.max(0.3, z - 0.2))}
            className="p-1.5 rounded-lg hover:bg-surface-subtle transition-colors"
            title="Zoom out"
          >
            <ZoomOut size={14} />
          </button>
          <button
            onClick={fitToScreen}
            className="p-1.5 rounded-lg hover:bg-surface-subtle transition-colors"
            title="Fit to screen"
          >
            <Maximize2 size={14} />
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-card flex gap-0.5 p-1">
          <button
            onClick={() => setShowSeamAllowances(v => !v)}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              showSeamAllowances ? 'bg-brand-gold/15 text-brand-gold' : 'hover:bg-surface-subtle text-text-muted',
            )}
            title="Toggle seam allowances"
          >
            <Layers size={14} />
          </button>
          <button
            onClick={() => setShowGrainLines(v => !v)}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              showGrainLines ? 'bg-brand-gold/15 text-brand-gold' : 'hover:bg-surface-subtle text-text-muted',
            )}
            title="Toggle grain lines"
          >
            <AlignCenter size={14} />
          </button>
          <button
            onClick={() => setShowLabels(v => !v)}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              showLabels ? 'bg-brand-gold/15 text-brand-gold' : 'hover:bg-surface-subtle text-text-muted',
            )}
            title="Toggle labels"
          >
            <Tag size={14} />
          </button>
        </div>
      </div>

      {/* Piece count */}
      <div className="absolute top-3 left-3 z-10">
        <span className="bg-white rounded-xl shadow-card px-2.5 py-1.5 text-xs font-medium text-text-muted">
          {patternData.pieces.length} piece{patternData.pieces.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* SVG Canvas */}
      <div
        ref={containerRef}
        className={cn(
          'w-full h-full min-h-[400px] overflow-hidden cursor-grab select-none',
          isDragging && 'cursor-grabbing',
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            transition: isDragging ? 'none' : 'transform 0.1s ease',
          }}
          dangerouslySetInnerHTML={{ __html: svgString }}
        />
      </div>
    </div>
  )
}
