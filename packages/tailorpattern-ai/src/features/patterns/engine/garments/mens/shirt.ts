import type { EngineInput, EngineOutput } from '../../types'
import { getEaseValues, cm } from '../../types'
import type { PatternPiece } from '../../../types/pattern.types'
import { generateId } from '../../../../../shared/utils/uuid'

// Standard shirt block based on Aldrich menswear shirt block
export function generateShirt(input: EngineInput): EngineOutput {
  const { measurements: m, params, seamAllowance: sa } = input
  const ease = getEaseValues(params.easePreference ?? 'regular')
  const warnings: string[] = []

  const chest = m.chest ?? 96
  const waist = m.waist ?? 80
  const neckCirc = m.neckCircumference ?? 38
  const shoulderW = m.shoulderWidth ?? 43
  const backLength = m.backBodyLength ?? 44
  const sleeveLen = m.sleeveLength ?? 64
  const bicep = m.bicepCircumference ?? 34
  const wrist = m.wristCircumference ?? 18

  const chestHalf = cm((chest + ease.chest) / 2)
  const backW = cm(chestHalf / 2 + 1)
  const frontW = cm(chestHalf / 2 - 1)
  const backShoulderW = cm(shoulderW / 2 + 1)
  const armholeDepth = cm(chest / 8 + ease.armhole + 5)
  const shirtLength = cm(backLength + 20) // shirt hangs below waist
  const neckW = cm(neckCirc / 5)
  const neckDepth = 2
  const bicepW = cm((bicep + ease.sleeve) / 2)
  const cuffW = cm(wrist + 4)
  const collarLen = cm(neckCirc + 3)
  const collarStand = params.collarStyle === 'mandarin' ? 3.5 : 3

  const backPiece: PatternPiece = {
    id: generateId(),
    name: 'Back Shirt',
    color: '#1A1A2E',
    quantity: 1,
    mirror: false,
    outline: {
      isClosed: true,
      isSeamLine: false,
      points: [
        { x: 0, y: 0 },
        { x: neckW, y: -neckDepth },
        { x: backShoulderW, y: -armholeDepth * 0.05 },
        { x: backW, y: armholeDepth },
        { x: backW, y: shirtLength },
        { x: 0, y: shirtLength },
      ],
    },
    grainLine: { start: { x: 1, y: 5 }, end: { x: 1, y: shirtLength - 5 } },
    foldLine: {
      isClosed: false, isFoldLine: true,
      points: [{ x: 0, y: 0 }, { x: 0, y: shirtLength }],
    },
    annotations: [{ position: { x: backW / 2, y: shirtLength / 2 }, label: 'BACK (CUT ON FOLD)' }],
  }

  const frontPiece: PatternPiece = {
    id: generateId(),
    name: 'Front Shirt',
    color: '#0F3460',
    quantity: 2,
    mirror: true,
    outline: {
      isClosed: true,
      isSeamLine: false,
      points: [
        { x: 0, y: 0 },
        { x: neckW, y: -neckCirc / 5 - 2 },
        { x: backShoulderW - 0.5, y: -armholeDepth * 0.1 },
        { x: frontW, y: armholeDepth },
        { x: frontW + 1.5, y: shirtLength }, // button stand
        { x: 0, y: shirtLength },
      ],
    },
    grainLine: { start: { x: frontW / 2, y: 5 }, end: { x: frontW / 2, y: shirtLength - 5 } },
    annotations: [{ position: { x: frontW / 2, y: shirtLength / 2 }, label: 'FRONT' }],
  }

  const sleevePiece: PatternPiece = {
    id: generateId(),
    name: 'Sleeve',
    color: '#C9A84C',
    quantity: 2,
    mirror: false,
    outline: {
      isClosed: true,
      isSeamLine: false,
      points: [
        { x: 0, y: 0 },                        // cap peak
        { x: bicepW, y: cm(armholeDepth * 0.55) },  // front cap
        { x: bicepW, y: sleeveLen - 3 },       // front hem
        { x: cuffW / 2, y: sleeveLen },         // cuff
        { x: -cuffW / 2, y: sleeveLen },
        { x: -bicepW, y: cm(armholeDepth * 0.55) },  // back cap
      ],
    },
    grainLine: { start: { x: 0, y: armholeDepth * 0.55 + 3 }, end: { x: 0, y: sleeveLen - 5 } },
    annotations: [{ position: { x: 0, y: sleeveLen / 2 }, label: 'SLEEVE' }],
  }

  // Collar (point, spread, or band)
  const collarPiece: PatternPiece = {
    id: generateId(),
    name: params.collarStyle === 'mandarin' ? 'Mandarin Collar' : 'Collar',
    color: '#475569',
    quantity: 2,
    mirror: false,
    outline: {
      isClosed: true,
      isSeamLine: false,
      points: [
        { x: 0, y: 0 },
        { x: collarLen / 2, y: 0 },
        { x: collarLen / 2 + 2, y: collarStand + 3 }, // collar point
        { x: collarLen / 4, y: collarStand + 3 },
        { x: 0, y: collarStand },
      ],
    },
    foldLine: {
      isClosed: false, isFoldLine: true,
      points: [{ x: 0, y: collarStand }, { x: collarLen / 2, y: collarStand }],
    },
    annotations: [{ position: { x: collarLen / 4, y: collarStand / 2 }, label: 'COLLAR STAND & FALL' }],
  }

  const cuffPiece: PatternPiece = {
    id: generateId(),
    name: 'Cuff',
    color: '#BFDBFE',
    quantity: 4,
    mirror: false,
    outline: {
      isClosed: true,
      isSeamLine: false,
      points: [
        { x: 0, y: 0 },
        { x: cuffW, y: 0 },
        { x: cuffW, y: 6.5 },
        { x: 0, y: 6.5 },
      ],
    },
    foldLine: {
      isClosed: false, isFoldLine: true,
      points: [{ x: 0, y: 3.25 }, { x: cuffW, y: 3.25 }],
    },
    annotations: [{ position: { x: cuffW / 2, y: 3.25 }, label: 'CUFF (CUT 4)' }],
  }

  return { pieces: [backPiece, frontPiece, sleevePiece, collarPiece, cuffPiece], warnings }
}
