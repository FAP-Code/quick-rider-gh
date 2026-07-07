export type ID = string
export type ISODateString = string

export interface BaseEntity {
  id: ID
  createdAt: ISODateString
  updatedAt: ISODateString
}

export interface SoftDeletable {
  deletedAt?: ISODateString
}

export type Currency = 'GBP' | 'USD' | 'EUR' | 'GHS' | 'NGN' | 'KES' | 'ZAR'
export type CountryCode = string
export type Unit = 'cm' | 'inches'

export type SubscriptionTier = 'starter' | 'professional' | 'studio' | 'enterprise'

export interface BusinessSettings {
  defaultUnit: Unit
  defaultSeamAllowance: number
  defaultPaperSize: 'A4' | 'letter'
  defaultEasePreference: 'slim' | 'regular' | 'relaxed'
  alwaysIncludeSeamAllowances: boolean
  theme: 'light' | 'dark' | 'system'
  compactMode: boolean
}

export interface Business extends BaseEntity {
  name: string
  ownerName: string
  email: string
  phone?: string
  currency: Currency
  country: CountryCode
  subscriptionTier: SubscriptionTier
  settings: BusinessSettings
  onboardingCompleted: boolean
}

export const DEFAULT_BUSINESS_SETTINGS: BusinessSettings = {
  defaultUnit: 'cm',
  defaultSeamAllowance: 1.5,
  defaultPaperSize: 'A4',
  defaultEasePreference: 'regular',
  alwaysIncludeSeamAllowances: true,
  theme: 'system',
  compactMode: false,
}
