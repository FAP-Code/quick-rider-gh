import { Pencil, Minus, Square, Circle, Undo2, Redo2, Trash2, Download } from 'lucide-react'
import { cn } from '../../../shared/utils/cn'

export type SketchTool = 'pencil' | 'line' | 'rect' | 'circle'

const COLORS = [
  { value: '#1A1A2E', label: 'Navy' },
  { value: '#000000', label: 'Black' },
  { value: '#C9A84C', label: 'Gold' },
  { value: '#EF4444', label: 'Red' },
  { value: '#3B82F6', label: 'Blue' },
  { value: '#22C55E', label: 'Green' },
]

const WIDTHS: Array<{ value: number; label: string }> = [
  { value: 1, label: 'Thin' },
  { value: 3, label: 'Medium' },
  { value: 6, label: 'Thick' },
]

interface SketchToolbarProps {
  tool: SketchTool
  onToolChange: (t: SketchTool) => void
  color: string
  onColorChange: (c: string) => void
  strokeWidth: number
  onStrokeWidthChange: (w: number) => void
  onUndo: () => void
  onRedo: () => void
  onClear: () => void
  onExport: () => void
}

export function SketchToolbar({
  tool,
  onToolChange,
  color,
  onColorChange,
  strokeWidth,
  onStrokeWidthChange,
  onUndo,
  onRedo,
  onClear,
  onExport,
}: SketchToolbarProps): JSX.Element {
  const toolButtons: Array<{ id: SketchTool; Icon: typeof Pencil; label: string }> = [
    { id: 'pencil', Icon: Pencil, label: 'Freehand' },
    { id: 'line', Icon: Minus, label: 'Line' },
    { id: 'rect', Icon: Square, label: 'Rectangle' },
    { id: 'circle', Icon: Circle, label: 'Circle' },
  ]

  return (
    <div className="flex items-center gap-3 p-2 bg-white border border-b-0 border-surface-muted rounded-t-2xl flex-wrap">
      {/* Tools */}
      <div className="flex gap-0.5">
        {toolButtons.map(({ id, Icon, label }) => (
          <button
            key={id}
            onClick={() => onToolChange(id)}
            title={label}
            className={cn(
              'p-2 rounded-lg transition-colors',
              tool === id
                ? 'bg-brand-navy text-white'
                : 'text-text-muted hover:bg-surface-muted',
            )}
          >
            <Icon size={15} />
          </button>
        ))}
      </div>

      {/* Colors */}
      <div className="flex gap-1">
        {COLORS.map(c => (
          <button
            key={c.value}
            onClick={() => onColorChange(c.value)}
            title={c.label}
            className={cn(
              'w-5 h-5 rounded-full border-2 transition-transform',
              color === c.value ? 'border-brand-gold scale-110' : 'border-transparent',
            )}
            style={{ backgroundColor: c.value }}
          />
        ))}
      </div>

      {/* Stroke widths */}
      <div className="flex items-center gap-1">
        {WIDTHS.map(w => (
          <button
            key={w.value}
            onClick={() => onStrokeWidthChange(w.value)}
            title={w.label}
            className={cn(
              'flex items-center justify-center w-7 h-7 rounded-lg transition-colors',
              strokeWidth === w.value ? 'bg-brand-navy text-white' : 'hover:bg-surface-muted',
            )}
          >
            <div
              className="rounded-full bg-current"
              style={{ width: w.value + 2, height: w.value + 2 }}
            />
          </button>
        ))}
      </div>

      <div className="ml-auto flex gap-0.5">
        <button onClick={onUndo} title="Undo" className="p-2 rounded-lg hover:bg-surface-muted transition-colors text-text-muted">
          <Undo2 size={15} />
        </button>
        <button onClick={onRedo} title="Redo" className="p-2 rounded-lg hover:bg-surface-muted transition-colors text-text-muted">
          <Redo2 size={15} />
        </button>
        <button onClick={onClear} title="Clear" className="p-2 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors text-text-muted">
          <Trash2 size={15} />
        </button>
        <button onClick={onExport} title="Export PNG" className="p-2 rounded-lg hover:bg-surface-muted transition-colors text-text-muted">
          <Download size={15} />
        </button>
      </div>
    </div>
  )
}
