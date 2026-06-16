import type { EngineInput, EngineOutput } from '../../types'
import { getEaseValues, cm } from '../../types'
import type { PatternPiece } from '../../../types/pattern.types'
import { generateId } from '../../../../../shared/utils/uuid'

// Women's skirt blocks: A-line, Straight, Flared
export function generateSkirt(garmentType: string, input: EngineInput): EngineOutput {
  const { measurements: m, params } = input
  const ease = getEaseValues(params.easePreference ?? 'regular')
  const warnings: string[] = []

  const waist = m.waist ?? 70
  const hips = m.hips ?? 96
  const waistToHip = m.waistToHip ?? 20

  const skirtLengths = { mini: 45, knee: 60, midi: 80, maxi: 110 }
  const skirtLength = skirtLengths[params.skirtLength ?? 'knee']

  const waistH = cm((waist + ease.waist) / 4)
  const hipH = cm((hips + ease.hips) / 4)

  if (!m.waist) warnings.push('Waist missing — using 70cm default')

  // Straight skirt
  if (garmentType === 'womens-straight-skirt') {
    const hemH = cm((hips + ease.hips - 4) / 4) // slight taper at hem

    const frontPiece: PatternPiece = {
      id: generateId(),
      name: 'Front Skirt',
      color: '#1A1A2E',
      quantity: 1,
      mirror: false,
      outline: {
        isClosed: true, isSeamLine: false,
        points: [
          { x: 0, y: 0 },
          { x: waistH, y: 0 },
          { x: hipH, y: waistToHip },
          { x: hemH, y: skirtLength },
          { x: 0, y: skirtLength },
        ],
      },
      grainLine: { start: { x: 1, y: 5 }, end: { x: 1, y: skirtLength - 5 } },
      foldLine: { isClosed: false, isFoldLine: true, points: [{ x: 0, y: 0 }, { x: 0, y: skirtLength }] },
      darts: [
        {
          apex: { x: waistH * 0.4, y: 12 },
          legA: { x: waistH * 0.4 - 1, y: 0 },
          legB: { x: waistH * 0.4 + 1, y: 0 },
          depth: 2,
        },
      ],
      annotations: [{ position: { x: hipH / 2, y: skirtLength / 2 }, label: 'FRONT (FOLD)' }],
    }

    return { pieces: [frontPiece, { ...frontPiece, id: generateId(), name: 'Back Skirt', color: '#0F3460', annotations: [{ position: { x: hipH / 2, y: skirtLength / 2 }, label: 'BACK (FOLD)' }] }], warnings }
  }

  // A-line skirt — standard construction
  const alineFlare = cm((hips - waist) * 0.5)
  const frontPiece: PatternPiece = {
    id: generateId(),
    name: 'Front A-line Skirt',
    color: '#1A1A2E',
    quantity: 1,
    mirror: false,
    outline: {
      isClosed: true, isSeamLine: false,
      points: [
        { x: 0, y: 0 },
        { x: waistH, y: 0 },
        { x: hipH, y: waistToHip },
        { x: hipH + cm(alineFlare * 0.3), y: skirtLength },
        { x: 0, y: skirtLength },
      ],
    },
    grainLine: { start: { x: 1, y: 5 }, end: { x: 1, y: skirtLength - 5 } },
    foldLine: { isClosed: false, isFoldLine: true, points: [{ x: 0, y: 0 }, { x: 0, y: skirtLength }] },
    darts: [
      {
        apex: { x: waistH * 0.45, y: 11 },
        legA: { x: waistH * 0.45 - 1, y: 0 },
        legB: { x: waistH * 0.45 + 1, y: 0 },
        depth: 2,
      },
    ],
    annotations: [{ position: { x: hipH / 2, y: skirtLength / 2 }, label: 'FRONT A-LINE (FOLD)' }],
  }

  const backPiece: PatternPiece = {
    ...frontPiece,
    id: generateId(),
    name: 'Back A-line Skirt',
    color: '#0F3460',
    annotations: [{ position: { x: hipH / 2, y: skirtLength / 2 }, label: 'BACK A-LINE (FOLD)' }],
  }

  // Waistband
  const waistband: PatternPiece = {
    id: generateId(),
    name: 'Waistband',
    color: '#475569',
    quantity: 1,
    mirror: false,
    outline: {
      isClosed: true, isSeamLine: false,
      points: [
        { x: 0, y: 0 },
        { x: cm(waist + ease.waist), y: 0 },
        { x: cm(waist + ease.waist), y: 4 },
        { x: 0, y: 4 },
      ],
    },
    foldLine: { isClosed: false, isFoldLine: true, points: [{ x: 0, y: 2 }, { x: cm(waist + ease.waist), y: 2 }] },
    annotations: [{ position: { x: cm((waist + ease.waist) / 2), y: 2 }, label: 'WAISTBAND' }],
  }

  return { pieces: [frontPiece, backPiece, waistband], warnings }
}
