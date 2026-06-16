import { db } from '../db'
import { generateId, nowISO } from '../utils/uuid'
import type { SyncQueueItem } from '../types/api.types'

export async function enqueue(
  operation: SyncQueueItem['operation'],
  table: string,
  recordId: string,
  payload: unknown,
): Promise<void> {
  await db.syncQueue.add({
    id: generateId(),
    operation,
    table,
    recordId,
    payload,
    attempts: 0,
    createdAt: nowISO(),
  })
}

export async function getPendingCount(): Promise<number> {
  return db.syncQueue.count()
}

export async function getPendingItems(): Promise<SyncQueueItem[]> {
  return db.syncQueue.orderBy('createdAt').toArray()
}

export async function markAttempt(id: string): Promise<void> {
  await db.syncQueue
    .where('id')
    .equals(id)
    .modify(item => {
      item.attempts += 1
      item.lastAttemptAt = nowISO()
    })
}

export async function removeFromQueue(id: string): Promise<void> {
  await db.syncQueue.delete(id)
}
