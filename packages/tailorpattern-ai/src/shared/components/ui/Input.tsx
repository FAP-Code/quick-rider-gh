import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../utils/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftAddon?: ReactNode
  rightAddon?: ReactNode
  suffix?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftAddon, rightAddon, suffix, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-text-primary"
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leftAddon && (
            <div className="absolute left-3 text-text-muted">{leftAddon}</div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full rounded-xl border bg-white text-text-body placeholder:text-text-muted',
              'h-10 px-3 text-sm transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent',
              'disabled:bg-surface-subtle disabled:cursor-not-allowed',
              error
                ? 'border-red-400 focus:ring-red-400'
                : 'border-surface-muted hover:border-gray-300',
              leftAddon && 'pl-9',
              (rightAddon ?? suffix) && 'pr-12',
              className,
            )}
            {...props}
          />
          {suffix && (
            <span className="absolute right-3 text-sm text-text-muted font-measurement pointer-events-none">
              {suffix}
            </span>
          )}
          {rightAddon && <div className="absolute right-3 text-text-muted">{rightAddon}</div>}
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
      </div>
    )
  },
)
Input.displayName = 'Input'
