import type { MeasurementData } from '../types/measurement.types'

export interface FieldDefinition {
  key: keyof MeasurementData
  label: string
  hint: string
  section: string
  minCm: number
  maxCm: number
}

export const MEASUREMENT_SECTIONS = [
  'Upper Body',
  'Neck & Collar',
  'Arms & Sleeves',
  'Torso Lengths',
  'Lower Body',
] as const

export const MEASUREMENT_FIELDS: FieldDefinition[] = [
  // Upper Body
  {
    key: 'chest',
    label: 'Chest / Bust',
    hint: 'Measure around the fullest part of the chest, keeping the tape parallel to the floor.',
    section: 'Upper Body',
    minCm: 60,
    maxCm: 180,
  },
  {
    key: 'waist',
    label: 'Waist',
    hint: 'Measure around the natural waistline, the narrowest part of the torso.',
    section: 'Upper Body',
    minCm: 50,
    maxCm: 160,
  },
  {
    key: 'hips',
    label: 'Hips',
    hint: 'Measure around the fullest part of the hips, approximately 20cm below the waist.',
    section: 'Upper Body',
    minCm: 60,
    maxCm: 180,
  },
  {
    key: 'shoulderWidth',
    label: 'Shoulder Width',
    hint: 'Measure from the tip of one shoulder to the tip of the other, across the back of the neck.',
    section: 'Upper Body',
    minCm: 30,
    maxCm: 70,
  },
  {
    key: 'acrossBack',
    label: 'Across Back',
    hint: 'Measure horizontally across the back from armhole to armhole, about 12cm down from the neck.',
    section: 'Upper Body',
    minCm: 28,
    maxCm: 60,
  },
  {
    key: 'acrossChest',
    label: 'Across Chest',
    hint: 'Measure across the front from armhole to armhole at chest level.',
    section: 'Upper Body',
    minCm: 25,
    maxCm: 55,
  },
  // Neck
  {
    key: 'neckCircumference',
    label: 'Neck Circumference',
    hint: 'Measure around the base of the neck. Add 1cm for ease. Keep one finger under the tape.',
    section: 'Neck & Collar',
    minCm: 28,
    maxCm: 60,
  },
  {
    key: 'collarStand',
    label: 'Collar Stand Height',
    hint: 'The height of the collar band, typically 3–4cm for shirts.',
    section: 'Neck & Collar',
    minCm: 2,
    maxCm: 6,
  },
  // Arms
  {
    key: 'sleeveLength',
    label: 'Full Sleeve Length',
    hint: 'Measure from the shoulder point, over a slightly bent elbow, to the wrist bone.',
    section: 'Arms & Sleeves',
    minCm: 40,
    maxCm: 75,
  },
  {
    key: 'shortSleeveLength',
    label: 'Short Sleeve Length',
    hint: 'Measure from shoulder point to desired short sleeve hem length.',
    section: 'Arms & Sleeves',
    minCm: 10,
    maxCm: 35,
  },
  {
    key: 'bicepCircumference',
    label: 'Bicep Circumference',
    hint: 'Measure around the fullest part of the upper arm while relaxed.',
    section: 'Arms & Sleeves',
    minCm: 20,
    maxCm: 60,
  },
  {
    key: 'wristCircumference',
    label: 'Wrist Circumference',
    hint: 'Measure around the wrist just below the wrist bone.',
    section: 'Arms & Sleeves',
    minCm: 13,
    maxCm: 25,
  },
  // Torso
  {
    key: 'frontBodyLength',
    label: 'Front Body Length',
    hint: 'Measure from the highest shoulder point, over the bust, to the natural waist.',
    section: 'Torso Lengths',
    minCm: 30,
    maxCm: 70,
  },
  {
    key: 'backBodyLength',
    label: 'Back Body Length',
    hint: 'Measure from the base of the neck (7th cervical vertebra) straight down to the natural waist.',
    section: 'Torso Lengths',
    minCm: 30,
    maxCm: 60,
  },
  {
    key: 'waistToHip',
    label: 'Waist to Hip',
    hint: 'Measure from the natural waist down to the fullest part of the hips.',
    section: 'Torso Lengths',
    minCm: 15,
    maxCm: 30,
  },
  // Lower Body
  {
    key: 'trouserInseam',
    label: 'Trouser Inseam',
    hint: 'Measure from the crotch seam down to the desired hem at the ankle.',
    section: 'Lower Body',
    minCm: 50,
    maxCm: 100,
  },
  {
    key: 'trouserOutseam',
    label: 'Trouser Outseam',
    hint: 'Measure from the natural waist, along the outside of the leg, to the desired hem.',
    section: 'Lower Body',
    minCm: 80,
    maxCm: 130,
  },
  {
    key: 'thighCircumference',
    label: 'Thigh Circumference',
    hint: 'Measure around the fullest part of the upper thigh.',
    section: 'Lower Body',
    minCm: 35,
    maxCm: 90,
  },
  {
    key: 'frontRise',
    label: 'Front Rise',
    hint: 'Sit on a flat surface and measure from the waistband to the seat of the chair (front).',
    section: 'Lower Body',
    minCm: 18,
    maxCm: 40,
  },
  {
    key: 'backRise',
    label: 'Back Rise',
    hint: 'Same as front rise but measured from the back. Typically 3–5cm more than front rise.',
    section: 'Lower Body',
    minCm: 22,
    maxCm: 50,
  },
]

export const MEASUREMENT_SECTIONS_MAP = MEASUREMENT_FIELDS.reduce<Record<string, FieldDefinition[]>>(
  (acc, field) => {
    const section = acc[field.section] ?? []
    return { ...acc, [field.section]: [...section, field] }
  },
  {},
)
