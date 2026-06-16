import { type ReactNode, useState } from 'react'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { TopBar } from './TopBar'
import { OfflineBanner } from '../feedback/OfflineBanner'
import { useLocation } from 'react-router-dom'
import { Drawer } from '../ui/Drawer'

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/customers': 'Customers',
  '/patterns': 'Pattern Projects',
  '/patterns/new': 'New Pattern',
  '/measurements': 'Measurements',
  '/settings': 'Settings',
}

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps): JSX.Element {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const location = useLocation()

  const title =
    PAGE_TITLES[location.pathname] ??
    (location.pathname.startsWith('/customers/')
      ? 'Customer Detail'
      : location.pathname.startsWith('/patterns/')
        ? 'Pattern Detail'
        : 'TailorPattern AI')

  return (
    <div className="min-h-screen bg-surface-subtle">
      <OfflineBanner />

      {/* Desktop sidebar */}
      <Sidebar />

      {/* Mobile drawer (same sidebar content) */}
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} side="bottom" className="lg:hidden">
        <p className="text-center text-sm text-text-muted">Navigation</p>
      </Drawer>

      {/* Mobile top bar */}
      <div className="lg:hidden">
        <TopBar title={title} onMenuClick={() => setDrawerOpen(true)} />
      </div>

      {/* Main content */}
      <main
        className="lg:pl-[260px] pt-14 lg:pt-0 pb-20 lg:pb-0 min-h-screen"
      >
        <div className="max-w-5xl mx-auto px-4 py-6">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  )
}
