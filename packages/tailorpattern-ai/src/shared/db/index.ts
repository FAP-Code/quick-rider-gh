import Dexie, { type Table } from 'dexie'
import type { Business } from '../types/common.types'
import type { SyncQueueItem } from '../types/api.types'
import type { Customer } from '../../features/customers/types/customer.types'
import type { MeasurementSet } from '../../features/measurements/types/measurement.types'
import type { PatternProject } from '../../features/patterns/types/pattern.types'
import { DB_VERSION, DB_INDEXES } from './schema'

export class TailorPatternDB extends Dexie {
  businesses!: Table<Business>
  customers!: Table<Customer>
  measurementSets!: Table<MeasurementSet>
  patternProjects!: Table<PatternProject>
  syncQueue!: Table<SyncQueueItem>

  constructor() {
    super('TailorPatternAI')

    this.version(DB_VERSION).stores(DB_INDEXES)
  }
}

export const db = new TailorPatternDB()

export type { Business, Customer, MeasurementSet, PatternProject, SyncQueueItem }
