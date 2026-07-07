// PWA manifest configuration — primary source in public/manifest.webmanifest
// This is the TypeScript representation for type safety in vite.config.ts

export const MANIFEST = {
  name: 'TailorPattern AI',
  short_name: 'TailorPattern',
  description: 'AI-powered garment pattern generation for tailors and fashion designers',
  theme_color: '#1A1A2E',
  background_color: '#1A1A2E',
  display: 'standalone' as const,
  orientation: 'any' as const,
  start_url: '/',
  categories: ['productivity', 'business'],
} as const
