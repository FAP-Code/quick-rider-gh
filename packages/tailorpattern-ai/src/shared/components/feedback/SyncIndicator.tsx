import { useState, useEffect } from 'react'
import { Cloud, CloudOff, RefreshCw, CheckCircle } from 'lucide-react'
import { cn } from '../../utils/cn'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'
import { getPendingCount } from '../../sync/syncQueue'
import { processSyncQueue } from '../../sync/syncEngine'
import { formatRelativeTime } from '../../utils/format'

export function SyncIndicator(): JSX.Element {
  const isOnline = useOnlineStatus()
  const [pendingCount, setPendingCount] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [lastSynced, setLastSynced] = useState<string | null>(null)

  useEffect(() => {
    const refresh = (): void => {
      void getPendingCount().then(setPendingCount)
    }
    refresh()
    const id = setInterval(refresh, 10_000)
    return () => clearInterval(id)
  }, [])

  const handleSync = async (): Promise<void> => {
    if (!isOnline || syncing) return
    setSyncing(true)
    try {
      await processSyncQueue()
      setLastSynced(new Date().toISOString())
      void getPendingCount().then(setPendingCount)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <button
      onClick={() => void handleSync()}
      disabled={!isOnline || syncing}
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors',
        isOnline
          ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
          : 'text-text-muted bg-surface-muted cursor-default',
      )}
      title={lastSynced ? `Last synced ${formatRelativeTime(lastSynced)}` : 'Not yet synced'}
    >
      {syncing ? (
        <RefreshCw size={12} className="animate-spin" />
      ) : isOnline ? (
        pendingCount > 0 ? (
          <Cloud size={12} />
        ) : (
          <CheckCircle size={12} />
        )
      ) : (
        <CloudOff size={12} />
      )}
      {syncing
        ? 'Syncing…'
        : isOnline
          ? pendingCount > 0
            ? `${pendingCount} pending`
            : 'Synced'
          : 'Offline'}
    </button>
  )
}
