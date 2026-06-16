import { useState } from 'react'
import { WifiOff, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'
import { getPendingCount } from '../../sync/syncQueue'
import { useEffect } from 'react'

export function OfflineBanner(): JSX.Element | null {
  const isOnline = useOnlineStatus()
  const [dismissed, setDismissed] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    if (!isOnline) {
      setDismissed(false)
      void getPendingCount().then(setPendingCount)
    }
  }, [isOnline])

  const show = !isOnline && !dismissed

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-40 bg-amber-500 text-white px-4 py-2 flex items-center gap-2 text-sm"
        >
          <WifiOff size={14} className="flex-shrink-0" />
          <span className="flex-1">
            You’re offline — all changes are saved locally and will sync when reconnected
            {pendingCount > 0 && ` (${pendingCount} pending)`}
          </span>
          <button
            onClick={() => setDismissed(true)}
            className="p-0.5 rounded hover:bg-amber-600 transition-colors"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
