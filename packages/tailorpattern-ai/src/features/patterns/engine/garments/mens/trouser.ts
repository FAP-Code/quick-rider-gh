import type { EngineInput, EngineOutput } from '../../types'
import { getEaseValues, cm } from '../../types'
import type { PatternPiece, PatternPath } from '../../../types/pattern.types'
import { generateId } from '../../../../../shared/utils/uuid'
import { buildSeamLine, edgeNotch } from '../../utils/seamAllowance'

// Standard trouser block based on Aldrich menswear construction
export function generateTrouser(input: EngineInput): EngineOutput {
  const { measurements: m, params, seamAllowance: sa } = input
  const ease = getEaseValues(params.easePreference ?? 'regular')
  const warnings: string[] = []

  const waist = m.waist ?? 80
  const hips = m.hips ?? 100
  const inseam = m.trouserInseam ?? 80
  const outseam = m.trouserOutseam ?? 107
  const thigh = m.thighCircumference ?? 58
  const ankle = m.ankleCircumference ?? 24
  const frontRise = m.frontRise ?? 28
  const backRise = m.backRise ?? 33

  if (!m.waist) warnings.push('Waist missing — using 80cm default')
  if (!m.trouserInseam) warnings.push('Inseam missing — using 80cm default')

  const waistEase = ease.waist
  const hipEase = ease.hips

  const frontWaistH = cm((waist + waistEase) / 4 - 1.5) // -1.5 for dart intake front
  const backWaistH = cm((waist + waistEase) / 4 + 1.5)  // +1.5 for dart intake back
  const frontHipW = cm((hips + hipEase) / 4)
  const backHipW = cm((hips + hipEase) / 4 + 2)         // +2 for seat ease
  const frontThighW = cm((thigh + ease.chest) / 4)       // reuse chest ease for thigh
  const backThighW = cm(frontThighW + 3)

  const legLegStyle = params.legStyle ?? 'straight'
  const hemWidth = legLegStyle === 'slim'
    ? cm(ankle / 2 + 2)
    : legLegStyle === 'wide'
      ? cm(ankle / 2 + 8)
      : cm(ankle / 2 + 4)

  // ── FRONT TROUSER PIECE ─────────────────────────────────────────────────
  const frontOutline: PatternPath = {
    isClosed: true,
    isSeamLine: false,
    points: [
      { x: 0, y: 0 },                          // CF waist
      { x: frontWaistH, y: 0 },                // side waist
      { x: frontHipW, y: frontRise - 10 },     // hip point
      { x: frontThighW, y: frontRise },         // crotch level
      { x: frontThighW, y: frontRise + inseam }, // hem inside
      { x: hemWidth, y: frontRise + inseam },   // hem outside
      { x: frontHipW, y: frontRise },           // back to crotch
    ],
  }
  const frontPiece: PatternPiece = {
    id: generateId(),
    name: 'Front Trouser',
    color: '#1A1A2E',
    quantity: 2,
    mirror: true,
    outline: frontOutline,
    seamLine: buildSeamLine(frontOutline, sa),
    grainLine: {
      start: { x: frontWaistH / 2, y: 5 },
      end: { x: frontWaistH / 2, y: outseam - 5 },
    },
    darts: params.pleat === 'none' ? [] : [
      {
        apex: { x: frontWaistH * 0.4, y: 8 },
        legA: { x: frontWaistH * 0.4 - 1, y: 0 },
        legB: { x: frontWaistH * 0.4 + 1, y: 0 },
        depth: 2,
      },
    ],
    annotations: [
      { position: { x: frontWaistH / 2, y: outseam / 2 }, label: 'FRONT' },
    ],
    notches: [
      { position: { x: frontThighW * 0.5, y: frontRise }, angle: 0 },
      edgeNotch(frontOutline.points, 1, 0),
    ],
    keyMeasurements: [`Waist: ${waist}cm`, `Inseam: ${inseam}cm`],
  }

  // ── BACK TROUSER PIECE ─────────────────────────────────────────────────
  const backSeatExtension = cm(backRise * 0.15) // seat curve extension
  const backOutline: PatternPath = {
    isClosed: true,
    isSeamLine: false,
    points: [
      { x: 0, y: 0 },                            // CB waist
      { x: backWaistH, y: 0 },                   // side waist
      { x: backHipW, y: backRise - 10 },          // hip point
      { x: backThighW + backSeatExtension, y: backRise }, // crotch
      { x: backThighW, y: backRise + inseam },    // hem inside
      { x: hemWidth + 1, y: backRise + inseam },  // hem outside
    ],
  }
  const backPiece: PatternPiece = {
    id: generateId(),
    name: 'Back Trouser',
    color: '#0F3460',
    quantity: 2,
    mirror: true,
    outline: backOutline,
    seamLine: buildSeamLine(backOutline, sa),
    grainLine: {
      start: { x: backWaistH / 2, y: 5 },
      end: { x: backWaistH / 2, y: outseam - 5 },
    },
    darts: [
      {
        apex: { x: backWaistH * 0.5, y: 10 },
        legA: { x: backWaistH * 0.5 - 1.5, y: 0 },
        legB: { x: backWaistH * 0.5 + 1.5, y: 0 },
        depth: 3,
      },
    ],
    annotations: [
      { position: { x: backWaistH / 2, y: outseam / 2 }, label: 'BACK' },
    ],
    notches: [edgeNotch(backOutline.points, 1, 0)],
    keyMeasurements: [`Hips: ${hips}cm`, `Outseam: ${outseam}cm`],
  }

  // ── WAISTBAND ───────────────────────────────────────────────────────────
  const waistbandOutline: PatternPath = {
    isClosed: true,
    isSeamLine: false,
    points: [
      { x: 0, y: 0 },
      { x: cm(waist + waistEase), y: 0 },
      { x: cm(waist + waistEase), y: 5 },
      { x: 0, y: 5 },
    ],
  }
  const waistbandPiece: PatternPiece = {
    id: generateId(),
    name: 'Waistband',
    color: '#475569',
    quantity: 1,
    mirror: false,
    outline: waistbandOutline,
    seamLine: buildSeamLine(waistbandOutline, sa),
    foldLine: {
      isClosed: false,
      isFoldLine: true,
      points: [
        { x: 0, y: 2.5 },
        { x: cm(waist + waistEase), y: 2.5 },
      ],
    },
    annotations: [{ position: { x: cm(waist / 2), y: 2.5 }, label: 'WAISTBAND (FOLD)' }],
    keyMeasurements: [`Waist: ${waist}cm`],
  }

  return { pieces: [frontPiece, backPiece, waistbandPiece], warnings }
}
