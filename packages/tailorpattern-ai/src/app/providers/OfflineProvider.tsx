import { useEffect, type ReactNode } from 'react'
import { startSyncOnReconnect } from '../../shared/sync/syncEngine'

export function OfflineProvider({ children }: { children: ReactNode }): JSX.Element {
  useEffect(() => {
    const cleanup = startSyncOnReconnect()
    return cleanup
  }, [])

  return <>{children}</>
}
