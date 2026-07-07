import type { Business } from '../../shared/types/common.types'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: 'owner' | 'manager' | 'staff'
  businessId: string
}

export interface AuthContextValue {
  user: AuthUser | null
  business: Business | null
  businessId: string
  isLoading: boolean
  updateBusiness: (updates: Partial<Business>) => Promise<void>
}
