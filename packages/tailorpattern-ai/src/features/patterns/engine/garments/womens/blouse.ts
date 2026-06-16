import type { EngineInput, EngineOutput } from '../../types'
import { getEaseValues, cm } from '../../types'
import type { PatternPiece } from '../../../types/pattern.types'
import { generateId } from '../../../../../shared/utils/uuid'

// Women's blouse block based on Aldrich womenswear pattern cutting
export function generateBlouse(input: EngineInput): EngineOutput {
  const { measurements: m, params } = input
  const ease = getEaseValues(params.easePreference ?? 'regular')
  const warnings: string[] = []

  const bust = m.chest ?? 88  // use chest for bust
  const waist = m.waist ?? 70
  const shoulderW = m.shoulderWidth ?? 38
  const backLength = m.backBodyLength ?? 40
  const frontLength = m.frontBodyLength ?? 42
  const bustToWaist = m.bustPointToWaist ?? 20
  const sleeveLen = m.sleeveLength ?? 58
  const bicep = m.bicepCircumference ?? 28
  const wrist = m.wristCircumference ?? 15
  const neckCirc = m.neckCircumference ?? 36

  if (!m.chest) warnings.push('Bust measurement missing — using 88cm default')

  const bustHalf = cm((bust + ease.chest) / 2)
  const backBustW = cm(bustHalf / 2 + 0.5)
  const frontBustW = cm(bustHalf / 2 - 0.5)
  const armholeDepth = cm(bust / 8 + ease.armhole + 4)
  const backShoulderW = cm(shoulderW / 2)
  const neckW = cm(neckCirc / 5 - 0.5)
  const bustDart = cm((bust - waist) * 0.025)
  const bicepW = cm((bicep + ease.sleeve) / 2)
  const cuffW = cm(wrist + 5)

  const backPiece: PatternPiece = {
    id: generateId(),
    name: 'Back Blouse',
    color: '#1A1A2E',
    quantity: 1,
    mirror: false,
    outline: {
      isClosed: true, isSeamLine: false,
      points: [
        { x: 0, y: 0 },
        { x: neckW, y: -2 },
        { x: backShoulderW, y: -armholeDepth * 0.05 },
        { x: backBustW, y: armholeDepth },
        { x: backBustW - 1, y: backLength },
        { x: 0, y: backLength },
      ],
    },
    grainLine: { start: { x: 1, y: 5 }, end: { x: 1, y: backLength - 5 } },
    foldLine: {
      isClosed: false, isFoldLine: true,
      points: [{ x: 0, y: 0 }, { x: 0, y: backLength }],
    },
    annotations: [{ position: { x: backBustW / 2, y: backLength / 2 }, label: 'BACK (FOLD)' }],
  }

  const frontPiece: PatternPiece = {
    id: generateId(),
    name: 'Front Blouse',
    color: '#0F3460',
    quantity: 2,
    mirror: true,
    outline: {
      isClosed: true, isSeamLine: false,
      points: [
        { x: 0, y: 0 },
        { x: neckW, y: -(neckCirc / 5 + 2) },
        { x: backShoulderW - 0.5, y: -(armholeDepth * 0.1) },
        { x: frontBustW, y: armholeDepth },
        { x: frontBustW - 1, y: frontLength },
        { x: 0, y: frontLength },
      ],
    },
    grainLine: { start: { x: frontBustW / 2, y: 5 }, end: { x: frontBustW / 2, y: frontLength - 5 } },
    darts: [
      {
        apex: { x: frontBustW * 0.55, y: bustToWaist },
        legA: { x: frontBustW * 0.55 - bustDart, y: frontLength },
        legB: { x: frontBustW * 0.55 + bustDart, y: frontLength },
        depth: bustDart,
      },
    ],
    annotations: [{ position: { x: frontBustW / 2, y: frontLength / 2 }, label: 'FRONT' }],
  }

  const sleevePiece: PatternPiece = {
    id: generateId(),
    name: 'Sleeve',
    color: '#C9A84C',
    quantity: 2,
    mirror: false,
    outline: {
      isClosed: true, isSeamLine: false,
      points: [
        { x: 0, y: 0 },
        { x: bicepW, y: cm(armholeDepth * 0.6) },
        { x: cuffW / 2, y: sleeveLen },
        { x: -cuffW / 2, y: sleeveLen },
        { x: -bicepW, y: cm(armholeDepth * 0.6) },
      ],
    },
    grainLine: { start: { x: 0, y: armholeDepth * 0.6 + 3 }, end: { x: 0, y: sleeveLen - 5 } },
    annotations: [{ position: { x: 0, y: sleeveLen / 2 }, label: 'SLEEVE' }],
  }

  return { pieces: [backPiece, frontPiece, sleevePiece], warnings }
}
