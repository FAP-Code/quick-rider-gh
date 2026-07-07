import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { db } from '../../shared/db'
import { nowISO } from '../../shared/utils/uuid'
import { DEFAULT_BUSINESS_SETTINGS } from '../../shared/types/common.types'
import type { AuthContextValue, AuthUser } from './types'
import type { Business } from '../../shared/types/common.types'

export const AuthContext = createContext<AuthContextValue | null>(null)

const PHASE1_BUSINESS_ID = 'local-business-001'

const PHASE1_USER: AuthUser = {
  id: 'local-user-001',
  name: 'Business Owner',
  email: '',
  role: 'owner',
  businessId: PHASE1_BUSINESS_ID,
}

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [business, setBusiness] = useState<Business | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const init = async (): Promise<void> => {
      let biz = await db.businesses.get(PHASE1_BUSINESS_ID)
      if (!biz) {
        biz = {
          id: PHASE1_BUSINESS_ID,
          name: 'My Tailoring Business',
          ownerName: 'Business Owner',
          email: '',
          currency: 'GBP',
          country: 'GB',
          subscriptionTier: 'starter',
          settings: DEFAULT_BUSINESS_SETTINGS,
          onboardingCompleted: false,
          createdAt: nowISO(),
          updatedAt: nowISO(),
        }
        await db.businesses.add(biz)
      }
      PHASE1_USER.name = biz.ownerName
      PHASE1_USER.email = biz.email
      setBusiness(biz)
      setIsLoading(false)
    }
    void init()
  }, [])

  const updateBusiness = useCallback(async (updates: Partial<Business>): Promise<void> => {
    if (!business) return
    const updated: Business = {
      ...business,
      ...updates,
      id: PHASE1_BUSINESS_ID,
      updatedAt: nowISO(),
    }
    await db.businesses.put(updated)
    setBusiness(updated)
  }, [business])

  return (
    <AuthContext.Provider
      value={{
        user: PHASE1_USER,
        business,
        businessId: PHASE1_BUSINESS_ID,
        isLoading,
        updateBusiness,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
