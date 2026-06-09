'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDateTime, formatCurrency, ORDER_STATUS_COLORS } from '@/lib/utils';
import { Search, MapPin } from 'lucide-react';

interface Order {
  id: string;
  orderNumber: string;
  type: string;
  status: string;
  totalAmount: number;
  paymentMethod: string;
  pickupAddress: string;
  destinationAddress: string;
  distanceKm: number;
  createdAt: string;
  customer: { id: string; firstName: string; lastName: string; phone: string };
  rider?: { user: { id: string; firstName: string; lastName: string } } | null;
}

interface OrdersResponse {
  data: Order[];
  meta: { total: number; page: number; totalPages: number };
}

const ORDER_TYPES: Record<string, string> = {
  PARCEL_DELIVERY: 'Parcel',
  FOOD_PICKUP: 'Food',
  SHOPPING_ASSISTANCE: 'Shopping',
  DOCUMENT_DELIVERY: 'Document',
  PERSONAL_ERRAND: 'Errand',
};

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<OrdersResponse>({
    queryKey: ['orders', statusFilter, page],
    queryFn: () =>
      api.get(
        `/admin/orders?page=${page}&limit=20${statusFilter ? `&status=${statusFilter}` : ''}`
      ),
    refetchInterval: 15_000,
  });

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h2>Orders</h2>
          <p className="text-sm text-muted-foreground mt-1">{data?.meta.total ?? 0} total orders</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Live updates
        </div>
      </div>

      {/* Status pills */}
      <div className="flex flex-wrap gap-2">
        {['', 'PENDING', 'ACCEPTED', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED', 'CANCELLED'].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              statusFilter === s
                ? 'bg-brand-green-500 text-white'
                : 'bg-card border hover:bg-muted text-muted-foreground'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Order #</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Customer</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Rider</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Route</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Amount</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading
                ? Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-muted rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : data?.data.map((order) => (
                    <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-medium text-brand-green-600">
                        #{order.orderNumber.slice(-8).toUpperCase()}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-muted rounded-md text-xs">
                          {ORDER_TYPES[order.type] || order.type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{order.customer.firstName} {order.customer.lastName}</p>
                        <p className="text-xs text-muted-foreground">{order.customer.phone}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {order.rider
                          ? `${order.rider.user.firstName} ${order.rider.user.lastName}`
                          : <span className="text-yellow-600 text-xs">Unassigned</span>}
                      </td>
                      <td className="px-4 py-3 max-w-48">
                        <div className="flex items-start gap-1.5">
                          <MapPin size={12} className="text-green-600 mt-0.5 flex-shrink-0" />
                          <div className="text-xs">
                            <p className="truncate">{order.pickupAddress}</p>
                            <p className="truncate text-muted-foreground">{order.destinationAddress}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium">{formatCurrency(order.totalAmount)}</td>
                      <td className="px-4 py-3">
                        <span className={`status-badge ${ORDER_STATUS_COLORS[order.status]}`}>
                          {order.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{formatDateTime(order.createdAt)}</td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {data && data.meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-muted-foreground">
              Page {data.meta.page} of {data.meta.totalPages} · {data.meta.total} total
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-muted transition-colors"
              >
                Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.meta.totalPages, p + 1))}
                disabled={page === data.meta.totalPages}
                className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-muted transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
