type EventHandler<T = unknown> = (payload: T) => void

interface EventBus {
  on<T>(event: string, handler: EventHandler<T>): () => void
  off(event: string, handler: EventHandler): void
  emit<T>(event: string, payload: T): void
}

function createEventBus(): EventBus {
  const listeners = new Map<string, Set<EventHandler>>()

  return {
    on<T>(event: string, handler: EventHandler<T>): () => void {
      if (!listeners.has(event)) listeners.set(event, new Set())
      listeners.get(event)!.add(handler as EventHandler)
      return () => listeners.get(event)?.delete(handler as EventHandler)
    },
    off(event: string, handler: EventHandler): void {
      listeners.get(event)?.delete(handler)
    },
    emit<T>(event: string, payload: T): void {
      listeners.get(event)?.forEach(h => h(payload))
    },
  }
}

export const eventBus = createEventBus()

// Typed event names for Phase 3+ module communication
export const EVENTS = {
  CUSTOMER_CREATED: 'customer:created',
  CUSTOMER_UPDATED: 'customer:updated',
  MEASUREMENT_SAVED: 'measurement:saved',
  PATTERN_GENERATED: 'pattern:generated',
  PATTERN_APPROVED: 'pattern:approved',
  SYNC_COMPLETE: 'sync:complete',
  SYNC_ERROR: 'sync:error',
} as const
