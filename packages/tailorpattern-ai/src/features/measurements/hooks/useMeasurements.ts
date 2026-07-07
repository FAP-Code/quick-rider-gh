import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useAuth } from '../../auth/useAuth'
import {
  getMeasurementSets,
  getMeasurementSet,
  createMeasurementSet,
  setDefaultMeasurementSet,
} from '../services/measurementService'
import type { MeasurementFormData } from '../types/measurement.types'

export const MEASUREMENTS_KEY = 'measurements'

export function useMeasurements(customerId: string) {
  return useQuery({
    queryKey: [MEASUREMENTS_KEY, customerId],
    queryFn: () => getMeasurementSets(customerId),
    enabled: Boolean(customerId),
  })
}

export function useMeasurement(id: string) {
  return useQuery({
    queryKey: [MEASUREMENTS_KEY, 'single', id],
    queryFn: () => getMeasurementSet(id),
    enabled: Boolean(id),
  })
}

export function useCreateMeasurement(customerId: string) {
  const { businessId } = useAuth()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (data: MeasurementFormData) =>
      createMeasurementSet(businessId, customerId, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [MEASUREMENTS_KEY, customerId] })
      toast.success('Measurements saved')
    },
    onError: () => toast.error('Failed to save measurements'),
  })
}

export function useSetDefaultMeasurement(customerId: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => setDefaultMeasurementSet(customerId, id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [MEASUREMENTS_KEY, customerId] })
      toast.success('Default measurement set updated')
    },
  })
}
