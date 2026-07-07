import '@testing-library/jest-dom'

// Suppress Dexie/IndexedDB warnings in the test environment
// Tests that exercise DB code should mock Dexie at the module level
Object.defineProperty(globalThis, 'indexedDB', {
  value: {
    open: () => ({
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null,
    }),
  },
  writable: true,
  configurable: true,
})
