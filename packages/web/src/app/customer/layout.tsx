'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { Home, Package, Wallet, User, LogOut, Bell, PlusCircle, MapPin, Bike, Settings } from 'lucide-react';

const NAV = [
  { href: '/customer',          label: 'Home',      icon: Home       },
  { href: '/customer/request',  label: 'Request',   icon: PlusCircle },
  { href: '/customer/orders',   label: 'Orders',    icon: Package    },
  { href: '/customer/riders',   label: 'Riders',    icon: Bike       },
  { href: '/customer/addresses',label: 'Addresses', icon: MapPin     },
  { href: '/customer/wallet',   label: 'Payments',  icon: Wallet     },
  { href: '/customer/profile',  label: 'Profile',   icon: User       },
  { href: '/customer/settings', label: 'Settings',  icon: Settings   },
];

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, clearAuth } = useAuthStore();

  const { data: notifData } = useQuery<{ data: { unreadCount: number } }>({
    queryKey: ['customer-unread-notifications'],
    queryFn: () => api.get('/users/me/notifications?limit=1'),
    enabled: isAuthenticated && user?.role === 'CUSTOMER',
    refetchInterval: 30_000,
  });
  const unreadCount = notifData?.data?.unreadCount ?? 0;

  useEffect(() => {
    if (!isAuthenticated) { router.replace('/auth/login'); return; }
    if (user?.role !== 'CUSTOMER') { router.replace('/auth/login'); }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || user?.role !== 'CUSTOMER') return null;

  function signOut() { clearAuth(); localStorage.clear(); router.replace('/auth/login'); }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-brand-green-600 flex flex-col text-white flex-shrink-0">
        <div className="p-5 border-b border-brand-green-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-gold flex items-center justify-center text-xl">🏍️</div>
            <div>
              <p className="font-bold text-sm">Quick Rider GH</p>
              <p className="text-xs text-green-200">Customer Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/customer' && pathname.startsWith(href));
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${active ? 'bg-white/20 text-white' : 'text-green-100 hover:bg-white/10 hover:text-white'}`}>
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-brand-green-500 space-y-1">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-brand-gold flex items-center justify-center text-brand-green-800 font-bold text-xs">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-green-200 truncate">{user.email}</p>
            </div>
          </div>
          <button onClick={signOut} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-green-100 hover:bg-white/10 transition-colors">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-card border-b flex items-center justify-between px-6 flex-shrink-0">
          <p className="font-semibold text-sm text-foreground">
            {pathname.startsWith('/customer/notifications')
              ? 'Notifications'
              : NAV.find(n => n.href === pathname || (n.href !== '/customer' && pathname.startsWith(n.href)))?.label ?? 'Home'}
          </p>
          <Link href="/customer/notifications" className="relative p-2 rounded-lg hover:bg-muted transition-colors">
            <Bell size={18} className="text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
            )}
          </Link>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
