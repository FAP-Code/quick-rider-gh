import { type HTMLAttributes } from 'react'
import { cn } from '../../utils/cn'
import { initials } from '../../utils/format'

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  name: string
  photoUrl?: string | undefined
  size?: 'sm' | 'md' | 'lg' | 'xl' | undefined
}

const sizeClasses = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
}

const colorPalette = [
  'bg-blue-100 text-blue-700',
  'bg-violet-100 text-violet-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
  'bg-indigo-100 text-indigo-700',
  'bg-pink-100 text-pink-700',
]

function colorForName(name: string): string {
  const code = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return colorPalette[code % colorPalette.length] ?? 'bg-surface-muted text-text-muted'
}

export function Avatar({ name, photoUrl, size = 'md', className, ...props }: AvatarProps): JSX.Element {
  if (photoUrl) {
    return (
      <div
        className={cn('rounded-full overflow-hidden flex-shrink-0', sizeClasses[size], className)}
        {...props}
      >
        <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center flex-shrink-0 font-semibold select-none',
        sizeClasses[size],
        colorForName(name),
        className,
      )}
      aria-label={name}
      {...props}
    >
      {initials(name)}
    </div>
  )
}
