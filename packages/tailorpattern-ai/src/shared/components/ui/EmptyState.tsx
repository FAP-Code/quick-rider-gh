import { type ReactNode } from 'react'
import { Button } from './Button'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description?: string | undefined
  action?: { label: string; onClick: () => void } | undefined
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      <div className="w-14 h-14 rounded-2xl bg-surface-muted flex items-center justify-center mb-4 text-text-muted">
        {icon}
      </div>
      <p className="text-base font-semibold text-text-primary mb-1">{title}</p>
      {description && (
        <p className="text-sm text-text-muted max-w-xs mb-4">{description}</p>
      )}
      {action && (
        <Button size="sm" variant="secondary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
