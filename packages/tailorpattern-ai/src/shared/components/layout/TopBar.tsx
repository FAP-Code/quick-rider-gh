import { Menu, Bell } from 'lucide-react'
import { Avatar } from '../ui/Avatar'
import { useAuth } from '../../../features/auth/useAuth'

interface TopBarProps {
  title: string
  onMenuClick: () => void
}

export function TopBar({ title, onMenuClick }: TopBarProps): JSX.Element {
  const { business } = useAuth()

  return (
    <header className="flex items-center gap-3 h-14 px-4 bg-white border-b border-surface-muted flex-shrink-0">
      <button
        onClick={onMenuClick}
        className="p-2 -ml-2 rounded-xl text-text-muted hover:bg-surface-muted transition-colors"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-md bg-brand-navy flex items-center justify-center">
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none">
            <path d="M4 4 L8 3 L12 4 L12 8 Q12 12 8 14 Q4 12 4 8 Z" stroke="#C9A84C" strokeWidth="1" />
          </svg>
        </div>
        <span className="text-sm font-semibold text-text-primary">{title}</span>
      </div>
      <div className="flex-1" />
      <button className="p-2 rounded-xl text-text-muted hover:bg-surface-muted transition-colors" aria-label="Notifications">
        <Bell size={18} />
      </button>
      <Avatar name={business?.ownerName ?? 'User'} size="sm" />
    </header>
  )
}
