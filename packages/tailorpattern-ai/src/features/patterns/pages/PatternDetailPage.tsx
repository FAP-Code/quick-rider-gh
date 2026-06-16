import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '../../../shared/components/ui/Button'
import { Badge } from '../../../shared/components/ui/Badge'
import { PatternSVGPreview } from '../components/PatternSVGPreview'
import { PatternLegend } from '../components/PatternLegend'
import { Skeleton } from '../../../shared/components/ui/Skeleton'
import { usePatternProject } from '../hooks/usePatternProjects'
import { usePDFExport } from '../hooks/usePDFExport'
import { useCustomer } from '../../customers/hooks/useCustomers'
import { useMeasurement } from '../../measurements/hooks/useMeasurements'
import { formatDate } from '../../../shared/utils/format'
import type { PatternData } from '../types/pattern.types'
import { useParams } from 'react-router-dom'

const STATUS_BADGES: Record<string, { variant: 'success' | 'warning' | 'info' | 'gold' | 'default'; label: string }> = {
  draft: { variant: 'warning', label: 'Draft' },
  generated: { variant: 'success', label: 'Generated' },
  approved: { variant: 'info', label: 'Approved' },
  in_production: { variant: 'gold', label: 'In Production' },
  archived: { variant: 'default', label: 'Archived' },
}

export function PatternDetailPage(): JSX.Element {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: project, isLoading } = usePatternProject(id)
  const { data: customer } = useCustomer(project?.customerId ?? '')
  const { data: measurementSet } = useMeasurement(project?.measurementSetId ?? '')
  const pdfExport = usePDFExport()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <div className="bg-white rounded-2xl border border-surface-muted p-4 space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-[500px] w-full" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-16">
        <p className="text-text-muted mb-4">Pattern project not found.</p>
        <Button variant="ghost" size="sm" onClick={() => navigate('/patterns')}>
          Back to Patterns
        </Button>
      </div>
    )
  }

  const patternData = project.patternData as PatternData | undefined
  const statusBadge = STATUS_BADGES[project.status] ?? STATUS_BADGES.draft!

  const handleExportPDF = (): void => {
    if (!patternData || !measurementSet) return
    void pdfExport.mutateAsync({
      patternData,
      customerName: customer?.fullName ?? 'Customer',
      measurements: measurementSet.measurements,
      projectName: project.name,
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Back */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/patterns')}
        leftIcon={<ArrowLeft size={16} />}
      >
        Patterns
      </Button>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-surface-muted p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-text-primary truncate">{project.name}</h1>
            <p className="text-sm text-text-muted mt-0.5">
              {project.garmentType.replace(/-/g, ' ').replace(/^(mens|womens|childrens|uniform)-/i, (m) => m.slice(0, -1) + '’s ')}
              {customer && <> &middot; {customer.fullName}</>}
            </p>
            <div className="flex items-center flex-wrap gap-2 mt-2">
              <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
              <span className="text-xs text-text-muted">{formatDate(project.updatedAt)}</span>
              <span className="text-xs text-text-muted font-measurement">v{project.version}</span>
              {patternData && (
                <span className="text-xs text-text-muted">
                  {patternData.pieces.length} piece{patternData.pieces.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 flex-shrink-0">
            <Button
              size="sm"
              leftIcon={<Download size={14} />}
              disabled={!patternData || pdfExport.isPending}
              loading={pdfExport.isPending}
              onClick={handleExportPDF}
            >
              Export PDF
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RefreshCw size={14} />}
              onClick={() => navigate('/patterns/new')}
            >
              New Version
            </Button>
          </div>
        </div>
      </div>

      {/* Pattern preview + legend */}
      {patternData ? (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-4 items-start">
          <PatternSVGPreview patternData={patternData} className="min-h-[480px]" />
          <PatternLegend patternData={patternData} />
        </div>
      ) : (
        <div className="bg-surface-subtle rounded-2xl border border-surface-muted p-10 text-center">
          <p className="text-text-muted text-sm mb-4">
            Pattern pieces not yet generated for this project.
          </p>
          <Button size="sm" onClick={() => navigate('/patterns/new')}>
            Generate Pattern
          </Button>
        </div>
      )}

      {/* Notes */}
      {project.notes && (
        <div className="bg-white rounded-2xl border border-surface-muted p-4">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Notes</p>
          <p className="text-sm text-text-body whitespace-pre-line">{project.notes}</p>
        </div>
      )}
    </motion.div>
  )
}
