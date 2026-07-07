import { useState, useEffect, useCallback, type RefObject } from 'react'
import type { SketchTool } from '../components/SketchToolbar'

const MAX_UNDO = 50

export function useSketchCanvas(
  canvasRef: RefObject<HTMLCanvasElement>,
  initialDataUrl?: string,
) {
  const [tool, setTool] = useState<SketchTool>('pencil')
  const [color, setColor] = useState('#1A1A2E')
  const [strokeWidth, setStrokeWidth] = useState(3)
  const [undoStack, setUndoStack] = useState<ImageData[]>([])
  const [redoStack, setRedoStack] = useState<ImageData[]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    if (initialDataUrl) {
      const img = new Image()
      img.onload = (): void => {
        ctx.drawImage(img, 0, 0)
      }
      img.src = initialDataUrl
    } else {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
  }, [canvasRef, initialDataUrl])

  const saveState = useCallback((): void => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !canvas) return
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    setUndoStack(prev => [...prev.slice(-MAX_UNDO + 1), imageData])
    setRedoStack([])
  }, [canvasRef])

  const undo = useCallback((): void => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !canvas || undoStack.length === 0) return

    const lastState = undoStack[undoStack.length - 1]
    const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height)

    setRedoStack(prev => [...prev, currentState])
    if (lastState) ctx.putImageData(lastState, 0, 0)
    setUndoStack(prev => prev.slice(0, -1))
  }, [canvasRef, undoStack])

  const redo = useCallback((): void => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !canvas || redoStack.length === 0) return

    const nextState = redoStack[redoStack.length - 1]
    const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height)

    setUndoStack(prev => [...prev, currentState])
    if (nextState) ctx.putImageData(nextState, 0, 0)
    setRedoStack(prev => prev.slice(0, -1))
  }, [canvasRef, redoStack])

  const clear = useCallback((): void => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !canvas) return
    saveState()
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [canvasRef, saveState])

  return {
    tool, setTool,
    color, setColor,
    strokeWidth, setStrokeWidth,
    undo, redo, clear,
    saveState,
  }
}
