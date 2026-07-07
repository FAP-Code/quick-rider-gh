import { useRef, useState, useCallback, type DragEvent, type ChangeEvent } from 'react'
import { Upload, X, ImageIcon, AlertCircle } from 'lucide-react'
import { cn } from '../../../shared/utils/cn'

interface ImageMeta {
  name: string
  sizeKb: number
  width: number
  height: number
}

interface PhotoUploadZoneProps {
  dataUrl: string | null
  onChange: (dataUrl: string | null, meta: ImageMeta | null) => void
  label?: string
  className?: string
}

const MAX_SIZE_MB = 10

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => resolve({ width: 0, height: 0 })
    img.src = dataUrl
  })
}

export function PhotoUploadZone({ dataUrl, onChange, label = 'photo', className }: PhotoUploadZoneProps): JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [meta, setMeta] = useState<ImageMeta | null>(null)

  const processFile = useCallback(async (file: File) => {
    setError(null)
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, WEBP, etc.)')
      return
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Image must be under ${MAX_SIZE_MB} MB`)
      return
    }
    const url = await readFileAsDataUrl(file)
    const { width, height } = await getImageDimensions(url)
    const fileMeta: ImageMeta = { name: file.name, sizeKb: Math.round(file.size / 1024), width, height }
    setMeta(fileMeta)
    onChange(url, fileMeta)
  }, [onChange])

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) void processFile(file)
  }, [processFile])

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) void processFile(file)
  }, [processFile])

  const handleClear = (): void => {
    setMeta(null)
    setError(null)
    onChange(null, null)
    if (inputRef.current) inputRef.current.value = ''
  }

  if (dataUrl) {
    return (
      <div className={cn('relative rounded-2xl overflow-hidden border border-surface-muted group', className)}>
        <img src={dataUrl} alt={`Uploaded ${label}`} className="w-full max-h-64 object-contain bg-surface-subtle" />
        <div className="absolute inset-0 bg-brand-navy/0 group-hover:bg-brand-navy/20 transition-colors" />
        <button
          onClick={handleClear}
          className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-card opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
          title="Remove photo"
        >
          <X size={14} className="text-text-muted" />
        </button>
        {meta && (
          <div className="absolute bottom-0 left-0 right-0 bg-brand-navy/70 backdrop-blur-sm px-3 py-1.5 flex items-center gap-3">
            <ImageIcon size={12} className="text-white/70 flex-shrink-0" />
            <span className="text-[11px] text-white/90 truncate">{meta.name}</span>
            <span className="text-[11px] text-white/60 flex-shrink-0">{meta.width}×{meta.height}</span>
            <span className="text-[11px] text-white/60 flex-shrink-0 ml-auto">{meta.sizeKb} KB</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-8 cursor-pointer transition-all',
          dragging
            ? 'border-brand-gold bg-brand-gold/5 scale-[1.01]'
            : 'border-surface-muted bg-surface-subtle hover:border-brand-mid/40 hover:bg-brand-mid/5',
        )}
      >
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center transition-colors',
          dragging ? 'bg-brand-gold/20 text-brand-gold' : 'bg-surface-muted text-text-muted',
        )}>
          <Upload size={18} />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-text-primary">
            {dragging ? 'Drop to upload' : `Upload ${label}`}
          </p>
          <p className="text-xs text-text-muted mt-0.5">Drag & drop or click · JPG, PNG, WEBP up to {MAX_SIZE_MB} MB</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleChange}
        />
      </div>
      {error && (
        <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2">
          <AlertCircle size={13} className="flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  )
}
