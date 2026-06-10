'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { MapPin, Navigation, Clock, Briefcase } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  PENDING:   'bg-yellow-100 text-yellow-700',
  ACCEPTED:  'bg-blue-100 text-blue-700',
  PICKED_UP: 'bg-indigo-100 text-indigo-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const NEXT_STATUS: Record<string, string> = { ACCEPTED: 'PICKED_UP', PICKED_UP: 'DELIVERED' };
const NEXT_LABEL:  Record<string, string> = { ACCEPTED: 'Mark Picked Up', PICKED_UP: 'Mark Delivered' };

const FILTERS = ['ALL', 'PENDING', 'ACCEPTED', 'PICKED_UP', 'DELIVERED', 'CANCELLED'];

export default function RiderJobsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState('ALL');
  const [page, setPage]     = useState(1);

  const { data, isLoading } = useQuery<{ data: any[]; meta: any }>({
    queryKey: ['rider-jobs', filter, page],
    queryFn: () => api.get(`/orders?page=${page}&limit=10${filter !== 'ALL' ? `&status=${filter}` : ''}`),
    refetchInterval: 10_000,
  });

  const acceptMutation = useMutation({
    mutationFn: (orderId: string) => api.patch(`/orders/${orderId}/accept`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rider-jobs'] }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      api.patch(`/orders/${orderId}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rider-jobs'] }),
  });

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold">My Jobs</h2>
        <p className="text-muted-foreground text-sm mt-1">{data?.meta?.total ?? 0} total jobs</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map(f => (
          <button key={f} onClick={() => { setFilter(f); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${filter === f ? 'bg-gray-900 text-brand-gold' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card rounded-2xl border p-4 animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" /><div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))
          : data?.data?.length === 0
          ? (
            <div className="text-center py-16 text-muted-foreground">
              <Briefcase size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No jobs found</p>
            </div>
          )
          : data?.data?.map((o: any) => (
              <div key={o.id} className="bg-card border rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-mono text-muted-foreground">#{o.orderNumber?.slice(-8)}</p>
                    <p className="font-semibold text-sm mt-0.5">{o.type}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_COLORS[o.status] ?? 'bg-gray-100 text-gray-600'}`}>{o.status}</span>
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-start gap-2"><MapPin size={13} className="text-brand-green-500 mt-0.5 flex-shrink-0" /><span className="text-muted-foreground">{o.pickupAddress}</span></div>
                  <div className="flex items-start gap-2"><Navigation size={13} className="text-red-500 mt-0.5 flex-shrink-0" /><span className="text-muted-foreground">{o.destinationAddress}</span></div>
                </div>
                <div className="flex items-center justify-between pt-1 border-t">
                  <div>
                    <span className="font-bold text-sm">{formatCurrency(o.totalAmount)}</span>
                    <span className="text-xs text-muted-foreground ml-2 flex items-center gap-1 inline-flex"><Clock size={11} />{formatDate(o.createdAt)}</span>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/rider/jobs/details?id=${o.id}`}
                      className="px-3 py-1.5 border text-xs rounded-lg font-semibold hover:bg-muted transition-colors">Details</Link>
                    {o.status === 'PENDING' && (
                      <button onClick={() => acceptMutation.mutate(o.id)} disabled={acceptMutation.isPending}
                        className="px-3 py-1.5 bg-brand-green-500 text-white text-xs rounded-lg font-semibold hover:bg-brand-green-600 disabled:opacity-60 transition-colors">Accept</button>
                    )}
                    {NEXT_STATUS[o.status] && (
                      <button onClick={() => statusMutation.mutate({ orderId: o.id, status: NEXT_STATUS[o.status] })} disabled={statusMutation.isPending}
                        className="px-3 py-1.5 bg-blue-500 text-white text-xs rounded-lg font-semibold hover:bg-blue-600 disabled:opacity-60 transition-colors">{NEXT_LABEL[o.status]}</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
      </div>

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
