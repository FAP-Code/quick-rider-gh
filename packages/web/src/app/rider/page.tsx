'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { useAuthStore } from '@/lib/auth-store';
import { MapPin, Navigation, Package, Star, DollarSign, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function RiderDashboard() {
  const user = useAuthStore(s => s.user);
  const qc   = useQueryClient();
  const [togglingOnline, setTogglingOnline] = useState(false);

  const { data: profileData, isLoading: profileLoading } = useQuery<{ data: any }>({
    queryKey: ['rider-profile'],
    queryFn: () => api.get('/riders/me'),
  });
  const profile = profileData?.data ?? profileData;

  const { data: ordersData } = useQuery<{ data: any[] }>({
    queryKey: ['rider-active-orders'],
    queryFn: () => api.get('/orders?limit=5'),
    refetchInterval: 15_000,
  });
  const orders = ordersData?.data ?? [];

  const availMutation = useMutation({
    mutationFn: (status: string) => api.patch('/riders/me/availability', { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rider-profile'] }),
  });

  const acceptMutation = useMutation({
    mutationFn: (orderId: string) => api.patch(`/orders/${orderId}/accept`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rider-active-orders'] }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      api.patch(`/orders/${orderId}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rider-active-orders'] }),
  });

  const isOnline = profile?.availabilityStatus === 'ONLINE';

  const STATUS_COLOR: Record<string, string> = {
    PENDING:   'bg-yellow-100 text-yellow-700',
    ACCEPTED:  'bg-blue-100 text-blue-700',
    PICKED_UP: 'bg-indigo-100 text-indigo-700',
    DELIVERED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
  };

  const NEXT_STATUS: Record<string, string> = {
    ACCEPTED:  'PICKED_UP',
    PICKED_UP: 'DELIVERED',
  };

  const NEXT_LABEL: Record<string, string> = {
    ACCEPTED:  'Mark Picked Up',
    PICKED_UP: 'Mark Delivered',
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Greeting + Online toggle */}
      <div className="bg-gray-900 text-white rounded-2xl p-6 flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">Welcome back,</p>
          <h2 className="text-2xl font-bold mt-0.5">{user?.firstName} {user?.lastName}</h2>
          <div className={`inline-flex items-center gap-1.5 mt-2 text-xs font-semibold px-2.5 py-1 rounded-full ${isOnline ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-400' : 'bg-gray-500'}`} />
            {profile?.availabilityStatus ?? '…'}
          </div>
        </div>
        <button
          onClick={() => availMutation.mutate(isOnline ? 'OFFLINE' : 'ONLINE')}
          disabled={availMutation.isPending || profileLoading}
          className={`relative w-16 h-8 rounded-full transition-colors duration-300 focus:outline-none disabled:opacity-60 ${isOnline ? 'bg-green-500' : 'bg-gray-600'}`}
        >
          <span className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all duration-300 ${isOnline ? 'left-9' : 'left-1'}`} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Today's Earnings", value: formatCurrency(0), icon: DollarSign, color: 'text-green-600 bg-green-100' },
          { label: 'Completed',        value: profile?.completedDeliveries ?? 0, icon: CheckCircle, color: 'text-blue-600 bg-blue-100' },
          { label: 'Rating',           value: `⭐ ${parseFloat(profile?.averageRating ?? 0).toFixed(1)}`, icon: Star, color: 'text-yellow-600 bg-yellow-100' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card border rounded-2xl p-4 shadow-sm">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${color}`}>
              <Icon size={18} />
            </div>
            <p className="text-xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Active / recent orders */}
      <div className="bg-card rounded-2xl border shadow-sm p-5">
        <h3 className="font-semibold text-sm mb-4">Active & Recent Jobs</h3>
        {orders.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <Package size={36} className="mx-auto mb-2 opacity-30" />
            <p className="font-medium">No jobs yet</p>
            <p className="text-sm">Go online to start receiving requests</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o: any) => (
              <div key={o.id} className="border rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-mono text-muted-foreground">#{o.orderNumber?.slice(-8)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_COLOR[o.status] ?? 'bg-gray-100 text-gray-600'}`}>{o.status}</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2"><MapPin size={13} className="text-brand-green-500 flex-shrink-0" /><span className="text-muted-foreground truncate">{o.pickupAddress}</span></div>
                  <div className="flex items-center gap-2"><Navigation size={13} className="text-red-500 flex-shrink-0" /><span className="text-muted-foreground truncate">{o.dropoffAddress}</span></div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">{formatCurrency(o.fare)}</span>
                  <div className="flex gap-2">
                    {o.status === 'PENDING' && (
                      <button onClick={() => acceptMutation.mutate(o.id)} disabled={acceptMutation.isPending}
                        className="px-3 py-1.5 bg-brand-green-500 text-white text-xs rounded-lg font-semibold hover:bg-brand-green-600 disabled:opacity-60 transition-colors">
                        Accept
                      </button>
                    )}
                    {NEXT_STATUS[o.status] && (
                      <button onClick={() => statusMutation.mutate({ orderId: o.id, status: NEXT_STATUS[o.status] })} disabled={statusMutation.isPending}
                        className="px-3 py-1.5 bg-blue-500 text-white text-xs rounded-lg font-semibold hover:bg-blue-600 disabled:opacity-60 transition-colors">
                        {NEXT_LABEL[o.status]}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
