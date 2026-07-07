import { type ReactNode, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '../../utils/cn'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  side?: 'right' | 'bottom'
  className?: string
}

export function Drawer({ open, onClose, title, children, side = 'right', className }: DrawerProps): JSX.Element | null {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    if (open) {
      document.addEventListener('keydown', handleKey)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  const drawerVariants =
    side === 'right'
      ? {
          initial: { x: '100%' },
          animate: { x: 0 },
          exit: { x: '100%' },
        }
      : {
          initial: { y: '100%' },
          animate: { y: 0 },
          exit: { y: '100%' },
        }

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex">
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={cn(
              'absolute bg-white shadow-modal z-10',
              side === 'right'
                ? 'right-0 top-0 bottom-0 w-full max-w-md'
                : 'bottom-0 left-0 right-0 rounded-t-3xl max-h-[90vh]',
              className,
            )}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            {...drawerVariants}
          >
            <div className="flex flex-col h-full">
              {title && (
                <div className="flex items-center justify-between px-6 py-4 border-b border-surface-muted flex-shrink-0">
                  <h2 className="text-base font-semibold text-text-primary">{title}</h2>
                  <button
                    onClick={onClose}
                    className="p-1 rounded-lg text-text-muted hover:bg-surface-muted transition-colors focus-ring"
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}
              <div className="flex-1 overflow-y-auto p-6">{children}</div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
