import type { EngineInput, EngineOutput } from '../../types'
import { cm } from '../../types'
import type { PatternPiece } from '../../../types/pattern.types'
import { generateId } from '../../../../../shared/utils/uuid'

// Traditional West African garment construction
// Kaftan, Senator, Agbada — largely geometric/rectangular construction
export function generateTraditional(garmentType: string, input: EngineInput): EngineOutput {
  const { measurements: m } = input
  const warnings: string[] = []

  const chest = m.chest ?? 104
  const length = m.trouserOutseam ?? 130
  const neckCirc = m.neckCircumference ?? 40

  if (!m.chest) warnings.push('Chest measurement missing — using 104cm default for traditional wear')

  // Traditional wear uses generous ease (typically +16–20cm on chest)
  const chestEase = 16
  const bodyWidth = cm((chest + chestEase) / 2)
  const neckOpening = cm(neckCirc + 4)

  if (garmentType === 'mens-kaftan' || garmentType === 'mens-senator') {
    // Senator style — straight-cut top + matching trouser
    const kaftan: PatternPiece = {
      id: generateId(),
      name: garmentType === 'mens-senator' ? 'Senator Top' : 'Kaftan Body',
      color: '#1A1A2E',
      quantity: 2,
      mirror: true,
      outline: {
        isClosed: true, isSeamLine: false,
        points: [
          { x: 0, y: 0 },
          { x: bodyWidth, y: 0 },
          { x: bodyWidth, y: garmentType === 'mens-senator' ? cm(length * 0.5) : length },
          { x: 0, y: garmentType === 'mens-senator' ? cm(length * 0.5) : length },
        ],
      },
      foldLine: {
        isClosed: false, isFoldLine: true,
        points: [{ x: 0, y: 0 }, { x: 0, y: length }],
      },
      annotations: [
        { position: { x: bodyWidth / 2, y: length / 4 }, label: 'FRONT/BACK (CUT ON FOLD)' },
      ],
    }

    const neckFacing: PatternPiece = {
      id: generateId(),
      name: 'Neck Facing / Band',
      color: '#C9A84C',
      quantity: 1,
      mirror: false,
      outline: {
        isClosed: true, isSeamLine: false,
        points: [
          { x: 0, y: 0 },
          { x: cm(neckOpening / 2), y: 0 },
          { x: cm(neckOpening / 2), y: 5 },
          { x: 0, y: 5 },
        ],
      },
      annotations: [{ position: { x: cm(neckOpening / 4), y: 2.5 }, label: 'NECK BAND' }],
    }

    return { pieces: [kaftan, neckFacing], warnings }
  }

  // Agbada — large flowing outer robe
  const agbadaOuter: PatternPiece = {
    id: generateId(),
    name: 'Agbada Outer Robe',
    color: '#1A1A2E',
    quantity: 2,
    mirror: true,
    outline: {
      isClosed: true, isSeamLine: false,
      points: [
        { x: 0, y: 0 },
        { x: cm(bodyWidth + 30), y: 0 },   // extra width for agbada
        { x: cm(bodyWidth + 30), y: length },
        { x: 0, y: length },
      ],
    },
    foldLine: {
      isClosed: false, isFoldLine: true,
      points: [{ x: 0, y: 0 }, { x: 0, y: length }],
    },
    annotations: [{ position: { x: cm(bodyWidth / 2 + 15), y: length / 2 }, label: 'AGBADA (CUT ON FOLD)' }],
  }

  const agbadaInner: PatternPiece = {
    id: generateId(),
    name: 'Agbada Inner Top (Buba)',
    color: '#0F3460',
    quantity: 2,
    mirror: true,
    outline: {
      isClosed: true, isSeamLine: false,
      points: [
        { x: 0, y: 0 },
        { x: bodyWidth, y: 0 },
        { x: bodyWidth, y: cm(length * 0.6) },
        { x: 0, y: cm(length * 0.6) },
      ],
    },
    foldLine: {
      isClosed: false, isFoldLine: true,
      points: [{ x: 0, y: 0 }, { x: 0, y: cm(length * 0.6) }],
    },
    annotations: [{ position: { x: bodyWidth / 2, y: length * 0.3 }, label: 'BUBA (CUT ON FOLD)' }],
  }

  return { pieces: [agbadaOuter, agbadaInner], warnings }
}
