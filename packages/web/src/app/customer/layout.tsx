'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth-store';
import { Home, Package, Wallet, User, LogOut, Bell } from 'lucide-react';

const NAV = [
  { href: '/customer',         label: 'Home',    icon: Home    },
  { href: '/customer/orders',  label: 'Orders',  icon: Package },
  { href: '/customer/wallet',  label: 'Wallet',  icon: Wallet  },
  { href: '/customer/profile', label: 'Profile', icon: User    },
];

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, clearAuth } = useAuthStore();

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
            {NAV.find(n => n.href === pathname || (n.href !== '/customer' && pathname.startsWith(n.href)))?.label ?? 'Home'}
          </p>
          <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
            <Bell size={18} className="text-muted-foreground" />
          </button>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
