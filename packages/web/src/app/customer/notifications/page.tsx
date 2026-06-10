'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import {
  Bell, Package, CheckCircle2, MapPin, CreditCard, ShieldCheck,
  ShieldAlert, MessageSquare, AlertTriangle, Info, CheckCheck,
} from 'lucide-react';

const TYPE_META: Record<string, { icon: any; color: string; label: string }> = {
  ORDER_REQUEST:      { icon: Package,       color: 'bg-blue-100 text-blue-600',     label: 'Order' },
  ORDER_ACCEPTED:     { icon: CheckCircle2,  color: 'bg-green-100 text-green-600',   label: 'Order' },
  RIDER_ARRIVED:      { icon: MapPin,        color: 'bg-indigo-100 text-indigo-600', label: 'Arrival' },
  DELIVERY_COMPLETED: { icon: CheckCheck,    color: 'bg-green-100 text-green-600',   label: 'Delivery' },
  PAYMENT_CONFIRMED:  { icon: CreditCard,    color: 'bg-emerald-100 text-emerald-600', label: 'Payment' },
  ACCOUNT_APPROVED:   { icon: ShieldCheck,   color: 'bg-green-100 text-green-600',   label: 'Account' },
  ACCOUNT_SUSPENDED:  { icon: ShieldAlert,   color: 'bg-red-100 text-red-600',       label: 'Account' },
  NEW_MESSAGE:        { icon: MessageSquare, color: 'bg-purple-100 text-purple-600', label: 'Message' },
  SOS_ALERT:          { icon: AlertTriangle, color: 'bg-red-100 text-red-600',       label: 'Emergency' },
  SYSTEM:             { icon: Info,          color: 'bg-gray-100 text-gray-600',     label: 'System' },
};

const FILTERS = ['ALL', 'UNREAD', 'ORDERS', 'PAYMENTS', 'SYSTEM'];

const FILTER_TYPES: Record<string, string[]> = {
  ORDERS:   ['ORDER_REQUEST', 'ORDER_ACCEPTED', 'RIDER_ARRIVED', 'DELIVERY_COMPLETED', 'NEW_MESSAGE'],
  PAYMENTS: ['PAYMENT_CONFIRMED'],
  SYSTEM:   ['SYSTEM', 'ACCOUNT_APPROVED', 'ACCOUNT_SUSPENDED', 'SOS_ALERT'],
};

export default function CustomerNotificationsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState('ALL');

  const { data, isLoading } = useQuery<{ data: { notifications: any[]; unreadCount: number } }>({
    queryKey: ['customer-notifications'],
    queryFn: () => api.get('/users/me/notifications?limit=50'),
    refetchInterval: 30_000,
  });

  const notifications = data?.data?.notifications ?? [];
  const unreadCount = data?.data?.unreadCount ?? 0;

  const markReadMutation = useMutation({
    mutationFn: (ids?: string[]) => api.patch('/users/me/notifications/read', ids ? { ids } : {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customer-notifications'] });
    },
  });

  const filtered = notifications.filter((n) => {
    if (filter === 'ALL') return true;
    if (filter === 'UNREAD') return !n.isRead;
    return FILTER_TYPES[filter]?.includes(n.type);
  });

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Notifications</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : 'You’re all caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markReadMutation.mutate(undefined)}
            disabled={markReadMutation.isPending}
            className="text-xs font-semibold text-brand-green-600 hover:text-brand-green-700 flex items-center gap-1.5 disabled:opacity-60"
          >
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filter === f ? 'bg-brand-green-500 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card rounded-2xl border p-4 animate-pulse space-y-2">
              <div className="h-4 bg-muted rounded w-1/2" />
              <div className="h-3 bg-muted rounded w-3/4" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Bell size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No notifications</p>
            <p className="text-sm">You'll see updates about your deliveries here</p>
          </div>
        ) : (
          filtered.map((n) => {
            const meta = TYPE_META[n.type] ?? TYPE_META.SYSTEM;
            const Icon = meta.icon;
            return (
              <div
                key={n.id}
                onClick={() => !n.isRead && markReadMutation.mutate([n.id])}
                className={`bg-card border rounded-2xl p-4 shadow-sm flex gap-3 cursor-pointer transition-colors ${
                  !n.isRead ? 'border-brand-green-300 bg-brand-green-50/40' : ''
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.color}`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm truncate">{n.title}</p>
                    {!n.isRead && <span className="w-2 h-2 rounded-full bg-brand-green-500 flex-shrink-0" />}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{n.body}</p>
                  <p className="text-xs text-muted-foreground/70 mt-1.5">{formatDateTime(n.createdAt)}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
