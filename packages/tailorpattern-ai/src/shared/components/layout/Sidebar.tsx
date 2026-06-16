import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Ruler,
  Scissors,
  Wand2,
  Settings,
  Lock,
  ShoppingBag,
  DollarSign,
  Package,
  Factory,
  UserCheck,
  Store,
  GraduationCap,
  Bot,
  Download,
} from 'lucide-react'
import { cn } from '../../utils/cn'
import { Badge } from '../ui/Badge'
import { SyncIndicator } from '../feedback/SyncIndicator'
import { usePWAInstall } from '../../hooks/usePWAInstall'
import { PLATFORM_MODULES } from '../../../app/modules'

const ACTIVE_ICONS: Record<string, typeof LayoutDashboard> = {
  dashboard: LayoutDashboard,
  customers: Users,
  measurements: Ruler,
  patterns: Scissors,
  generator: Wand2,
  settings: Settings,
  orders: ShoppingBag,
  finance: DollarSign,
  inventory: Package,
  production: Factory,
  employees: UserCheck,
  marketplace: Store,
  academy: GraduationCap,
  'ai-assistant': Bot,
}

export function Sidebar(): JSX.Element {
  const { isInstallable, isInstalled, install } = usePWAInstall()

  return (
    <aside className="hidden lg:flex flex-col w-[260px] bg-brand-navy text-white h-screen fixed left-0 top-0 z-30">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-gold flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none">
              <path d="M4 5 L10 3 L16 5 L16 11 Q16 17 10 19 Q4 17 4 11 Z" stroke="white" strokeWidth="1.5" />
              <path d="M7 10 L9 12 L13 8" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold leading-none">TailorPattern AI</p>
            <p className="text-[10px] text-white/50 mt-0.5">The Tailor’s Friend™</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 scrollbar-hide">
        <div className="px-3 space-y-0.5">
          {PLATFORM_MODULES.map(mod => {
            const Icon = ACTIVE_ICONS[mod.id] ?? Settings
            const isActive = mod.status === 'active'

            if (!isActive) {
              return (
                <div
                  key={mod.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/30 cursor-not-allowed"
                >
                  <Lock size={16} />
                  <span className="text-sm flex-1">{mod.label}</span>
                  <Badge variant="default" size="sm" className="bg-white/10 text-white/40 border-white/10">
                    Ph {mod.phase}
                  </Badge>
                </div>
              )
            }

            return (
              <NavLink
                key={mod.id}
                to={mod.path}
                end={mod.path === '/'}
                className={({ isActive: active }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                    active
                      ? 'bg-white/15 text-white'
                      : 'text-white/70 hover:bg-white/8 hover:text-white',
                  )
                }
              >
                <Icon size={17} />
                <span>{mod.label}</span>
              </NavLink>
            )
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/10 space-y-2">
        <SyncIndicator />
        {isInstallable && !isInstalled && (
          <button
            onClick={() => void install()}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-medium text-brand-gold hover:bg-white/8 transition-colors"
          >
            <Download size={14} />
            Install TailorPattern AI
          </button>
        )}
      </div>
    </aside>
  )
}
