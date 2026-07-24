'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth-store';
import { Home, Package, User, LogOut, Bike } from 'lucide-react';

const NAV = [
  { href: '/merchant',         label: 'Dashboard', icon: Home    },
  { href: '/merchant/orders',  label: 'Orders',    icon: Package },
  { href: '/merchant/profile', label: 'Profile',   icon: User    },
];

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, clearAuth } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) { router.replace('/auth/login'); return; }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  function signOut() { clearAuth(); localStorage.clear(); router.replace('/auth/login'); }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-green-800 flex flex-col text-white flex-shrink-0">
        <div className="p-5 border-b border-green-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-gold flex items-center justify-center text-xl">🏍️</div>
            <div>
              <p className="font-bold text-sm">Quick Rider GH</p>
              <p className="text-xs text-green-200">Merchant Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/merchant' && pathname.startsWith(href));
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${active ? 'bg-white/20 text-white' : 'text-green-100 hover:bg-white/10 hover:text-white'}`}>
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-green-700 space-y-1">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-brand-gold flex items-center justify-center text-green-800 font-bold text-xs">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-green-200 truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={signOut} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-green-100 hover:bg-white/10 transition-colors">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-card border-b flex items-center px-6 flex-shrink-0">
          <Bike size={18} className="text-green-700 mr-2" />
          <p className="font-semibold text-sm text-foreground">
            {NAV.find(n => n.href === pathname || (n.href !== '/merchant' && pathname.startsWith(n.href)))?.label ?? 'Merchant Portal'}
          </p>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
