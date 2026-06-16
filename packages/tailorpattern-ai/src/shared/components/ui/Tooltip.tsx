import { type ReactNode, useState } from 'react'
import { cn } from '../../utils/cn'

interface TooltipProps {
  content: ReactNode
  children: ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right' | undefined
  className?: string | undefined
}

export function Tooltip({ content, children, position = 'top', className }: TooltipProps): JSX.Element {
  const [visible, setVisible] = useState(false)

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  return (
    <div
      className={cn('relative inline-flex', className)}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          role="tooltip"
          className={cn(
            'absolute z-50 px-2.5 py-1.5 text-xs font-medium text-white bg-brand-navy rounded-lg shadow-modal',
            'whitespace-nowrap pointer-events-none animate-fade-in',
            positionClasses[position],
          )}
        >
          {content}
        </div>
      )}
    </div>
  )
}
