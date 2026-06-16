import { createContext, useState, useEffect, type ReactNode } from 'react'
import { db } from '../../shared/db'
import { generateId, nowISO } from '../../shared/utils/uuid'
import type { AuthContextValue, AuthUser } from './types'
import type { Business } from '../../shared/types/common.types'
import { DEFAULT_BUSINESS_SETTINGS } from '../../shared/types/common.types'

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
      setBusiness(biz)
      // Sync Phase1 user name from business
      PHASE1_USER.name = biz.ownerName
      PHASE1_USER.email = biz.email
      setIsLoading(false)
    }
    void init()
  }, [])

  const updateBusiness = async (updates: Partial<Business>): Promise<void> => {
    const updated: Business = {
      ...(business ?? {
        id: PHASE1_BUSINESS_ID,
        name: '',
        ownerName: '',
        email: '',
        currency: 'GBP',
        country: 'GB',
        subscriptionTier: 'starter' as const,
        settings: DEFAULT_BUSINESS_SETTINGS,
        onboardingCompleted: false,
        createdAt: nowISO(),
        updatedAt: nowISO(),
      }),
      ...updates,
      id: PHASE1_BUSINESS_ID,
      updatedAt: nowISO(),
    }
    await db.businesses.put(updated)
    setBusiness(updated)
  }

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
