import { z } from 'zod'

export const MeasurementDataSchema = z.object({
  // Upper Body
  chest: z.number().min(0).max(300).optional(),
  bust: z.number().min(0).max(300).optional(),
  waist: z.number().min(0).max(300).optional(),
  hips: z.number().min(0).max(300).optional(),
  shoulderWidth: z.number().min(0).max(100).optional(),
  acrossBack: z.number().min(0).max(100).optional(),
  acrossChest: z.number().min(0).max(100).optional(),
  // Neck
  neckCircumference: z.number().min(0).max(100).optional(),
  collarStand: z.number().min(0).max(20).optional(),
  // Arms
  sleeveLength: z.number().min(0).max(100).optional(),
  shortSleeveLength: z.number().min(0).max(60).optional(),
  bicepCircumference: z.number().min(0).max(100).optional(),
  forearmCircumference: z.number().min(0).max(80).optional(),
  wristCircumference: z.number().min(0).max(50).optional(),
  // Torso
  frontBodyLength: z.number().min(0).max(120).optional(),
  backBodyLength: z.number().min(0).max(120).optional(),
  bustPointToWaist: z.number().min(0).max(60).optional(),
  waistToHip: z.number().min(0).max(60).optional(),
  // Lower Body
  trouserInseam: z.number().min(0).max(120).optional(),
  trouserOutseam: z.number().min(0).max(150).optional(),
  thighCircumference: z.number().min(0).max(100).optional(),
  kneeCircumference: z.number().min(0).max(80).optional(),
  ankleCircumference: z.number().min(0).max(50).optional(),
  frontRise: z.number().min(0).max(60).optional(),
  backRise: z.number().min(0).max(70).optional(),
  // Metadata
  unit: z.enum(['cm', 'inches']),
})

export type MeasurementData = z.infer<typeof MeasurementDataSchema>

export const MeasurementSetSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  businessId: z.string(),
  label: z.string().min(1, 'Label is required'),
  measurements: MeasurementDataSchema,
  postureNotes: z.string().optional(),
  takenBy: z.string().optional(),
  takenAt: z.string(),
  isDefault: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type MeasurementSet = z.infer<typeof MeasurementSetSchema>

export const MeasurementFormSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  takenAt: z.string(),
  unit: z.enum(['cm', 'inches']),
  measurements: MeasurementDataSchema,
  postureNotes: z.string().optional(),
})

export type MeasurementFormData = z.infer<typeof MeasurementFormSchema>

export interface MeasurementWarning {
  field: keyof MeasurementData
  message: string
}
