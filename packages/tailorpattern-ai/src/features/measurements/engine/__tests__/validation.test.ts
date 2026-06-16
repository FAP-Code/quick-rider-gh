import { describe, it, expect } from 'vitest'
import { validateMeasurements } from '../validation'
import type { MeasurementData } from '../../types/measurement.types'

const TYPICAL: MeasurementData = {
  unit: 'cm',
  chest: 96,
  waist: 80,
  hips: 100,
  backBodyLength: 44,
  sleeveLength: 64,
}

describe('validateMeasurements()', () => {
  it('returns no warnings for typical measurements', () => {
    expect(validateMeasurements(TYPICAL, 'cm')).toHaveLength(0)
  })

  it('returns no warnings when only unit is provided', () => {
    expect(validateMeasurements({ unit: 'cm' }, 'cm')).toHaveLength(0)
  })

  // ── Chest validation ─────────────────────────────────────────────────────
  it('warns when chest < 60cm', () => {
    const warnings = validateMeasurements({ ...TYPICAL, chest: 55 }, 'cm')
    expect(warnings.some(w => w.field === 'chest')).toBe(true)
  })

  it('warns when chest > 180cm', () => {
    const warnings = validateMeasurements({ ...TYPICAL, chest: 185 }, 'cm')
    expect(warnings.some(w => w.field === 'chest')).toBe(true)
  })

  it('does not warn at the chest boundary values 60cm and 180cm', () => {
    expect(validateMeasurements({ ...TYPICAL, chest: 60 }, 'cm')).toHaveLength(0)
    expect(validateMeasurements({ ...TYPICAL, chest: 180 }, 'cm')).toHaveLength(0)
  })

  // ── Waist vs chest validation ─────────────────────────────────────────────
  it('warns when waist is more than 20cm larger than chest', () => {
    const warnings = validateMeasurements({ ...TYPICAL, chest: 80, waist: 102 }, 'cm')
    expect(warnings.some(w => w.field === 'waist')).toBe(true)
  })

  it('does not warn when waist is exactly 20cm larger than chest', () => {
    const warnings = validateMeasurements({ ...TYPICAL, chest: 80, waist: 100 }, 'cm')
    expect(warnings.every(w => w.field !== 'waist')).toBe(true)
  })

  // ── Back body length ──────────────────────────────────────────────────────
  it('warns when backBodyLength exceeds 60cm', () => {
    const warnings = validateMeasurements({ ...TYPICAL, backBodyLength: 65 }, 'cm')
    expect(warnings.some(w => w.field === 'backBodyLength')).toBe(true)
  })

  it('does not warn at 60cm back body length', () => {
    const warnings = validateMeasurements({ ...TYPICAL, backBodyLength: 60 }, 'cm')
    expect(warnings.every(w => w.field !== 'backBodyLength')).toBe(true)
  })

  // ── Sleeve length ─────────────────────────────────────────────────────────
  it('warns when sleeveLength < 40cm', () => {
    const warnings = validateMeasurements({ ...TYPICAL, sleeveLength: 35 }, 'cm')
    expect(warnings.some(w => w.field === 'sleeveLength')).toBe(true)
  })

  it('warns when sleeveLength > 75cm', () => {
    const warnings = validateMeasurements({ ...TYPICAL, sleeveLength: 80 }, 'cm')
    expect(warnings.some(w => w.field === 'sleeveLength')).toBe(true)
  })

  it('does not warn at sleeve boundary values 40cm and 75cm', () => {
    expect(validateMeasurements({ ...TYPICAL, sleeveLength: 40 }, 'cm')).toHaveLength(0)
    expect(validateMeasurements({ ...TYPICAL, sleeveLength: 75 }, 'cm')).toHaveLength(0)
  })

  // ── Hips vs waist ─────────────────────────────────────────────────────────
  it('warns when hips are smaller than waist', () => {
    const warnings = validateMeasurements({ ...TYPICAL, hips: 70, waist: 80 }, 'cm')
    expect(warnings.some(w => w.field === 'hips')).toBe(true)
  })

  it('does not warn when hips equal waist', () => {
    const warnings = validateMeasurements({ ...TYPICAL, hips: 80, waist: 80 }, 'cm')
    expect(warnings.every(w => w.field !== 'hips')).toBe(true)
  })

  // ── Unit conversion ───────────────────────────────────────────────────────
  it('converts inches to cm before validating — 37.8in chest is ~96cm (no warning)', () => {
    // 37.8 inches * 2.54 = 96.012cm → rounds to 96.0cm, within valid range
    const warnings = validateMeasurements({ ...TYPICAL, chest: 37.8 }, 'inches')
    expect(warnings.every(w => w.field !== 'chest')).toBe(true)
  })

  it('converts inches to cm before validating — 22in chest triggers small-chest warning', () => {
    // 22 inches * 2.54 = 55.88cm → rounds to 55.9cm, below 60cm threshold
    const warnings = validateMeasurements({ ...TYPICAL, chest: 22 }, 'inches')
    expect(warnings.some(w => w.field === 'chest')).toBe(true)
  })

  // ── Warning message content ───────────────────────────────────────────────
  it('warning messages include the measurement value', () => {
    const warnings = validateMeasurements({ ...TYPICAL, chest: 55 }, 'cm')
    const chestWarning = warnings.find(w => w.field === 'chest')
    expect(chestWarning?.message).toContain('55')
  })

  it('can produce multiple warnings simultaneously', () => {
    const warnings = validateMeasurements({
      unit: 'cm',
      chest: 55,          // too small
      backBodyLength: 65, // too large
      sleeveLength: 35,   // too small
    }, 'cm')
    expect(warnings.length).toBeGreaterThanOrEqual(3)
  })
})
