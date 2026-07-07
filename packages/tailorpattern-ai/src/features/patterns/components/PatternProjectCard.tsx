import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Scissors, Calendar, User } from 'lucide-react'
import { Badge, type BadgeVariant } from '../../../shared/components/ui/Badge'
import { formatRelativeTime } from '../../../shared/utils/format'
import type { PatternProject } from '../types/pattern.types'

interface PatternProjectCardProps {
  project: PatternProject
  customerName?: string
  index?: number
}

const STATUS_BADGE: Record<PatternProject['status'], { variant: BadgeVariant; label: string }> = {
  draft: { variant: 'warning', label: 'Draft' },
  generated: { variant: 'info', label: 'Generated' },
  approved: { variant: 'success', label: 'Approved' },
  in_production: { variant: 'gold', label: 'In Production' },
  archived: { variant: 'default', label: 'Archived' },
}

export function PatternProjectCard({
  project,
  customerName,
  index = 0,
}: PatternProjectCardProps): JSX.Element {
  const navigate = useNavigate()
  const statusBadge = STATUS_BADGE[project.status]

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.2 }}
      onClick={() => navigate(`/patterns/${project.id}`)}
      whileHover={{ y: -2 }}
      className="bg-white rounded-2xl border border-surface-muted p-4 cursor-pointer transition-shadow duration-200 hover:shadow-card-hover active:scale-[0.99]"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-gold/15 to-brand-gold/5 flex items-center justify-center flex-shrink-0">
          <Scissors size={16} className="text-brand-gold" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary truncate">{project.name}</p>
          <p className="text-xs text-text-muted mt-0.5">
            {project.garmentType.replace(/-/g, ' ').replace(/^(mens|womens|childrens|uniform)-/i, '')}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <Badge variant={statusBadge.variant} size="sm">
              {statusBadge.label}
            </Badge>
            {customerName && (
              <span className="flex items-center gap-1 text-xs text-text-muted">
                <User size={11} />
                {customerName}
              </span>
            )}
          </div>
        </div>
        <div className="text-xs text-text-muted flex items-center gap-1 flex-shrink-0">
          <Calendar size={11} />
          {formatRelativeTime(project.createdAt)}
        </div>
      </div>
    </motion.div>
  )
}
