import type { EngineInput, EngineOutput } from '../../types'
import { getEaseValues, cm } from '../../types'
import type { PatternPiece } from '../../../types/pattern.types'
import { generateId } from '../../../../../shared/utils/uuid'

// Industry-standard suit jacket block based on the Winifred Aldrich method
// Ref: "Metric Pattern Cutting for Menswear" by Winifred Aldrich (5th ed.)
export function generateSuitJacket(input: EngineInput): EngineOutput {
  const { measurements: m, params, seamAllowance: sa } = input
  const ease = getEaseValues(params.easePreference ?? 'regular')
  const warnings: string[] = []

  const chest = m.chest ?? 96
  const waist = m.waist ?? 80
  const shoulderW = m.shoulderWidth ?? 43
  const backLength = m.backBodyLength ?? 44
  const sleeveLen = m.sleeveLength ?? 64
  const neckCirc = m.neckCircumference ?? 38
  const bicep = m.bicepCircumference ?? 34
  const wrist = m.wristCircumference ?? 18

  if (!m.chest) warnings.push('Chest measurement missing — using 96cm default')
  if (!m.backBodyLength) warnings.push('Back body length missing — using 44cm default')

  // Key construction values (all in cm)
  const chestHalf = cm((chest + ease.chest) / 2)
  const backWidth = cm(chestHalf / 2 + 1)
  const frontWidth = cm(chestHalf / 2 - 1)
  const backShoulderW = cm(shoulderW / 2 + 1.5)
  const armholeDepth = cm(chest / 8 + ease.armhole + 6)
  const jacketLength = cm(backLength + (params.jacketLength === 'short' ? -2 : params.jacketLength === 'long' ? 2 : 0))
  const neckW = cm(neckCirc / 5 - 0.5)
  const neckDepth = 2.5
  const waistSuppression = cm((chest - waist) / 4)
  const bicepW = cm((bicep + ease.sleeve) / 2)
  const capHeight = cm(armholeDepth * 0.6)
  const collarLen = cm(neckCirc + 4)

  // ── BACK BODY PIECE ─────────────────────────────────────────────────────
  // Construction uses standard x,y coordinates where (0,0) = centre back neck
  const backPiece: PatternPiece = {
    id: generateId(),
    name: 'Back Body',
    color: '#1A1A2E',
    quantity: 2,
    mirror: false,
    outline: {
      isClosed: true,
      isSeamLine: false,
      points: [
        { x: 0, y: 0 },                              // CB neck
        { x: neckW, y: -neckDepth },                 // shoulder neck point
        { x: backShoulderW, y: -armholeDepth * 0.05 }, // shoulder tip
        { x: backWidth, y: armholeDepth },            // armhole bottom
        { x: backWidth - waistSuppression, y: jacketLength * 0.55 }, // waist
        { x: backWidth, y: jacketLength },            // hem side
        { x: 0, y: jacketLength },                   // CB hem
      ],
    },
    grainLine: { start: { x: 1, y: 5 }, end: { x: 1, y: jacketLength - 5 } },
    annotations: [
      { position: { x: backWidth / 2, y: jacketLength / 2 }, label: 'BACK' },
      { position: { x: backWidth / 2, y: jacketLength - 2 }, label: `Chest ease: +${ease.chest}cm` },
    ],
    notches: [
      { position: { x: backWidth, y: armholeDepth * 0.5 }, angle: 0 },
      { position: { x: backWidth, y: armholeDepth }, angle: 0 },
    ],
    seamLine: {
      isClosed: true,
      isSeamLine: true,
      points: [
        { x: sa, y: 0 },
        { x: neckW, y: -(neckDepth + sa) },
        { x: backShoulderW + sa, y: -armholeDepth * 0.05 },
        { x: backWidth + sa, y: armholeDepth },
        { x: backWidth - waistSuppression + sa, y: jacketLength * 0.55 },
        { x: backWidth + sa, y: jacketLength + sa },
        { x: 0, y: jacketLength + sa },
      ],
    },
  }

  // ── FRONT BODY PIECE ────────────────────────────────────────────────────
  const frontNeckW = cm(neckCirc / 5 - 1)
  const frontNeckDepth = cm(neckCirc / 5 + 2)
  const frontShoulderW = cm(backShoulderW - 0.5)

  const frontPiece: PatternPiece = {
    id: generateId(),
    name: 'Front Body',
    color: '#0F3460',
    quantity: 2,
    mirror: true,
    outline: {
      isClosed: true,
      isSeamLine: false,
      points: [
        { x: 0, y: 0 },
        { x: frontNeckW, y: -frontNeckDepth },
        { x: frontShoulderW, y: -(armholeDepth * 0.1) },
        { x: frontWidth, y: armholeDepth },
        { x: frontWidth - waistSuppression, y: jacketLength * 0.55 },
        { x: frontWidth + 2, y: jacketLength },  // +2 for button overlap
        { x: 0, y: jacketLength },
      ],
    },
    grainLine: { start: { x: frontWidth / 2, y: 5 }, end: { x: frontWidth / 2, y: jacketLength - 5 } },
    annotations: [
      { position: { x: frontWidth / 2, y: jacketLength / 2 }, label: 'FRONT' },
    ],
    darts: [
      {
        apex: { x: frontWidth * 0.4, y: jacketLength * 0.4 },
        legA: { x: frontWidth * 0.4 - 1, y: jacketLength * 0.55 },
        legB: { x: frontWidth * 0.4 + 1, y: jacketLength * 0.55 },
        depth: cm(chest * 0.02),
      },
    ],
    seamLine: {
      isClosed: true,
      isSeamLine: true,
      points: [
        { x: 0, y: 0 },
        { x: frontNeckW, y: -(frontNeckDepth + sa) },
        { x: frontShoulderW + sa, y: -(armholeDepth * 0.1) },
        { x: frontWidth + sa, y: armholeDepth },
        { x: frontWidth - waistSuppression + sa, y: jacketLength * 0.55 },
        { x: frontWidth + 2 + sa, y: jacketLength + sa },
        { x: 0, y: jacketLength + sa },
      ],
    },
  }

  // ── SLEEVE (2-piece construction) ───────────────────────────────────────
  const topSleevePiece: PatternPiece = {
    id: generateId(),
    name: 'Top Sleeve',
    color: '#C9A84C',
    quantity: 2,
    mirror: false,
    outline: {
      isClosed: true,
      isSeamLine: false,
      points: [
        { x: 0, y: 0 },               // cap top
        { x: bicepW + 1, y: capHeight }, // front cap
        { x: bicepW + 1, y: sleeveLen }, // front hem
        { x: cm(wrist / 2) + 2, y: sleeveLen }, // front hem narrowed
        { x: 0, y: sleeveLen - 1 },   // elbow seam
        { x: -(bicepW - 1), y: capHeight }, // back cap
      ],
    },
    grainLine: {
      start: { x: 0, y: capHeight + 3 },
      end: { x: 0, y: sleeveLen - 5 },
    },
    annotations: [
      { position: { x: 0, y: sleeveLen / 2 }, label: 'TOP SLEEVE' },
    ],
    notches: [
      { position: { x: bicepW * 0.5, y: capHeight * 0.3 }, angle: 90 },
    ],
  }

  // ── COLLAR (under collar + top collar) ──────────────────────────────────
  const collarW = 8 // standard jacket collar width
  const collarPiece: PatternPiece = {
    id: generateId(),
    name: 'Collar',
    color: '#475569',
    quantity: 2,
    mirror: false,
    outline: {
      isClosed: true,
      isSeamLine: false,
      points: [
        { x: 0, y: 0 },
        { x: collarLen / 2, y: 0 },
        { x: collarLen / 2, y: collarW },
        { x: 0, y: collarW },
      ],
    },
    grainLine: {
      start: { x: collarLen * 0.1, y: collarW / 2 },
      end: { x: collarLen * 0.4, y: collarW / 2 },
    },
    foldLine: {
      isClosed: false,
      isFoldLine: true,
      points: [
        { x: 0, y: collarW / 2 },
        { x: collarLen / 2, y: collarW / 2 },
      ],
    },
    annotations: [
      { position: { x: collarLen / 4, y: collarW / 2 }, label: 'COLLAR (CUT 2)' },
    ],
  }

  // ── POCKET FLAP ─────────────────────────────────────────────────────────
  const pieces: PatternPiece[] = [backPiece, frontPiece, topSleevePiece, collarPiece]

  if (params.pocketStyle && params.pocketStyle !== 'none') {
    pieces.push({
      id: generateId(),
      name: 'Pocket Flap',
      color: '#78716C',
      quantity: 4,
      mirror: false,
      outline: {
        isClosed: true,
        isSeamLine: false,
        points: [
          { x: 0, y: 0 },
          { x: 13, y: 0 },
          { x: 13, y: 5.5 },
          { x: 0, y: 5.5 },
        ],
      },
      annotations: [{ position: { x: 6.5, y: 2.75 }, label: 'POCKET FLAP' }],
    })
  }

  return { pieces, warnings }
}
