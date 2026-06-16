import { describe, it, expect } from 'vitest'
import { getEaseValues, cm } from '../types'
import { generateSuitJacket } from '../garments/mens/suitJacket'
import { generatePattern } from '../index'
import type { EngineInput } from '../types'
import type { MeasurementData } from '../../../measurements/types/measurement.types'

const FULL_MEASUREMENTS: MeasurementData = {
  chest: 96,
  waist: 80,
  hips: 100,
  shoulderWidth: 43,
  backBodyLength: 44,
  sleeveLength: 64,
  neckCircumference: 38,
  bicepCircumference: 34,
  wristCircumference: 18,
  unit: 'cm',
}

const BASE_INPUT: EngineInput = {
  measurements: FULL_MEASUREMENTS,
  params: { easePreference: 'regular' },
  seamAllowance: 1.5,
}

describe('cm() rounding helper', () => {
  it('rounds to one decimal place', () => {
    expect(cm(12.345)).toBe(12.3)
    expect(cm(12.35)).toBe(12.4)
    expect(cm(100)).toBe(100)
    expect(cm(0)).toBe(0)
  })

  it('handles negative values', () => {
    expect(cm(-2.567)).toBe(-2.6)
  })
})

describe('getEaseValues()', () => {
  it('returns slim ease values', () => {
    const ease = getEaseValues('slim')
    expect(ease.chest).toBe(4)
    expect(ease.waist).toBe(2)
    expect(ease.hips).toBe(4)
    expect(ease.sleeve).toBe(2)
  })

  it('returns regular ease values', () => {
    const ease = getEaseValues('regular')
    expect(ease.chest).toBe(8)
    expect(ease.waist).toBe(4)
    expect(ease.armhole).toBe(2)
    expect(ease.length).toBe(0)
  })

  it('returns relaxed ease values', () => {
    const ease = getEaseValues('relaxed')
    expect(ease.chest).toBe(12)
    expect(ease.waist).toBe(8)
    expect(ease.sleeve).toBe(4)
    expect(ease.length).toBe(2)
  })

  it('defaults to regular when no preference given', () => {
    expect(getEaseValues()).toEqual(getEaseValues('regular'))
  })

  it('each preference produces unique chest ease', () => {
    const slimChest = getEaseValues('slim').chest
    const regularChest = getEaseValues('regular').chest
    const relaxedChest = getEaseValues('relaxed').chest
    expect(slimChest).toBeLessThan(regularChest)
    expect(regularChest).toBeLessThan(relaxedChest)
  })
})

describe('generateSuitJacket()', () => {
  it('generates a non-empty piece list', () => {
    const output = generateSuitJacket(BASE_INPUT)
    expect(output.pieces.length).toBeGreaterThan(0)
    expect(output.warnings).toBeInstanceOf(Array)
  })

  it('includes back body, front body, top sleeve and collar', () => {
    const { pieces } = generateSuitJacket(BASE_INPUT)
    const names = pieces.map(p => p.name)
    expect(names).toContain('Back Body')
    expect(names).toContain('Front Body')
    expect(names).toContain('Top Sleeve')
    expect(names).toContain('Collar')
  })

  it('each piece outline has at least 4 points', () => {
    const { pieces } = generateSuitJacket(BASE_INPUT)
    for (const piece of pieces) {
      expect(piece.outline.points.length).toBeGreaterThanOrEqual(4)
    }
  })

  it('each piece has a unique id', () => {
    const { pieces } = generateSuitJacket(BASE_INPUT)
    const ids = pieces.map(p => p.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('adds pocket flap when pocketStyle is set', () => {
    const input: EngineInput = { ...BASE_INPUT, params: { ...BASE_INPUT.params, pocketStyle: 'flap' } }
    const { pieces } = generateSuitJacket(input)
    expect(pieces.some(p => p.name === 'Pocket Flap')).toBe(true)
  })

  it('omits pocket flap when pocketStyle is none', () => {
    const input: EngineInput = { ...BASE_INPUT, params: { ...BASE_INPUT.params, pocketStyle: 'none' } }
    const { pieces } = generateSuitJacket(input)
    expect(pieces.some(p => p.name === 'Pocket Flap')).toBe(false)
  })

  it('warns when chest measurement is absent', () => {
    const { chest: _c, ...noChest } = FULL_MEASUREMENTS
    const input: EngineInput = { ...BASE_INPUT, measurements: noChest }
    const { warnings } = generateSuitJacket(input)
    expect(warnings.some(w => w.includes('Chest measurement missing'))).toBe(true)
  })

  it('uses larger ease in relaxed mode', () => {
    const regular = generateSuitJacket({ ...BASE_INPUT, params: { easePreference: 'regular' } })
    const relaxed = generateSuitJacket({ ...BASE_INPUT, params: { easePreference: 'relaxed' } })

    // Relaxed back body should be wider than regular back body
    const regularBack = regular.pieces.find(p => p.name === 'Back Body')
    const relaxedBack = relaxed.pieces.find(p => p.name === 'Back Body')
    if (!regularBack || !relaxedBack) throw new Error('Back body piece not found')

    const regularWidth = Math.max(...regularBack.outline.points.map(p => p.x))
    const relaxedWidth = Math.max(...relaxedBack.outline.points.map(p => p.x))
    expect(relaxedWidth).toBeGreaterThan(regularWidth)
  })
})

describe('generatePattern() dispatcher', () => {
  const garmentTypes = [
    'mens-suit-jacket',
    'mens-trouser',
    'mens-formal-shirt',
    'womens-blouse',
    'womens-aline-skirt',
    'womens-shift-dress',
  ] as const

  for (const type of garmentTypes) {
    it(`generates pieces for ${type}`, () => {
      const out = generatePattern(type, BASE_INPUT)
      expect(out.pieces.length).toBeGreaterThan(0)
      expect(out.warnings).toBeInstanceOf(Array)
    })
  }

  it('scales children\'s garment from age table when measurements absent', () => {
    const out = generatePattern('childrens-shirt', {
      ...BASE_INPUT,
      params: { childAge: 8 },
      measurements: { unit: 'cm' },
    })
    expect(out.pieces.length).toBeGreaterThan(0)
    expect(out.warnings.some(w => w.includes('standard chest size'))).toBe(true)
  })

  it('returns a warning for unimplemented garment type fallback', () => {
    // @ts-expect-error — intentionally testing unknown type fallback
    const out = generatePattern('nonexistent-garment', BASE_INPUT)
    expect(out.pieces).toHaveLength(0)
    expect(out.warnings.length).toBeGreaterThan(0)
  })
})
