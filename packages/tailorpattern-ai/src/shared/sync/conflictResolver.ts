// Conflict resolution for offline sync
// Phase 1: simple last-write-wins strategy
// Phase 3+: replace with CRDT-based merging if needed

import type { BaseEntity } from '../types/common.types'

export function resolveConflict<T extends BaseEntity>(local: T, remote: T): T {
  // Last-write-wins: use the most recently updated record
  const localTime = new Date(local.updatedAt).getTime()
  const remoteTime = new Date(remote.updatedAt).getTime()
  return localTime >= remoteTime ? local : remote
}
