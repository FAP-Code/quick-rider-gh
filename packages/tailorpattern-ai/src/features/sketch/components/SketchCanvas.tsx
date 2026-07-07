import { useRef, useState } from 'react'
import { SketchToolbar } from './SketchToolbar'
import { useSketchCanvas } from '../hooks/useSketchCanvas'
import { cn } from '../../../shared/utils/cn'

interface SketchCanvasProps {
  onSave?: (dataUrl: string) => void
  initialDataUrl?: string
  className?: string
}

export function SketchCanvas({ onSave, initialDataUrl, className }: SketchCanvasProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { tool, setTool, color, setColor, strokeWidth, setStrokeWidth, undo, redo, clear } =
    useSketchCanvas(canvasRef, initialDataUrl)

  const [isDragging, setIsDragging] = useState(false)

  const getPos = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      const touch = e.touches[0]
      if (!touch) return null
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top }
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const handleStart = (e: React.MouseEvent | React.TouchEvent): void => {
    const pos = getPos(e)
    if (!pos) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !canvas) return
    setIsDragging(true)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
  }

  const handleMove = (e: React.MouseEvent | React.TouchEvent): void => {
    if (!isDragging) return
    const pos = getPos(e)
    if (!pos) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx) return
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = color
    ctx.lineWidth = strokeWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
  }

  const handleEnd = (): void => {
    setIsDragging(false)
    const canvas = canvasRef.current
    if (!canvas) return
    // Push to undo stack (handled in hook)
    const dataUrl = canvas.toDataURL()
    onSave?.(dataUrl)
  }

  const handleExportPNG = (): void => {
    const canvas = canvasRef.current
    if (!canvas) return
    const a = document.createElement('a')
    a.download = 'sketch.png'
    a.href = canvas.toDataURL('image/png')
    a.click()
  }

  return (
    <div className={cn('flex flex-col', className)}>
      <SketchToolbar
        tool={tool}
        onToolChange={setTool}
        color={color}
        onColorChange={setColor}
        strokeWidth={strokeWidth}
        onStrokeWidthChange={setStrokeWidth}
        onUndo={undo}
        onRedo={redo}
        onClear={clear}
        onExport={handleExportPNG}
      />
      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        className="w-full bg-white border border-surface-muted rounded-b-2xl cursor-crosshair touch-none"
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
      />
    </div>
  )
}
