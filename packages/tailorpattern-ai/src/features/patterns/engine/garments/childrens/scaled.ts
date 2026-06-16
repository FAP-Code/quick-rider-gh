import type { EngineInput, EngineOutput } from '../../types'
import { cm } from '../../types'
import type { PatternPiece } from '../../../types/pattern.types'
import { generateId } from '../../../../../shared/utils/uuid'

// Children's patterns derived from adult blocks with age-based scaling
// Scale factors based on standard children's sizing charts
const AGE_CHEST: Record<number, number> = {
  2: 53, 3: 55, 4: 57, 5: 59, 6: 62, 7: 65,
  8: 68, 9: 70, 10: 73, 11: 76, 12: 79, 14: 83,
}

const AGE_HEIGHT: Record<number, number> = {
  2: 92, 3: 99, 4: 105, 5: 112, 6: 118, 7: 124,
  8: 130, 9: 135, 10: 140, 11: 146, 12: 151, 14: 158,
}

export function generateChildrensGarment(garmentType: string, input: EngineInput): EngineOutput {
  const { measurements: m, params } = input
  const warnings: string[] = []
  const age = params.childAge ?? 8

  // Use measured values if provided, else lookup by age
  const chest = m.chest ?? (AGE_CHEST[age] ?? 68)
  const height = m.trouserOutseam ?? (AGE_HEIGHT[age] ?? 130)

  if (!m.chest) {
    warnings.push(`Using standard chest size for age ${age}: ${chest}cm`)
  }

  const ease = 6 // children use moderate ease
  const bodyW = cm((chest + ease) / 4)
  const bodyLength = cm(height * 0.27) // back body length ~27% of height
  const sleeveLen = cm(height * 0.33)
  const neckW = cm(chest / 10)
  const armholeD = cm(chest / 6 + 2)

  if (garmentType === 'childrens-shirt') {
    const back: PatternPiece = {
      id: generateId(), name: 'Back (Children)',
      color: '#1A1A2E', quantity: 1, mirror: false,
      outline: {
        isClosed: true, isSeamLine: false,
        points: [
          { x: 0, y: 0 },
          { x: neckW, y: -1.5 },
          { x: cm(bodyW + 1), y: -(armholeD * 0.05) },
          { x: cm(bodyW + 2), y: armholeD },
          { x: cm(bodyW + 2), y: cm(bodyLength + height * 0.1) },
          { x: 0, y: cm(bodyLength + height * 0.1) },
        ],
      },
      foldLine: { isClosed: false, isFoldLine: true, points: [{ x: 0, y: 0 }, { x: 0, y: cm(bodyLength + height * 0.1) }] },
      grainLine: { start: { x: 1, y: 5 }, end: { x: 1, y: cm(bodyLength + height * 0.08) } },
      annotations: [
        { position: { x: bodyW, y: bodyLength / 2 }, label: `BACK Age ${age}` },
        { position: { x: bodyW, y: bodyLength * 0.8 }, label: `Chest: ${chest}cm` },
      ],
    }
    const front: PatternPiece = {
      ...back,
      id: generateId(), name: 'Front (Children)',
      color: '#0F3460', quantity: 2, mirror: true,
      foldLine: undefined,
      annotations: [{ position: { x: bodyW, y: bodyLength / 2 }, label: `FRONT Age ${age}` }],
    }
    const sleeve: PatternPiece = {
      id: generateId(), name: 'Sleeve (Children)',
      color: '#C9A84C', quantity: 2, mirror: false,
      outline: {
        isClosed: true, isSeamLine: false,
        points: [
          { x: 0, y: 0 },
          { x: cm(chest / 8 + 2), y: cm(armholeD * 0.55) },
          { x: cm(chest / 8), y: sleeveLen },
          { x: -cm(chest / 8), y: sleeveLen },
          { x: -cm(chest / 8 + 2), y: cm(armholeD * 0.55) },
        ],
      },
      grainLine: { start: { x: 0, y: armholeD * 0.55 + 3 }, end: { x: 0, y: sleeveLen - 3 } },
      annotations: [{ position: { x: 0, y: sleeveLen / 2 }, label: 'SLEEVE (Children)' }],
    }
    return { pieces: [back, front, sleeve], warnings }
  }

  // Children's trouser — simplified
  const trouserFront: PatternPiece = {
    id: generateId(), name: 'Front Trouser (Children)',
    color: '#1A1A2E', quantity: 2, mirror: true,
    outline: {
      isClosed: true, isSeamLine: false,
      points: [
        { x: 0, y: 0 },
        { x: cm((chest + 10) / 4), y: 0 },
        { x: cm((chest + 14) / 4), y: cm(height * 0.16) },
        { x: cm((chest + 12) / 4), y: cm(height * 0.65) },
        { x: cm((chest + 8) / 4), y: cm(height * 0.65) },
        { x: 0, y: cm(height * 0.65) },
      ],
    },
    grainLine: { start: { x: cm((chest + 10) / 8), y: 5 }, end: { x: cm((chest + 10) / 8), y: cm(height * 0.6) } },
    annotations: [{ position: { x: cm((chest + 10) / 8), y: cm(height * 0.3) }, label: `FRONT TROUSER Age ${age}` }],
  }

  return { pieces: [trouserFront, { ...trouserFront, id: generateId(), name: 'Back Trouser (Children)', color: '#0F3460', annotations: [{ position: { x: cm((chest + 10) / 8), y: cm(height * 0.3) }, label: `BACK TROUSER Age ${age}` }] }], warnings }
}
