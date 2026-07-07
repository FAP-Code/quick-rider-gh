import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useAuth } from '../../auth/useAuth'
import {
  getPatternProjects,
  getPatternProject,
  getPatternProjectsByCustomer,
  createPatternProject,
  updatePatternStatus,
} from '../services/patternService'
import type { GarmentType, StyleParameters, PatternProject } from '../types/pattern.types'

export const PATTERNS_KEY = 'patterns'

export function usePatternProjects() {
  const { businessId } = useAuth()
  return useQuery({
    queryKey: [PATTERNS_KEY, businessId],
    queryFn: () => getPatternProjects(businessId),
  })
}

export function usePatternProjectsByCustomer(customerId: string) {
  return useQuery({
    queryKey: [PATTERNS_KEY, 'customer', customerId],
    queryFn: () => getPatternProjectsByCustomer(customerId),
    enabled: Boolean(customerId),
  })
}

export function usePatternProject(id: string) {
  return useQuery({
    queryKey: [PATTERNS_KEY, id],
    queryFn: () => getPatternProject(id),
    enabled: Boolean(id),
  })
}

export function useUpdatePatternStatus(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (status: PatternProject['status']) => updatePatternStatus(id, status),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [PATTERNS_KEY, id] })
      void qc.invalidateQueries({ queryKey: [PATTERNS_KEY] })
      toast.success('Pattern status updated')
    },
    onError: () => toast.error('Failed to update status'),
  })
}

export function useCreatePatternProject() {
  const { businessId } = useAuth()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (args: {
      customerId: string
      measurementSetId: string
      name: string
      garmentType: GarmentType
      styleParameters: StyleParameters
    }) =>
      createPatternProject(
        businessId,
        args.customerId,
        args.measurementSetId,
        args.name,
        args.garmentType,
        args.styleParameters,
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [PATTERNS_KEY] })
      toast.success('Pattern project created')
    },
    onError: () => toast.error('Failed to create pattern project'),
  })
}
