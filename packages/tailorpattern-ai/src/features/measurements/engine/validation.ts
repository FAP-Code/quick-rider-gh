import type { MeasurementData } from '../types/measurement.types'
import type { MeasurementWarning } from '../types/measurement.types'
import { convertMeasurement } from '../../../shared/utils/format'

export function validateMeasurements(
  data: MeasurementData,
  unit: 'cm' | 'inches',
): MeasurementWarning[] {
  const warnings: MeasurementWarning[] = []

  // Normalize to cm for validation
  const toCm = (val?: number): number | undefined =>
    val === undefined ? undefined : convertMeasurement(val, unit, 'cm')

  const chest = toCm(data.chest)
  const waist = toCm(data.waist)
  const hips = toCm(data.hips)
  const backBody = toCm(data.backBodyLength)
  const sleeveLength = toCm(data.sleeveLength)

  if (chest !== undefined && (chest < 60 || chest > 180)) {
    warnings.push({
      field: 'chest',
      message: `Chest measurement (${chest}cm) is outside the typical range of 60–180cm. Please verify.`,
    })
  }

  if (waist !== undefined && chest !== undefined && waist > chest + 20) {
    warnings.push({
      field: 'waist',
      message: `Waist (${waist}cm) is more than 20cm larger than chest (${chest}cm). Please verify both measurements.`,
    })
  }

  if (backBody !== undefined && backBody > 60) {
    warnings.push({
      field: 'backBodyLength',
      message: `Back body length (${backBody}cm) seems unusually large. Typical range is 35–50cm.`,
    })
  }

  if (sleeveLength !== undefined && (sleeveLength < 40 || sleeveLength > 75)) {
    warnings.push({
      field: 'sleeveLength',
      message: `Sleeve length (${sleeveLength}cm) is outside the typical range of 40–75cm.`,
    })
  }

  if (hips !== undefined && waist !== undefined && hips < waist) {
    warnings.push({
      field: 'hips',
      message: `Hips (${hips}cm) should generally be larger than waist (${waist}cm).`,
    })
  }

  return warnings
}
