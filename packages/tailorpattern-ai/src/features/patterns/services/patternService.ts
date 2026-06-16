import { db } from '../../../shared/db'
import { generateId, nowISO } from '../../../shared/utils/uuid'
import { enqueue } from '../../../shared/sync/syncQueue'
import { generatePattern } from '../engine'
import type { PatternProject, PatternData, GarmentType, StyleParameters } from '../types/pattern.types'
import type { MeasurementData } from '../../measurements/types/measurement.types'

export async function getPatternProjects(businessId: string): Promise<PatternProject[]> {
  return db.patternProjects
    .where('businessId')
    .equals(businessId)
    .filter(p => !p.deletedAt)
    .reverse()
    .sortBy('createdAt')
}

export async function getPatternProject(id: string): Promise<PatternProject | undefined> {
  return db.patternProjects.get(id)
}

export async function getPatternProjectsByCustomer(
  customerId: string,
): Promise<PatternProject[]> {
  return db.patternProjects
    .where('customerId')
    .equals(customerId)
    .filter(p => !p.deletedAt)
    .toArray()
}

export async function createPatternProject(
  businessId: string,
  customerId: string,
  measurementSetId: string,
  name: string,
  garmentType: GarmentType,
  styleParameters: StyleParameters,
): Promise<PatternProject> {
  const now = nowISO()
  const project: PatternProject = {
    id: generateId(),
    businessId,
    customerId,
    measurementSetId,
    name,
    garmentType,
    styleParameters,
    status: 'draft',
    version: 1,
    createdAt: now,
    updatedAt: now,
  }
  await db.patternProjects.add(project)
  await enqueue('create', 'patternProjects', project.id, project)
  return project
}

export async function generateAndSavePattern(
  projectId: string,
  measurements: MeasurementData,
  seamAllowance = 1.5,
): Promise<PatternData> {
  const project = await db.patternProjects.get(projectId)
  if (!project) throw new Error('Pattern project not found')

  const { pieces, warnings } = generatePattern(project.garmentType, {
    measurements,
    params: project.styleParameters as StyleParameters,
    seamAllowance,
  })

  const patternData: PatternData = {
    garmentType: project.garmentType,
    pieces,
    styleParameters: project.styleParameters as StyleParameters,
    seamAllowance,
    unit: measurements.unit,
    generatedAt: nowISO(),
    version: project.version,
  }

  if (warnings.length > 0) {
    console.warn('[Pattern Engine]', warnings)
  }

  await db.patternProjects.update(projectId, {
    patternData: patternData as unknown,
    status: 'generated',
    updatedAt: nowISO(),
  })

  return patternData
}

export async function updatePatternStatus(
  id: string,
  status: PatternProject['status'],
): Promise<void> {
  await db.patternProjects.update(id, { status, updatedAt: nowISO() })
}

export async function deletePatternProject(id: string): Promise<void> {
  await db.patternProjects.update(id, { deletedAt: nowISO(), updatedAt: nowISO() })
}

export async function getPatternCount(businessId: string): Promise<number> {
  return db.patternProjects
    .where('businessId')
    .equals(businessId)
    .filter(p => !p.deletedAt)
    .count()
}
