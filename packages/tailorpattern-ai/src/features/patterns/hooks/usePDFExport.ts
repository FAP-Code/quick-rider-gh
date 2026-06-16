import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { exportPatternToPDF, type PDFExportOptions } from '../engine/pdf/pdfExporter'
import type { PatternData } from '../types/pattern.types'
import type { MeasurementData } from '../../measurements/types/measurement.types'
import { useAuth } from '../../auth/useAuth'

export function usePDFExport() {
  const { business } = useAuth()

  return useMutation({
    mutationFn: async (args: {
      patternData: PatternData
      customerName: string
      measurements: MeasurementData
      projectName: string
      options?: Partial<PDFExportOptions>
    }) => {
      const blob = await exportPatternToPDF(
        args.patternData,
        args.customerName,
        args.measurements,
        business,
        args.projectName,
        args.options,
      )
      return blob
    },
    onSuccess: (blob, vars) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${vars.projectName.replace(/\s+/g, '-')}-pattern.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('PDF exported successfully')
    },
    onError: () => toast.error('PDF export failed — please try again'),
  })
}
