import type { EngineInput, EngineOutput } from '../../types'
import { getEaseValues, cm } from '../../types'
import type { PatternPiece } from '../../../types/pattern.types'
import { generateId } from '../../../../../shared/utils/uuid'

// Women's dress blocks: Shift, Fit-and-Flare, Wrap
export function generateDress(_garmentType: string, input: EngineInput): EngineOutput {
  const { measurements: m, params } = input
  const ease = getEaseValues(params.easePreference ?? 'regular')
  const warnings: string[] = []

  const bust = m.chest ?? 88
  const waist = m.waist ?? 70
  const hips = m.hips ?? 96
  const shoulderW = m.shoulderWidth ?? 38
  const backLength = m.backBodyLength ?? 40
  const waistToHip = m.waistToHip ?? 20
  const neckCirc = m.neckCircumference ?? 36

  if (!m.chest) warnings.push('Bust measurement missing — using 88cm default')

  const skirtLengths = { mini: 45, knee: 60, midi: 80, maxi: 110 }
  const dressLength = backLength + (skirtLengths[params.skirtLength ?? 'knee'] ?? 60)

  const bustHalf = cm((bust + ease.chest) / 2)
  const backBustW = cm(bustHalf / 2 + 0.5)
  const frontBustW = cm(bustHalf / 2 - 0.5)
  const armholeDepth = cm(bust / 8 + ease.armhole + 4)
  const backShoulderW = cm(shoulderW / 2)
  const neckW = cm(neckCirc / 5 - 0.5)
  const hipW = cm((hips + ease.hips) / 4)
  const waistW = cm((waist + ease.waist) / 4)

  const backPiece: PatternPiece = {
    id: generateId(),
    name: 'Back Dress',
    color: '#1A1A2E',
    quantity: 1,
    mirror: false,
    outline: {
      isClosed: true, isSeamLine: false,
      points: [
        { x: 0, y: 0 },
        { x: neckW, y: -2 },
        { x: backShoulderW, y: -(armholeDepth * 0.05) },
        { x: backBustW, y: armholeDepth },
        { x: waistW, y: backLength },
        { x: hipW, y: backLength + waistToHip },
        { x: hipW, y: dressLength },
        { x: 0, y: dressLength },
      ],
    },
    grainLine: { start: { x: 1, y: 5 }, end: { x: 1, y: dressLength - 5 } },
    foldLine: { isClosed: false, isFoldLine: true, points: [{ x: 0, y: 0 }, { x: 0, y: dressLength }] },
    darts: [
      {
        apex: { x: backBustW * 0.4, y: backLength * 0.6 },
        legA: { x: backBustW * 0.4 - 1, y: backLength },
        legB: { x: backBustW * 0.4 + 1, y: backLength },
        depth: 1.5,
      },
    ],
    annotations: [{ position: { x: hipW / 2, y: dressLength / 2 }, label: 'BACK (FOLD)' }],
  }

  const frontPiece: PatternPiece = {
    id: generateId(),
    name: 'Front Dress',
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
        { x: waistW - 0.5, y: backLength },
        { x: hipW, y: backLength + waistToHip },
        { x: hipW, y: dressLength },
        { x: 0, y: dressLength },
      ],
    },
    grainLine: { start: { x: hipW / 2, y: 5 }, end: { x: hipW / 2, y: dressLength - 5 } },
    darts: [
      {
        apex: { x: frontBustW * 0.55, y: backLength * 0.45 },
        legA: { x: frontBustW * 0.55 - 1.5, y: backLength },
        legB: { x: frontBustW * 0.55 + 1.5, y: backLength },
        depth: cm((bust - waist) * 0.04),
      },
    ],
    annotations: [{ position: { x: hipW / 2, y: dressLength / 2 }, label: 'FRONT' }],
  }

  return { pieces: [backPiece, frontPiece], warnings }
}
