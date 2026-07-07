/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { registerRoute, NavigationRoute } from 'workbox-routing'
import { NetworkFirst, CacheFirst } from 'workbox-strategies'
import { BackgroundSyncPlugin } from 'workbox-background-sync'

declare const self: ServiceWorkerGlobalScope

// Precache all build assets
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// Background sync for offline mutations
const bgSyncPlugin = new BackgroundSyncPlugin('sync-queue', {
  maxRetentionTime: 24 * 60, // 24 hours
})

// Navigation: serve app shell for all page routes
registerRoute(
  new NavigationRoute(
    new NetworkFirst({
      cacheName: 'app-shell',
      networkTimeoutSeconds: 3,
    }),
  ),
)

// Google Fonts — CacheFirst
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts',
    plugins: [
      {
        cacheWillUpdate: async ({ response }) =>
          response?.status === 200 ? response : null,
      },
    ],
  }),
)

// Static assets: CacheFirst
registerRoute(
  ({ request }) =>
    request.destination === 'image' ||
    request.destination === 'font' ||
    request.destination === 'style',
  new CacheFirst({
    cacheName: 'static-assets',
  }),
)

// API calls: NetworkFirst with fallback
registerRoute(
  ({ url }) => url.pathname.startsWith('/api'),
  new NetworkFirst({
    cacheName: 'api-responses',
    networkTimeoutSeconds: 10,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    plugins: [bgSyncPlugin as any],
  }),
)

// Skip waiting on new SW activation
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    void self.skipWaiting()
  }
})

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim())
})
