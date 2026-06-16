export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, string[]>
}

export interface SyncQueueItem {
  id: string
  operation: 'create' | 'update' | 'delete'
  table: string
  recordId: string
  payload: unknown
  attempts: number
  lastAttemptAt?: string
  createdAt: string
}
