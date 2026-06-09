'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) { router.replace('/auth/login'); return; }
    if (user?.role !== 'ADMIN') {
      const dest: Record<string, string> = { CUSTOMER: '/customer', RIDER: '/rider' };
      router.replace(dest[user?.role ?? ''] ?? '/auth/login');
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || user?.role !== 'ADMIN') return null;

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64 min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
