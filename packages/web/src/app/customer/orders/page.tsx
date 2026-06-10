'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency, formatDate, ORDER_STATUS_COLORS } from '@/lib/utils';
import { Package, MapPin, Navigation, Clock, Star } from 'lucide-react';

const FILTERS = ['ALL', 'PENDING', 'ACCEPTED', 'RIDER_EN_ROUTE', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED', 'CANCELLED'];

export default function CustomerOrdersPage() {
  const [filter, setFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<{ data: any[]; meta: any }>({
    queryKey: ['my-orders', filter, page],
    queryFn: () => api.get(`/orders?page=${page}&limit=10${filter !== 'ALL' ? `&status=${filter}` : ''}`),
  });

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold">My Orders</h2>
        <p className="text-muted-foreground text-sm mt-1">{data?.meta?.total ?? 0} total orders</p>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(f => (
          <button key={f} onClick={() => { setFilter(f); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${filter === f ? 'bg-brand-green-500 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Orders list */}
      <div className="space-y-3">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card rounded-2xl border p-4 animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))
          : data?.data?.length === 0
          ? (
            <div className="text-center py-16 text-muted-foreground">
              <Package size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No orders yet</p>
              <p className="text-sm mt-1">Book your first rider from the Home page</p>
            </div>
          )
          : data?.data?.map((o: any) => (
              <Link key={o.id} href={`/customer/track?id=${o.id}`} className="block bg-card rounded-2xl border shadow-sm p-4 space-y-3 hover:border-brand-green-300 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-mono">#{o.orderNumber?.slice(-8)}</p>
                    <p className="font-semibold text-sm mt-0.5">{o.type?.replace(/_/g, ' ')}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${ORDER_STATUS_COLORS[o.status] ?? 'bg-gray-100 text-gray-600'}`}>{o.status?.replace(/_/g, ' ')}</span>
                </div>

                <div className="space-y-1.5 text-sm">
                  <div className="flex items-start gap-2">
                    <MapPin size={14} className="text-brand-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{o.pickupAddress}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Navigation size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{o.destinationAddress}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock size={12} />{formatDate(o.createdAt)}</span>
                  {o.rider && (
                    <span className="flex items-center gap-1"><Star size={12} className="text-brand-gold" />
                      {o.rider.user?.firstName} {o.rider.user?.lastName}
                    </span>
                  )}
                  <span className="font-bold text-foreground text-sm">{formatCurrency(o.totalAmount)}</span>
                </div>
              </Link>
            ))}
      </div>

      {/* Pagination */}
      {data && data.meta?.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {data.meta.page} of {data.meta.totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-muted transition-colors">Prev</button>
            <button onClick={() => setPage(p => Math.min(data.meta.totalPages, p + 1))} disabled={page === data.meta.totalPages} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-muted transition-colors">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
