import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { generateAndSavePattern } from '../services/patternService'
import { PATTERNS_KEY } from './usePatternProjects'
import { useAuth } from '../../auth/useAuth'
import type { MeasurementData } from '../../measurements/types/measurement.types'

export function usePatternGenerator(projectId: string) {
  const qc = useQueryClient()
  const { business } = useAuth()
  const seamAllowance = business?.settings.defaultSeamAllowance ?? 1.5

  return useMutation({
    mutationFn: (measurements: MeasurementData) =>
      generateAndSavePattern(projectId, measurements, seamAllowance),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [PATTERNS_KEY, projectId] })
      toast.success('Pattern generated successfully')
    },
    onError: (err) => {
      console.error('[Pattern Generator]', err)
      toast.error('Pattern generation failed — check your measurements')
    },
  })
}
