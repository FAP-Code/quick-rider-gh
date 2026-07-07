import { type ReactNode, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { TopBar } from './TopBar'
import { OfflineBanner } from '../feedback/OfflineBanner'
import { useLocation } from 'react-router-dom'
import { PLATFORM_MODULES } from '../../../app/modules'
import { cn } from '../../utils/cn'

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/customers': 'Customers',
  '/patterns': 'Pattern Projects',
  '/patterns/new': 'New Pattern',
  '/measurements': 'Measurements',
  '/sketch': 'Sketch Pad',
  '/settings': 'Settings',
}

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps): JSX.Element {
  const [navOpen, setNavOpen] = useState(false)
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

      {/* Mobile left-side navigation overlay */}
      <AnimatePresence>
        {navOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <motion.div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setNavOpen(false)}
            />
            <motion.aside
              className="relative z-10 flex flex-col w-[270px] h-full bg-brand-navy text-white overflow-y-auto"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              {/* Brand header */}
              <div className="flex items-center justify-between px-5 py-5 border-b border-white/10 flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-brand-gold flex items-center justify-center flex-shrink-0">
                    <svg viewBox="0 0 20 20" className="w-3.5 h-3.5" fill="none">
                      <path d="M4 5 L10 3 L16 5 L16 11 Q16 17 10 19 Q4 17 4 11 Z" stroke="white" strokeWidth="1.5" />
                      <path d="M7 10 L9 12 L13 8" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold leading-none">TailorPattern AI</p>
                    <p className="text-[10px] text-white/50 mt-0.5">The Tailor's Friend™</p>
                  </div>
                </div>
                <button
                  onClick={() => setNavOpen(false)}
                  className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Close navigation"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Active module nav */}
              <nav className="flex-1 py-3">
                <div className="px-3 space-y-0.5">
                  {PLATFORM_MODULES.filter(m => m.status === 'active').map(mod => (
                    <NavLink
                      key={mod.id}
                      to={mod.path}
                      end={mod.path === '/'}
                      onClick={() => setNavOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                          isActive
                            ? 'bg-white/15 text-white'
                            : 'text-white/70 hover:bg-white/8 hover:text-white',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <mod.Icon size={17} strokeWidth={isActive ? 2.5 : 1.75} />
                          <span>{mod.label}</span>
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </nav>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile top bar */}
      <div className="lg:hidden">
        <TopBar title={title} onMenuClick={() => setNavOpen(true)} />
      </div>

      {/* Main content */}
      <main className="lg:pl-[260px] pt-14 lg:pt-0 pb-20 lg:pb-0 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 py-6">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  )
}
