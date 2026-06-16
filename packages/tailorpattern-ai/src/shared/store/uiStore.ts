import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  // View mode preferences (persisted)
  patternViewMode: 'grid' | 'list'
  setPatternViewMode: (mode: 'grid' | 'list') => void
  customerViewMode: 'grid' | 'list'
  setCustomerViewMode: (mode: 'grid' | 'list') => void
  // Last visited customer (for breadcrumb continuity)
  lastCustomerId: string | null
  setLastCustomerId: (id: string | null) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      patternViewMode: 'grid',
      setPatternViewMode: (patternViewMode) => set({ patternViewMode }),
      customerViewMode: 'grid',
      setCustomerViewMode: (customerViewMode) => set({ customerViewMode }),
      lastCustomerId: null,
      setLastCustomerId: (lastCustomerId) => set({ lastCustomerId }),
    }),
    {
      name: 'tailorpattern-ui',
      // Only persist view modes, not transient state
      partialize: (s) => ({
        patternViewMode: s.patternViewMode,
        customerViewMode: s.customerViewMode,
      }),
    },
  ),
)
