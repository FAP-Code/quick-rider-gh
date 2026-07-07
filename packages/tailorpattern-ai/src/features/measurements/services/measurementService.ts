import { db } from '../../../shared/db'
import { generateId, nowISO } from '../../../shared/utils/uuid'
import { enqueue } from '../../../shared/sync/syncQueue'
import type { MeasurementSet, MeasurementFormData } from '../types/measurement.types'

export async function getMeasurementSets(customerId: string): Promise<MeasurementSet[]> {
  return db.measurementSets
    .where('customerId')
    .equals(customerId)
    .reverse()
    .sortBy('takenAt')
}

export async function getMeasurementSet(id: string): Promise<MeasurementSet | undefined> {
  return db.measurementSets.get(id)
}

export async function getMeasurementCount(customerId: string): Promise<number> {
  return db.measurementSets.where('customerId').equals(customerId).count()
}

export async function createMeasurementSet(
  businessId: string,
  customerId: string,
  data: MeasurementFormData,
): Promise<MeasurementSet> {
  const now = nowISO()

  // If this is marked as default, clear existing defaults
  await db.measurementSets
    .where('customerId')
    .equals(customerId)
    .modify({ isDefault: false })

  const measurementSet: MeasurementSet = {
    id: generateId(),
    customerId,
    businessId,
    label: data.label,
    measurements: data.measurements,
    postureNotes: data.postureNotes,
    takenAt: data.takenAt,
    isDefault: true,
    createdAt: now,
    updatedAt: now,
  }

  await db.measurementSets.add(measurementSet)
  await enqueue('create', 'measurementSets', measurementSet.id, measurementSet)
  return measurementSet
}

export async function updateMeasurementSet(
  id: string,
  updates: Partial<MeasurementFormData>,
): Promise<void> {
  await db.measurementSets.update(id, { ...updates, updatedAt: nowISO() })
  await enqueue('update', 'measurementSets', id, updates)
}

export async function setDefaultMeasurementSet(
  customerId: string,
  id: string,
): Promise<void> {
  await db.measurementSets
    .where('customerId')
    .equals(customerId)
    .modify({ isDefault: false })
  await db.measurementSets.update(id, { isDefault: true, updatedAt: nowISO() })
}
