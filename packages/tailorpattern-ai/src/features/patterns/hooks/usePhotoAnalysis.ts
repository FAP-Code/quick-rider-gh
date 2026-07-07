import { useState, useCallback } from 'react'
import { analyzePhoto as analyzePhotoService } from '../services/photoAnalysisService'
import type { PhotoAnalysisResult, AnalysisStatus } from '../types/photoAnalysis.types'
import type { InputMethod } from '../types/pattern.types'

interface UsePhotoAnalysisReturn {
  status: AnalysisStatus
  result: PhotoAnalysisResult | null
  error: string | null
  analyzePhoto: (dataUrl: string, method: InputMethod) => Promise<void>
  reset: () => void
}

export function usePhotoAnalysis(): UsePhotoAnalysisReturn {
  const [status, setStatus] = useState<AnalysisStatus>('idle')
  const [result, setResult] = useState<PhotoAnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const analyzePhoto = useCallback(async (dataUrl: string, method: InputMethod): Promise<void> => {
    setStatus('loading')
    setResult(null)
    setError(null)
    try {
      const r = await analyzePhotoService(dataUrl, method)
      setResult(r)
      setStatus('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
      setStatus('error')
    }
  }, [])

  const reset = useCallback((): void => {
    setStatus('idle')
    setResult(null)
    setError(null)
  }, [])

  return { status, result, error, analyzePhoto, reset }
}
