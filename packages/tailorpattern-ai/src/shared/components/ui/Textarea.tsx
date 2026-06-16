import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={textareaId} className="text-sm font-medium text-text-primary">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'w-full rounded-xl border bg-white text-text-body placeholder:text-text-muted',
            'px-3 py-2.5 text-sm transition-colors duration-150 resize-y min-h-[80px]',
            'focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent',
            'disabled:bg-surface-subtle disabled:cursor-not-allowed',
            error
              ? 'border-red-400 focus:ring-red-400'
              : 'border-surface-muted hover:border-gray-300',
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
      </div>
    )
  },
)
Textarea.displayName = 'Textarea'
