import { z } from 'zod'

export const GARMENT_TYPES = [
  // Men's
  'mens-suit-jacket',
  'mens-trouser',
  'mens-formal-shirt',
  'mens-casual-shirt',
  'mens-agbada',
  'mens-senator',
  'mens-kaftan',
  'mens-dashiki',
  // Women's
  'womens-blouse',
  'womens-aline-skirt',
  'womens-straight-skirt',
  'womens-flared-skirt',
  'womens-shift-dress',
  'womens-fit-flare-dress',
  'womens-wrap-dress',
  'womens-suit-jacket',
  // Children's
  'childrens-shirt',
  'childrens-dress',
  'childrens-trouser',
  // Business/Uniform
  'uniform-shirt-m',
  'uniform-shirt-f',
  'uniform-skirt',
] as const

export type GarmentType = (typeof GARMENT_TYPES)[number]

export interface StyleParameters {
  // Suit Jacket
  lapelStyle?: 'notch' | 'peak' | 'shawl'
  buttonCount?: 1 | 2 | 3
  jacketLength?: 'short' | 'standard' | 'long'
  ventStyle?: 'none' | 'single' | 'double'
  pocketStyle?: 'flap' | 'patch' | 'welt' | 'none'
  sleeveConstruction?: '1-piece' | '2-piece'
  easePreference?: 'slim' | 'regular' | 'relaxed'
  lining?: boolean
  // Trouser
  waistbandStyle?: 'regular' | 'high-rise' | 'low-rise'
  legStyle?: 'slim' | 'straight' | 'wide' | 'tapered'
  pleat?: 'none' | 'single' | 'double'
  turnUp?: 0 | 4 | 5
  flyType?: 'zip' | 'button'
  // Shirt
  collarStyle?: 'point' | 'spread' | 'button-down' | 'mandarin' | 'band'
  cuffStyle?: 'barrel' | 'french'
  hemStyle?: 'straight' | 'curved' | 'rounded'
  // Skirt
  skirtLength?: 'mini' | 'knee' | 'midi' | 'maxi'
  // General
  seamAllowance?: number
  // Children's scaling
  childAge?: number
}

export interface Point {
  x: number
  y: number
}

export interface PatternPath {
  points: Point[]
  isClosed: boolean
  isSeamLine?: boolean
  isFoldLine?: boolean
  isGrainLine?: boolean
}

export interface NotchMark {
  position: Point
  angle: number
}

export interface DartDefinition {
  apex: Point
  legA: Point
  legB: Point
  depth: number
}

export interface PatternPiece {
  id: string
  name: string
  outline: PatternPath
  seamLine?: PatternPath
  grainLine?: { start: Point; end: Point }
  foldLine?: PatternPath
  notches?: NotchMark[]
  darts?: DartDefinition[]
  annotations?: Array<{ position: Point; label: string }>
  color?: string
  quantity?: number
  mirror?: boolean
}

export interface PatternData {
  garmentType: GarmentType
  pieces: PatternPiece[]
  styleParameters: StyleParameters
  seamAllowance: number
  unit: 'cm' | 'inches'
  generatedAt: string
  version: number
}

export const PatternProjectSchema = z.object({
  id: z.string(),
  businessId: z.string(),
  customerId: z.string(),
  measurementSetId: z.string(),
  name: z.string().min(1),
  garmentType: z.enum(GARMENT_TYPES),
  styleParameters: z.record(z.unknown()),
  patternData: z.unknown().optional(),
  svgCache: z.string().optional(),
  status: z.enum(['draft', 'generated', 'approved', 'in_production', 'archived']),
  version: z.number(),
  notes: z.string().optional(),
  photoReferenceUrl: z.string().optional(),
  sketchDataUrl: z.string().optional(),
  deletedAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type PatternProject = z.infer<typeof PatternProjectSchema>
