'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Bike,
  ShoppingBag,
  BarChart3,
  CreditCard,
  AlertTriangle,
  Settings,
  LogOut,
  Bell,
  ExternalLink,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { useRouter } from 'next/navigation';

const navItems = [
  { href: '/dashboard',              label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/dashboard/orders',       label: 'Orders',       icon: ShoppingBag },
  { href: '/dashboard/riders',       label: 'Riders',       icon: Bike },
  { href: '/dashboard/customers',    label: 'Customers',    icon: Users },
  { href: '/dashboard/analytics',    label: 'Analytics',    icon: BarChart3 },
  { href: '/dashboard/withdrawals',  label: 'Withdrawals',  icon: CreditCard },
  { href: '/dashboard/reports',      label: 'Reports',      icon: AlertTriangle },
  { href: '/dashboard/settings',     label: 'Settings',     icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();

  function handleLogout() {
    localStorage.clear();
    clearAuth();
    router.push('/auth/login');
  }

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-brand-green-700 flex flex-col z-30">
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-green-600/40">
        <div className="w-9 h-9 bg-brand-gold rounded-lg flex items-center justify-center flex-shrink-0 shadow">
          <span className="text-lg">🏍️</span>
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-tight">Quick Rider GH</p>
          <p className="text-green-300 text-xs">Admin Panel</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-white/15 text-white'
                  : 'text-green-200 hover:bg-white/10 hover:text-white'
              )}
            >
              <Icon size={18} strokeWidth={1.75} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Portal Previews */}
      <div className="border-t border-green-600/40 px-3 py-3 space-y-0.5">
        <p className="text-green-500 text-xs font-semibold uppercase tracking-wider px-3 mb-1">Preview Portals</p>
        <a href="/customer" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-green-200 hover:bg-white/10 hover:text-white text-sm transition-colors">
          <span className="flex items-center gap-3"><Users size={18} strokeWidth={1.75} />Customer App</span>
          <ExternalLink size={14} />
        </a>
        <a href="/rider" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-green-200 hover:bg-white/10 hover:text-white text-sm transition-colors">
          <span className="flex items-center gap-3"><Bike size={18} strokeWidth={1.75} />Rider App</span>
          <ExternalLink size={14} />
        </a>
      </div>

      {/* User */}
      <div className="border-t border-green-600/40 p-3 space-y-1">
        <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-green-200 hover:bg-white/10 hover:text-white text-sm transition-colors">
          <Bell size={18} strokeWidth={1.75} />
          Notifications
        </button>
        <div className="flex items-center gap-3 px-3 py-2 text-xs text-green-300">
          <div className="w-7 h-7 rounded-full bg-brand-gold flex items-center justify-center text-brand-green-700 font-bold text-xs flex-shrink-0">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-green-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-green-200 hover:bg-red-500/20 hover:text-red-300 text-sm transition-colors"
        >
          <LogOut size={18} strokeWidth={1.75} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
