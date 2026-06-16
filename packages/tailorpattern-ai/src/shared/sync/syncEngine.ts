import { apiClient } from '../api/client'
import { getPendingItems, markAttempt, removeFromQueue } from './syncQueue'
import { eventBus, EVENTS } from '../events/eventBus'

const MAX_ATTEMPTS = 5

export async function processSyncQueue(): Promise<void> {
  const items = await getPendingItems()
  if (items.length === 0) return

  let successCount = 0
  let errorCount = 0

  for (const item of items) {
    if (item.attempts >= MAX_ATTEMPTS) {
      // Permanently failed — remove after max retries
      await removeFromQueue(item.id)
      continue
    }

    try {
      switch (item.operation) {
        case 'create':
          await apiClient.post(`/${item.table}`, item.payload)
          break
        case 'update':
          await apiClient.put(`/${item.table}/${item.recordId}`, item.payload)
          break
        case 'delete':
          await apiClient.delete(`/${item.table}/${item.recordId}`)
          break
      }
      await removeFromQueue(item.id)
      successCount++
    } catch {
      await markAttempt(item.id)
      errorCount++
    }
  }

  if (errorCount === 0 && successCount > 0) {
    eventBus.emit(EVENTS.SYNC_COMPLETE, { count: successCount })
  } else if (errorCount > 0) {
    eventBus.emit(EVENTS.SYNC_ERROR, { errorCount, successCount })
  }
}

export function startSyncOnReconnect(): () => void {
  const handleOnline = (): void => {
    void processSyncQueue()
  }

  window.addEventListener('online', handleOnline)
  return () => window.removeEventListener('online', handleOnline)
}
