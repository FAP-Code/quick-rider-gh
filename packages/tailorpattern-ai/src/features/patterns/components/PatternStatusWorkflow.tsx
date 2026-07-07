import { CheckCircle2, Factory, Archive, RotateCcw, ThumbsUp, ChevronRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '../../../shared/components/ui/Button'
import { useUpdatePatternStatus } from '../hooks/usePatternProjects'
import type { PatternProject } from '../types/pattern.types'

interface PatternStatusWorkflowProps {
  project: PatternProject
}

type Status = PatternProject['status']

const STATUS_FLOW: Status[] = ['draft', 'generated', 'approved', 'in_production', 'archived']

const STATUS_META: Record<Status, { label: string; color: string; dot: string }> = {
  draft:         { label: 'Draft',         color: 'text-amber-600',   dot: 'bg-amber-400' },
  generated:     { label: 'Generated',     color: 'text-emerald-600', dot: 'bg-emerald-400' },
  approved:      { label: 'Approved',      color: 'text-blue-600',    dot: 'bg-blue-400' },
  in_production: { label: 'In Production', color: 'text-brand-gold',  dot: 'bg-brand-gold' },
  archived:      { label: 'Archived',      color: 'text-text-muted',  dot: 'bg-slate-300' },
}

interface Action {
  label: string
  icon: LucideIcon
  toStatus: Status
  variant: 'primary' | 'secondary' | 'ghost' | 'danger'
}

const ACTIONS: Partial<Record<Status, Action[]>> = {
  generated: [
    { label: 'Approve',   icon: ThumbsUp,    toStatus: 'approved',      variant: 'primary' },
    { label: 'Archive',   icon: Archive,     toStatus: 'archived',      variant: 'ghost' },
  ],
  approved: [
    { label: 'Send to Production', icon: Factory,    toStatus: 'in_production', variant: 'primary' },
    { label: 'Archive',            icon: Archive,    toStatus: 'archived',      variant: 'ghost' },
  ],
  in_production: [
    { label: 'Mark Complete / Archive', icon: CheckCircle2, toStatus: 'archived', variant: 'secondary' },
  ],
  archived: [
    { label: 'Restore to Draft', icon: RotateCcw, toStatus: 'draft', variant: 'ghost' },
  ],
}

export function PatternStatusWorkflow({ project }: PatternStatusWorkflowProps): JSX.Element {
  const updateStatus = useUpdatePatternStatus(project.id)
  const actions = ACTIONS[project.status] ?? []

  const currentIdx = STATUS_FLOW.indexOf(project.status)

  return (
    <div className="bg-white rounded-2xl border border-surface-muted p-4 space-y-4">
      {/* Title */}
      <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
        Pattern Lifecycle
      </p>

      {/* Status breadcrumb trail */}
      <div className="flex items-center gap-0.5 flex-wrap">
        {STATUS_FLOW.filter(s => s !== 'archived').map((s, i, arr) => {
          const meta = STATUS_META[s]
          const isDone = STATUS_FLOW.indexOf(s) < currentIdx
          const isCurrent = s === project.status
          const isLast = i === arr.length - 1
          return (
            <div key={s} className="flex items-center gap-0.5">
              <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${isCurrent ? 'bg-surface-subtle' : ''}`}>
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  isDone ? 'bg-emerald-400' : isCurrent ? meta.dot : 'bg-surface-muted'
                }`} />
                <span className={`text-[10px] font-medium ${
                  isCurrent ? meta.color : isDone ? 'text-emerald-600' : 'text-text-muted'
                }`}>
                  {meta.label}
                </span>
              </div>
              {!isLast && <ChevronRight size={10} className="text-surface-muted flex-shrink-0" />}
            </div>
          )
        })}
        {/* Archived as endpoint */}
        <div className="flex items-center gap-0.5">
          <ChevronRight size={10} className="text-surface-muted flex-shrink-0" />
          <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${project.status === 'archived' ? 'bg-surface-subtle' : ''}`}>
            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
              project.status === 'archived' ? 'bg-slate-300' : 'bg-surface-muted'
            }`} />
            <span className={`text-[10px] font-medium ${
              project.status === 'archived' ? 'text-text-muted' : 'text-text-muted opacity-50'
            }`}>
              Archived
            </span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      {actions.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1 border-t border-surface-muted">
          {actions.map(action => (
            <Button
              key={action.label}
              size="sm"
              variant={action.variant}
              leftIcon={<action.icon size={13} />}
              loading={updateStatus.isPending}
              disabled={updateStatus.isPending}
              onClick={() => void updateStatus.mutateAsync(action.toStatus)}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}

      {project.status === 'draft' && (
        <p className="text-[10px] text-text-muted pt-1 border-t border-surface-muted">
          Generate the pattern to unlock status actions.
        </p>
      )}
    </div>
  )
}
