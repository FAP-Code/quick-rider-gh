import type { Business } from '../types/common.types'
import type { SyncQueueItem } from '../types/api.types'

export type { Business, SyncQueueItem }

// Re-export for DI — feature types are imported directly by the db instance
export const DB_VERSION = 1

export const DB_INDEXES = {
  businesses: 'id',
  customers: 'id, businessId, fullName, [businessId+isActive], deletedAt',
  measurementSets: 'id, customerId, businessId, takenAt, isDefault',
  patternProjects: 'id, businessId, customerId, measurementSetId, status, createdAt, deletedAt',
  syncQueue: 'id, table, operation, attempts, createdAt',
} as const
