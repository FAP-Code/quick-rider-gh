import { cn } from '../../utils/cn'

interface SkeletonProps {
  className?: string
  rounded?: 'sm' | 'md' | 'full'
}

export function Skeleton({ className, rounded = 'md' }: SkeletonProps): JSX.Element {
  return (
    <div
      className={cn(
        'animate-pulse bg-surface-muted',
        rounded === 'sm' && 'rounded',
        rounded === 'md' && 'rounded-xl',
        rounded === 'full' && 'rounded-full',
        className,
      )}
    />
  )
}

export function CustomerCardSkeleton(): JSX.Element {
  return (
    <div className="bg-white rounded-2xl border border-surface-muted p-4 flex items-center gap-3">
      <Skeleton className="w-9 h-9" rounded="full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  )
}

export function PatternCardSkeleton(): JSX.Element {
  return (
    <div className="bg-white rounded-2xl border border-surface-muted p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-5 w-5" rounded="sm" />
        <Skeleton className="h-4 w-40" />
      </div>
      <Skeleton className="h-3 w-28" />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16" rounded="full" />
        <Skeleton className="h-5 w-20" rounded="full" />
      </div>
    </div>
  )
}
