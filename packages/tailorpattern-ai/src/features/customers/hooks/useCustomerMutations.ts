import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useAuth } from '../../auth/useAuth'
import { createCustomer, updateCustomer, deleteCustomer } from '../services/customerService'
import { CUSTOMERS_QUERY_KEY } from './useCustomers'
import type { CustomerFormData } from '../types/customer.types'

export function useCreateCustomer() {
  const { businessId } = useAuth()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (data: CustomerFormData) => createCustomer(businessId, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [CUSTOMERS_QUERY_KEY] })
      toast.success('Customer added')
    },
    onError: () => toast.error('Failed to add customer'),
  })
}

export function useUpdateCustomer(id: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<CustomerFormData>) => updateCustomer(id, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [CUSTOMERS_QUERY_KEY] })
      toast.success('Customer updated')
    },
    onError: () => toast.error('Failed to update customer'),
  })
}

export function useDeleteCustomer() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteCustomer(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [CUSTOMERS_QUERY_KEY] })
      toast.success('Customer deleted')
    },
    onError: () => toast.error('Failed to delete customer'),
  })
}
