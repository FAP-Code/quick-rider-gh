import { type ReactNode } from 'react'
import { cn } from '../../utils/cn'

interface PageHeaderProps {
  title: string
  subtitle?: string | undefined
  actions?: ReactNode | undefined
  className?: string | undefined
}

export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps): JSX.Element {
  return (
    <div className={cn('flex items-start justify-between mb-6', className)}>
      <div>
        <h1 className="text-xl font-bold text-text-primary">{title}</h1>
        {subtitle && <p className="text-sm text-text-muted mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0 ml-4">{actions}</div>}
    </div>
  )
}
