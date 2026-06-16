import type { MeasurementData } from '../../measurements/types/measurement.types'
import type { StyleParameters, PatternPiece, GarmentType } from '../types/pattern.types'

export interface EngineInput {
  measurements: MeasurementData
  params: StyleParameters
  seamAllowance: number
}

export interface EngineOutput {
  pieces: PatternPiece[]
  warnings: string[]
}

export type GarmentEngine = (input: EngineInput) => EngineOutput

export interface EaseValues {
  chest: number
  waist: number
  hips: number
  sleeve: number
  armhole: number
  length: number
}

export function getEaseValues(preference: 'slim' | 'regular' | 'relaxed' = 'regular'): EaseValues {
  const tables: Record<typeof preference, EaseValues> = {
    slim: { chest: 4, waist: 2, hips: 4, sleeve: 2, armhole: 1.5, length: 0 },
    regular: { chest: 8, waist: 4, hips: 6, sleeve: 3, armhole: 2, length: 0 },
    relaxed: { chest: 12, waist: 8, hips: 10, sleeve: 4, armhole: 3, length: 2 },
  }
  return tables[preference]
}

export function cm(v: number): number {
  return Math.round(v * 10) / 10
}

export function ensurePositive(v: number, fallback: number): number {
  return v > 0 ? v : fallback
}
