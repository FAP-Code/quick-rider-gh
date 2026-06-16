import { useQuery } from '@tanstack/react-query'
import { useDebounce } from '../../../shared/hooks/useDebounce'
import { useAuth } from '../../auth/useAuth'
import { getCustomers, searchCustomers } from '../services/customerService'

export const CUSTOMERS_QUERY_KEY = 'customers'

export function useCustomers(searchQuery = '') {
  const { businessId } = useAuth()
  const debouncedQuery = useDebounce(searchQuery, 300)

  return useQuery({
    queryKey: [CUSTOMERS_QUERY_KEY, businessId, debouncedQuery],
    queryFn: () =>
      debouncedQuery
        ? searchCustomers(businessId, debouncedQuery)
        : getCustomers(businessId),
  })
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: [CUSTOMERS_QUERY_KEY, id],
    queryFn: async () => {
      const { getCustomer } = await import('../services/customerService')
      return getCustomer(id)
    },
    enabled: Boolean(id),
  })
}
