'use client';
import { usePathname } from 'next/navigation';
import { Search, Bell } from 'lucide-react';

const pageTitles: Record<string, string> = {
  '/dashboard':   'Dashboard',
  '/orders':      'Orders',
  '/riders':      'Riders',
  '/customers':   'Customers',
  '/analytics':   'Analytics',
  '/withdrawals': 'Withdrawals',
  '/reports':     'Reports',
  '/settings':    'Settings',
};

export function Header() {
  const pathname = usePathname();
  const title = Object.entries(pageTitles).find(([k]) => pathname.startsWith(k))?.[1] ?? 'Quick Rider GH';

  return (
    <header className="h-16 bg-white border-b border-border flex items-center justify-between px-6 sticky top-0 z-20">
      <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
          <input
            placeholder="Search…"
            className="pl-9 pr-4 py-2 text-sm bg-muted rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-primary/20 w-56 transition"
          />
        </div>
        <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
          <Bell size={18} className="text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
      </div>
    </header>
  );
}
