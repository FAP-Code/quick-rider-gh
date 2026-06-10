'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Wallet, ArrowUpRight, CreditCard, Smartphone, Banknote } from 'lucide-react';

const PAYMENT_LABELS: Record<string, string> = {
  CASH: 'Cash',
  MTN_MOMO: 'MTN MoMo',
  TELECEL_CASH: 'Telecel Cash',
  AIRTELTIGO_MONEY: 'AirtelTigo Money',
  VISA: 'Visa Card',
  MASTERCARD: 'Mastercard',
};

const PAYMENT_ICONS: Record<string, any> = {
  CASH: Banknote,
  MTN_MOMO: Smartphone,
  TELECEL_CASH: Smartphone,
  AIRTELTIGO_MONEY: Smartphone,
  VISA: CreditCard,
  MASTERCARD: CreditCard,
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  PENDING:    'bg-yellow-100 text-yellow-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  COMPLETED:  'bg-green-100 text-green-700',
  FAILED:     'bg-red-100 text-red-700',
  REFUNDED:   'bg-gray-100 text-gray-700',
};

const FILTERS = ['ALL', 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED'];

export default function CustomerWalletPage() {
  const [filter, setFilter] = useState('ALL');

  const { data: ordersData, isLoading } = useQuery<{ data: any[]; meta: any }>({
    queryKey: ['my-orders-wallet'],
    queryFn: () => api.get('/orders?limit=50'),
  });

  const orders = ordersData?.data ?? [];
  const completedOrders = orders.filter((o: any) => ['DELIVERED', 'COMPLETED'].includes(o.status));
  const totalSpent = completedOrders.reduce((s: number, o: any) => s + parseFloat(o.totalAmount ?? 0), 0);

  // Most-used payment method
  const methodCounts: Record<string, number> = {};
  for (const o of orders) {
    methodCounts[o.paymentMethod] = (methodCounts[o.paymentMethod] ?? 0) + 1;
  }
  const topMethod = Object.entries(methodCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  const transactions = orders.filter((o: any) =>
    filter === 'ALL' ? true : o.paymentStatus === filter
  );

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold">Payments</h2>
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
          <p className="text-xs opacity-75 mt-1">{completedOrders.length} deliveries completed</p>
        </div>
        <div className="bg-card border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-muted-foreground">Most Used</p>
            <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
              <CreditCard size={18} className="text-muted-foreground" />
            </div>
          </div>
          <p className="text-lg font-bold">{topMethod ? PAYMENT_LABELS[topMethod] ?? topMethod : '—'}</p>
          <p className="text-xs text-muted-foreground mt-1">Default for new requests</p>
        </div>
      </div>

      {/* Payment methods */}
      <div className="bg-card rounded-2xl border shadow-sm p-5 space-y-3">
        <h3 className="font-semibold text-sm">Accepted Payment Methods</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Object.entries(PAYMENT_LABELS).map(([key, label]) => {
            const Icon = PAYMENT_ICONS[key];
            return (
              <div key={key} className="flex items-center gap-2 p-3 rounded-xl border text-sm font-medium">
                <Icon size={16} className="text-brand-green-500 flex-shrink-0" />
                {label}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          Select your preferred payment method when requesting a delivery. Mobile Money and Card payments are processed securely at checkout.
        </p>
      </div>

      {/* Transaction history */}
      <div className="bg-card rounded-2xl border shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">Payment History</h3>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${filter === f ? 'bg-brand-green-500 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
              {f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 bg-muted rounded-xl animate-pulse mb-2" />
          ))
        ) : transactions.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <Wallet size={36} className="mx-auto mb-2 opacity-30" />
            <p>No payments found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((o: any) => {
              const Icon = PAYMENT_ICONS[o.paymentMethod] ?? CreditCard;
              return (
                <Link key={o.id} href={`/customer/track?id=${o.id}`}
                  className="flex items-center justify-between py-2 border-b last:border-0 hover:bg-muted/40 -mx-2 px-2 rounded-lg transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <ArrowUpRight size={16} className="text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">Delivery · #{o.orderNumber?.slice(-6)}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Icon size={11} /> {PAYMENT_LABELS[o.paymentMethod] ?? o.paymentMethod} · {formatDate(o.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-sm">{formatCurrency(o.totalAmount)}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${PAYMENT_STATUS_COLORS[o.paymentStatus] ?? 'bg-gray-100 text-gray-600'}`}>
                      {o.paymentStatus}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
