'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth-store';
import { LayoutDashboard, Briefcase, DollarSign, User, LogOut, Bell, Star, Settings, ShieldAlert } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

const NAV = [
  { href: '/rider',              label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/rider/jobs',         label: 'My Jobs',       icon: Briefcase       },
  { href: '/rider/earnings',     label: 'Earnings',      icon: DollarSign      },
  { href: '/rider/ratings',      label: 'Ratings',       icon: Star            },
  { href: '/rider/notifications',label: 'Notifications', icon: Bell            },
  { href: '/rider/profile',      label: 'Profile',       icon: User            },
  { href: '/rider/settings',     label: 'Settings',      icon: Settings        },
  { href: '/rider/sos',          label: 'SOS',           icon: ShieldAlert     },
];

export default function RiderLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, clearAuth } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) { router.replace('/auth/login'); return; }
    if (user?.role !== 'RIDER') { router.replace('/auth/login'); }
  }, [isAuthenticated, user, router]);

  const { data: notifData } = useQuery<{ data: { unreadCount: number } }>({
    queryKey: ['rider-unread-notifications'],
    queryFn: () => api.get('/users/me/notifications?limit=1'),
    enabled: isAuthenticated && user?.role === 'RIDER',
    refetchInterval: 30_000,
  });
  const unreadCount = notifData?.data?.unreadCount ?? 0;

  if (!isAuthenticated || user?.role !== 'RIDER') return null;

  function signOut() { clearAuth(); localStorage.clear(); router.replace('/auth/login'); }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 flex flex-col text-white flex-shrink-0">
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-gold flex items-center justify-center text-xl">🏍️</div>
            <div>
              <p className="font-bold text-sm">Quick Rider GH</p>
              <p className="text-xs text-gray-400">Rider Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/rider' && pathname.startsWith(href));
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${active ? 'bg-brand-gold text-gray-900' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}>
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-800 space-y-1">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-brand-gold flex items-center justify-center text-gray-900 font-bold text-xs">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
          <button onClick={signOut} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-gray-300 hover:bg-gray-800 transition-colors">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-card border-b flex items-center justify-between px-6 flex-shrink-0">
          <p className="font-semibold text-sm text-foreground">
            {NAV.find(n => n.href === pathname || (n.href !== '/rider' && pathname.startsWith(n.href)))?.label ?? 'Dashboard'}
          </p>
          <Link href="/rider/notifications" className="relative p-2 rounded-lg hover:bg-muted transition-colors">
            <Bell size={18} className="text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-4 h-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
