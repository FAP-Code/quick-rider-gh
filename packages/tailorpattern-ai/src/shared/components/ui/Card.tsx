import { type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../utils/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  hoverable?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
  variant?: 'default' | 'gradient'
}

export function Card({
  children,
  hoverable = false,
  padding = 'md',
  variant = 'default',
  className,
  ...props
}: CardProps): JSX.Element {
  return (
    <div
      className={cn(
        'rounded-2xl border border-surface-muted shadow-card transition-all duration-200',
        variant === 'default' && 'bg-white',
        variant === 'gradient' && 'bg-gradient-to-br from-white to-surface-subtle',
        hoverable && 'cursor-pointer hover:shadow-card-hover hover:-translate-y-0.5',
        padding === 'none' && 'p-0',
        padding === 'sm' && 'p-3',
        padding === 'md' && 'p-4',
        padding === 'lg' && 'p-6',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>): JSX.Element {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>): JSX.Element {
  return (
    <h3 className={cn('text-base font-semibold text-text-primary', className)} {...props}>
      {children}
    </h3>
  )
}
