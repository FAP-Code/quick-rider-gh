export interface GarmentPhotoAnalysis {
  garmentType: string
  silhouette: string
  collarStyle: string
  sleeveStyle: string
  closureType: string
  pocketDetails: string
  fabricType: string
  easePreference: 'slim' | 'regular' | 'relaxed'
  designNotes: string
  confidence: 'high' | 'medium' | 'low'
}

export interface CustomerPhotoAnalysis {
  proportionNotes: string
  postureNotes: string
  recommendedCheckpoints: string[]
  fitHints: string[]
  confidence: 'high' | 'medium' | 'low'
}

export interface PatternUploadAnalysis {
  detectedPieces: string[]
  grainLineNotes: string
  seamAllowanceEstimate: string
  constructionNotes: string
  confidence: 'high' | 'medium' | 'low'
}

export type PhotoAnalysisResult =
  | { type: 'garment-photo'; data: GarmentPhotoAnalysis }
  | { type: 'customer-photo'; data: CustomerPhotoAnalysis }
  | { type: 'pattern-upload'; data: PatternUploadAnalysis }

export type AnalysisStatus = 'idle' | 'loading' | 'done' | 'error'
