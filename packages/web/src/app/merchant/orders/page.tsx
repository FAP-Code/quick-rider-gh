'use client';
import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency, formatDate, ORDER_STATUS_COLORS } from '@/lib/utils';
import { ShoppingBag } from 'lucide-react';

const FILTERS = ['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED'] as const;
type Filter = typeof FILTERS[number];

function maskName(name: string): string {
  if (!name) return '—';
  const parts = name.split(' ');
  return parts.map((p, i) => i === 0 ? `${p[0]}***` : `${p[0] ?? ''}***`).join(' ');
}

export default function MerchantOrdersPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>('ALL');

  const { data, isLoading } = useQuery<{ data: any[]; meta: any }>({
    queryKey: ['merchant-orders', filter],
    queryFn: () => api.get(`/merchant/orders?limit=50${filter !== 'ALL' ? `&status=${filter}` : ''}`),
    refetchInterval: 20_000,
  });

  const readyMutation = useMutation({
    mutationFn: (orderId: string) => api.patch(`/orders/${orderId}/merchant-ready`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['merchant-orders'] }),
  });

  const orders = data?.data ?? [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold">Orders</h2>
        <p className="text-muted-foreground text-sm mt-1">{data?.meta?.total ?? orders.length} total orders · auto-refreshes every 20s</p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${filter === f ? 'bg-brand-green-500 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
            {f.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="bg-muted/50 text-xs text-muted-foreground">
                <th className="text-left px-4 py-3 font-medium">Order</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">Customer</th>
                <th className="text-left px-4 py-3 font-medium">Pickup</th>
                <th className="text-left px-4 py-3 font-medium">Destination</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Amount</th>
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-t animate-pulse">
                      <td className="px-4 py-3"><div className="h-4 bg-muted rounded w-20" /></td>
                      <td className="px-4 py-3"><div className="h-4 bg-muted rounded w-24" /></td>
                      <td className="px-4 py-3"><div className="h-4 bg-muted rounded w-16" /></td>
                      <td className="px-4 py-3"><div className="h-4 bg-muted rounded w-32" /></td>
                      <td className="px-4 py-3"><div className="h-4 bg-muted rounded w-32" /></td>
                      <td className="px-4 py-3"><div className="h-4 bg-muted rounded w-20" /></td>
                      <td className="px-4 py-3"><div className="h-4 bg-muted rounded w-16 ml-auto" /></td>
                      <td className="px-4 py-3"><div className="h-4 bg-muted rounded w-20" /></td>
                      <td className="px-4 py-3" />
                    </tr>
                  ))
                : orders.length === 0
                ? (
                    <tr>
                      <td colSpan={9} className="text-center py-16 text-muted-foreground">
                        <ShoppingBag size={36} className="mx-auto mb-2 opacity-30" />
                        <p>No orders found</p>
                      </td>
                    </tr>
                  )
                : orders.map((o: any) => {
                    const customerName = `${o.customer?.user?.firstName ?? ''} ${o.customer?.user?.lastName ?? ''}`.trim();
                    const canMarkReady = o.status === 'PENDING';
                    return (
                      <tr key={o.id} className="border-t hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">#{o.orderNumber?.slice(-8)}</td>
                        <td className="px-4 py-3 font-medium">{o.type?.replace(/_/g, ' ')}</td>
                        <td className="px-4 py-3 text-muted-foreground">{maskName(customerName)}</td>
                        <td className="px-4 py-3 text-muted-foreground max-w-[160px] truncate">{o.pickupAddress}</td>
                        <td className="px-4 py-3 text-muted-foreground max-w-[160px] truncate">{o.destinationAddress}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${ORDER_STATUS_COLORS[o.status] ?? 'bg-gray-100 text-gray-600'}`}>
                            {o.status?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold">{formatCurrency(o.totalAmount)}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">{formatDate(o.createdAt)}</td>
                        <td className="px-4 py-3">
                          {canMarkReady && (
                            <button
                              onClick={() => readyMutation.mutate(o.id)}
                              disabled={readyMutation.isPending}
                              className="px-3 py-1.5 bg-brand-green-500 text-white text-xs font-semibold rounded-lg hover:bg-brand-green-600 disabled:opacity-60 transition-colors whitespace-nowrap"
                            >
                              Mark Ready
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
