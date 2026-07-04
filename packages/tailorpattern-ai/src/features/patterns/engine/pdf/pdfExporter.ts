import { jsPDF } from 'jspdf'
import type { PatternData } from '../../types/pattern.types'
import type { MeasurementData } from '../../../measurements/types/measurement.types'
import type { Business } from '../../../../shared/types/common.types'
import { renderPatternToSVG } from '../svg/svgRenderer'
import { formatDate } from '../../../../shared/utils/format'

export interface PDFExportOptions {
  paperSize: 'a4' | 'letter'
  scale: number
  includeSeamAllowances: boolean
  includeMeasurementsSheet: boolean
  copies: number
}

const DEFAULT_OPTIONS: PDFExportOptions = {
  paperSize: 'a4',
  scale: 1,
  includeSeamAllowances: true,
  includeMeasurementsSheet: true,
  copies: 1,
}

export async function exportPatternToPDF(
  patternData: PatternData,
  customerName: string,
  measurements: MeasurementData,
  business: Business | null,
  projectName: string,
  options: Partial<PDFExportOptions> = {},
): Promise<Blob> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const isA4 = opts.paperSize === 'a4'
  const pageW = isA4 ? 210 : 215.9
  const pageH = isA4 ? 297 : 279.4

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: opts.paperSize === 'a4' ? 'a4' : 'letter',
  })

  const MARGIN = 15
  const CONTENT_W = pageW - MARGIN * 2

  // ── PAGE 1: Information Sheet ─────────────────────────────────────────────
  pdf.setFillColor(26, 26, 46) // brand-navy
  pdf.rect(0, 0, pageW, 35, 'F')

  pdf.setTextColor(201, 168, 76) // brand-gold
  pdf.setFontSize(16)
  pdf.setFont('helvetica', 'bold')
  pdf.text(business?.name ?? 'TailorPattern AI', MARGIN, 15)

  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'normal')
  pdf.text("The Tailor's Friend™", MARGIN, 22)

  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(11)
  pdf.setFont('helvetica', 'bold')
  pdf.text(projectName, pageW - MARGIN, 15, { align: 'right' })

  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'normal')
  pdf.text(`Generated: ${formatDate(patternData.generatedAt)}`, pageW - MARGIN, 22, { align: 'right' })
  pdf.text(`Version: ${patternData.version}`, pageW - MARGIN, 27, { align: 'right' })

  // Customer & Garment Info
  let yPos = 50
  const col1 = MARGIN
  const col2 = MARGIN + CONTENT_W / 2

  pdf.setTextColor(107, 114, 128)
  pdf.setFontSize(7)
  pdf.setFont('helvetica', 'normal')

  const infoRows: [string, string, string, string][] = [
    ['Customer', customerName, 'Garment', patternData.garmentType.replace(/-/g, ' ').toUpperCase()],
    ['Seam Allowance', `${patternData.seamAllowance}cm`, 'Unit', patternData.unit],
    ['Ease Preference', (patternData.styleParameters as { easePreference?: string }).easePreference ?? 'regular', 'Pieces', `${patternData.pieces.length}`],
  ]

  infoRows.forEach(([l1, v1, l2, v2]) => {
    pdf.setTextColor(107, 114, 128)
    pdf.text(l1, col1, yPos)
    pdf.setTextColor(26, 26, 46)
    pdf.setFont('helvetica', 'bold')
    pdf.text(v1, col1 + 35, yPos)

    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(107, 114, 128)
    pdf.text(l2, col2, yPos)
    pdf.setTextColor(26, 26, 46)
    pdf.setFont('helvetica', 'bold')
    pdf.text(v2, col2 + 35, yPos)

    pdf.setFont('helvetica', 'normal')
    yPos += 8
  })

  // Key measurements summary
  yPos += 4
  pdf.setTextColor(26, 26, 46)
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Key Measurements', col1, yPos)
  yPos += 5

  const keyMeasFields: [string, keyof typeof measurements][] = [
    ['Chest / Bust', 'chest'], ['Waist', 'waist'], ['Hips', 'hips'],
    ['Shoulder Width', 'shoulderWidth'], ['Back Length', 'backBodyLength'],
    ['Sleeve Length', 'sleeveLength'], ['Inseam', 'trouserInseam'],
  ]

  const filledKeys = keyMeasFields.filter(([, k]) => measurements[k] !== undefined)
  const cols = 3
  filledKeys.forEach(([label, key], i) => {
    const colIdx = i % cols
    const colX = col1 + colIdx * (CONTENT_W / cols)
    if (colIdx === 0 && i > 0) yPos += 5
    pdf.setFontSize(7)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(107, 114, 128)
    pdf.text(label, colX, yPos)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(26, 26, 46)
    pdf.text(`${measurements[key]}${measurements.unit}`, colX + 28, yPos)
  })
  yPos += 8

  // Separator
  pdf.setDrawColor(230, 232, 240)
  pdf.line(col1, yPos, col1 + CONTENT_W, yPos)
  yPos += 6

  // Piece list
  pdf.setTextColor(26, 26, 46)
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Pattern Pieces', col1, yPos)
  yPos += 6

  patternData.pieces.forEach((piece, i) => {
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(45, 45, 45)
    const keyMeas = piece.keyMeasurements?.join('  ') ?? ''
    pdf.text(`${i + 1}. ${piece.name}  ×${piece.quantity ?? 1}`, col1 + 3, yPos)
    if (keyMeas) {
      pdf.setFontSize(6)
      pdf.setTextColor(107, 114, 128)
      pdf.text(keyMeas, col1 + 8, yPos + 4)
      yPos += 4
    }
    yPos += 5
  })

  // Measurements sheet (page 2)
  if (opts.includeMeasurementsSheet) {
    pdf.addPage()

    pdf.setFillColor(244, 246, 251)
    pdf.rect(0, 0, pageW, pageH, 'F')

    let my = MARGIN + 5
    pdf.setTextColor(26, 26, 46)
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'bold')
    pdf.text(`Measurements — ${customerName}`, MARGIN, my)
    my += 10

    const measEntries = Object.entries(measurements).filter(
      ([k, v]) => k !== 'unit' && typeof v === 'number',
    )

    measEntries.forEach(([key, value], i) => {
      const label = key.replace(/([A-Z])/g, ' $1').trim()
      const col = i % 2 === 0 ? col1 : col2
      if (i % 2 === 0 && i > 0) my += 6

      pdf.setFontSize(7)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(107, 114, 128)
      pdf.text(label, col, my)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(26, 26, 46)
      pdf.text(`${value}${measurements.unit}`, col + 40, my)
    })
  }

  // Pattern SVG pages
  const svgString = renderPatternToSVG(patternData, {
    showSeamAllowances: opts.includeSeamAllowances,
    showGrainLines: true,
    showLabels: true,
    scale: opts.scale,
  })

  pdf.addPage()
  pdf.setFillColor(255, 255, 255)
  pdf.rect(0, 0, pageW, pageH, 'F')

  // Render SVG as embedded image via canvas (basic approach)
  // In production, use svg2pdf.js for vector fidelity
  const blob = new Blob([svgString], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const img = new Image()

  await new Promise<void>(resolve => {
    img.onload = (): void => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(img, 0, 0)
        const dataUrl = canvas.toDataURL('image/png')
        const imgW = CONTENT_W
        const imgH = (img.height / img.width) * imgW
        pdf.addImage(dataUrl, 'PNG', MARGIN, MARGIN, imgW, Math.min(imgH, pageH - MARGIN * 2))
      }
      URL.revokeObjectURL(url)
      resolve()
    }
    img.onerror = (): void => resolve()
    img.src = url
  })

  // Footer on all pages
  const pageCount = pdf.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i)
    pdf.setFontSize(7)
    pdf.setTextColor(156, 163, 175)
    pdf.setFont('helvetica', 'normal')
    pdf.text(
      `TailorPattern AI — The Tailor's Friend™ | Page ${i} of ${pageCount}`,
      pageW / 2,
      pageH - 8,
      { align: 'center' },
    )
    pdf.text(
      '△ Assemble pages by matching registration marks at corners',
      pageW / 2,
      pageH - 4,
      { align: 'center' },
    )
  }

  return pdf.output('blob')
}
