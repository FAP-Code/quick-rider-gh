import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, Scissors, Pencil, Settings } from 'lucide-react'
import { cn } from '../../utils/cn'

const PRIMARY_NAV = [
  { path: '/', label: 'Dashboard', Icon: LayoutDashboard, exact: true },
  { path: '/customers', label: 'Customers', Icon: Users, exact: false },
  { path: '/patterns', label: 'Patterns', Icon: Scissors, exact: false },
  { path: '/sketch', label: 'Sketch', Icon: Pencil, exact: false },
  { path: '/settings', label: 'Settings', Icon: Settings, exact: false },
]

export function BottomNav(): JSX.Element {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-surface-muted safe-bottom lg:hidden">
      <ul className="flex items-center h-16">
        {PRIMARY_NAV.map(({ path, label, Icon, exact }) => (
          <li key={path} className="flex-1">
            <NavLink
              to={path}
              end={exact}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center gap-0.5 h-full text-xs font-medium transition-colors',
                  isActive ? 'text-brand-navy' : 'text-text-muted hover:text-text-body',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.75} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
