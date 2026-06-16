import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, RefreshCw, Share2 } from 'lucide-react'
import { Button } from '../../../shared/components/ui/Button'
import { Badge, type BadgeVariant } from '../../../shared/components/ui/Badge'
import { PatternSVGPreview } from '../components/PatternSVGPreview'
import { Skeleton } from '../../../shared/components/ui/Skeleton'
import { usePatternProject } from '../hooks/usePatternProjects'
import { usePDFExport } from '../hooks/usePDFExport'
import { useCustomer } from '../../customers/hooks/useCustomers'
import { useMeasurement } from '../../measurements/hooks/useMeasurements'
import type { PatternData } from '../types/pattern.types'
import { formatDate } from '../../../shared/utils/format'

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
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-16">
        <p className="text-text-muted">Pattern not found</p>
        <Button onClick={() => navigate('/patterns')} variant="ghost" size="sm" className="mt-4">Back to Patterns</Button>
      </div>
    )
  }

  const patternData = project.patternData as PatternData | undefined

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
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/patterns')}
          leftIcon={<ArrowLeft size={16} />}
        >
          Patterns
        </Button>
      </div>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-surface-muted p-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-bold text-text-primary">{project.name}</h1>
            <p className="text-sm text-text-muted mt-0.5">
              {project.garmentType.replace(/-/g, ' ')}
              {customer && ` · ${customer.fullName}`}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge
                variant={project.status === 'generated' ? 'success' : project.status === 'draft' ? 'warning' : 'info'}
              >
                {project.status}
              </Badge>
              <span className="text-xs text-text-muted">
                {formatDate(project.updatedAt)}
              </span>
              <span className="text-xs text-text-muted">v{project.version}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RefreshCw size={14} />}
              onClick={() => navigate('/patterns/new')}
            >
              New Version
            </Button>
            <Button
              size="sm"
              leftIcon={<Download size={14} />}
              disabled={!patternData || pdfExport.isPending}
              loading={pdfExport.isPending}
              onClick={handleExportPDF}
            >
              Export PDF
            </Button>
          </div>
        </div>
      </div>

      {/* SVG Preview */}
      {patternData ? (
        <PatternSVGPreview patternData={patternData} className="min-h-[500px]" />
      ) : (
        <div className="bg-surface-subtle rounded-2xl p-8 text-center">
          <p className="text-text-muted text-sm">Pattern not yet generated.</p>
          <Button
            size="sm"
            className="mt-4"
            onClick={() => navigate('/patterns/new')}
          >
            Generate Pattern
          </Button>
        </div>
      )}
    </div>
  )
}
