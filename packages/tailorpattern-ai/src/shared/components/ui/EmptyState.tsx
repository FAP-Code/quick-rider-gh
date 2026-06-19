import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Button } from './Button'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description?: string | undefined
  action?: { label: string; onClick: () => void } | undefined
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps): JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col items-center justify-center text-center py-14 px-4"
    >
      <div className="relative mb-4">
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-brand-gold/15 to-brand-navy/5 blur-md scale-110" />
        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-surface-base to-surface-subtle border border-surface-muted flex items-center justify-center text-brand-mid shadow-card">
          {icon}
        </div>
      </div>
      <p className="text-base font-semibold text-text-primary mb-1">{title}</p>
      {description && (
        <p className="text-sm text-text-muted max-w-xs mb-5">{description}</p>
      )}
      {action && (
        <Button size="sm" variant="secondary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </motion.div>
  )
}
