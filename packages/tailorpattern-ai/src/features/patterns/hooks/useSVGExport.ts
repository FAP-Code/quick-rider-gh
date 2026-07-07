import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { renderPatternToSVG } from '../engine/svg/svgRenderer'
import type { PatternData } from '../types/pattern.types'

export function useSVGExport() {
  return useMutation({
    mutationFn: async (args: { patternData: PatternData; projectName: string }) => {
      const svg = renderPatternToSVG(args.patternData, {
        showSeamAllowances: true,
        showGrainLines: true,
        showLabels: true,
        scale: 1,
      })
      const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
      return { blob, projectName: args.projectName }
    },
    onSuccess: ({ blob, projectName }) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${projectName.replace(/\s+/g, '-')}-pattern.svg`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('SVG exported successfully')
    },
    onError: () => toast.error('SVG export failed — please try again'),
  })
}
