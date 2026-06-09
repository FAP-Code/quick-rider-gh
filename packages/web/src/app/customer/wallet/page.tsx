'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Wallet, ArrowUpRight, ArrowDownLeft, CreditCard } from 'lucide-react';

export default function CustomerWalletPage() {
  const { data: ordersData } = useQuery<{ data: any[]; meta: any }>({
    queryKey: ['my-orders-wallet'],
    queryFn: () => api.get('/orders?limit=20&status=DELIVERED'),
  });

  const delivered = ordersData?.data ?? [];
  const totalSpent = delivered.reduce((s: number, o: any) => s + parseFloat(o.fare ?? 0), 0);

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold">Wallet</h2>
        <p className="text-muted-foreground text-sm mt-1">Your payment history and spending</p>
      </div>

      {/* Spend summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-brand-green-500 text-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium opacity-90">Total Spent</p>
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Wallet size={18} />
            </div>
          </div>
          <p className="text-3xl font-bold">{formatCurrency(totalSpent)}</p>
          <p className="text-xs opacity-75 mt-1">{delivered.length} deliveries completed</p>
        </div>
        <div className="bg-card border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-muted-foreground">Payment Method</p>
            <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
              <CreditCard size={18} className="text-muted-foreground" />
            </div>
          </div>
          <p className="text-lg font-bold">Mobile Money</p>
          <p className="text-xs text-muted-foreground mt-1">MTN · Vodafone · AirtelTigo</p>
        </div>
      </div>

      {/* Transaction history */}
      <div className="bg-card rounded-2xl border shadow-sm p-5">
        <h3 className="font-semibold text-sm mb-4">Payment History</h3>
        {delivered.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <Wallet size={36} className="mx-auto mb-2 opacity-30" />
            <p>No payments yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {delivered.map((o: any) => (
              <div key={o.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
                    <ArrowUpRight size={16} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Delivery · #{o.orderNumber?.slice(-6)}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(o.createdAt)}</p>
                  </div>
                </div>
                <span className="font-bold text-sm">{formatCurrency(o.fare)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
