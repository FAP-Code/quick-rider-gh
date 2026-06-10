'use client';
import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import {
  ArrowLeft, MapPin, Navigation, Phone, Package, Clock, CheckCircle2,
  Circle, XCircle,
} from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  PENDING:   'bg-yellow-100 text-yellow-700',
  ACCEPTED:  'bg-blue-100 text-blue-700',
  PICKED_UP: 'bg-indigo-100 text-indigo-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const NEXT_STATUS: Record<string, string> = { ACCEPTED: 'PICKED_UP', PICKED_UP: 'DELIVERED' };
const NEXT_LABEL:  Record<string, string> = { ACCEPTED: 'Mark Picked Up', PICKED_UP: 'Mark Delivered' };

const TIMELINE_STEPS = [
  { status: 'PENDING',   label: 'Order Placed' },
  { status: 'ACCEPTED',  label: 'Accepted by You' },
  { status: 'PICKED_UP', label: 'Picked Up' },
  { status: 'DELIVERED', label: 'Delivered' },
];

function DeliveryDetails() {
  const params = useSearchParams();
  const router = useRouter();
  const qc = useQueryClient();
  const id = params.get('id');

  const { data, isLoading } = useQuery<{ data: any }>({
    queryKey: ['order-detail', id],
    queryFn: () => api.get(`/orders/${id}`),
    enabled: !!id,
    refetchInterval: 10_000,
  });

  const order = data?.data;

  const acceptMutation = useMutation({
    mutationFn: () => api.patch(`/orders/${id}/accept`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['order-detail', id] }),
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => api.patch(`/orders/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['order-detail', id] }),
  });

  const cancelMutation = useMutation({
    mutationFn: () => api.patch(`/orders/${id}/status`, { status: 'CANCELLED' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['order-detail', id] }),
  });

  if (!id) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Package size={40} className="mx-auto mb-3 opacity-30" />
        <p className="font-medium">No job selected</p>
      </div>
    );
  }

  if (isLoading || !order) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3" />
        <div className="h-32 bg-muted rounded-2xl" />
        <div className="h-48 bg-muted rounded-2xl" />
      </div>
    );
  }

  const currentStepIndex = order.status === 'CANCELLED'
    ? -1
    : TIMELINE_STEPS.findIndex((s) => s.status === order.status);

  const history: any[] = order.statusHistory ?? [];
  function historyTimeFor(status: string) {
    return history.find((h) => h.status === status)?.createdAt;
  }

  const mapsUrl = (lat?: number, lng?: number, addr?: string) => {
    if (lat && lng) return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr ?? '')}`;
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="text-xl font-bold">Delivery Details</h2>
          <p className="text-xs font-mono text-muted-foreground">#{order.orderNumber?.slice(-8)}</p>
        </div>
        <span className={`ml-auto text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
          {order.status}
        </span>
      </div>

      {/* Status Timeline */}
      <div className="bg-card border rounded-2xl shadow-sm p-5">
        <h3 className="font-semibold text-sm mb-4">Status</h3>
        {order.status === 'CANCELLED' ? (
          <div className="flex items-center gap-3 text-red-600">
            <XCircle size={20} />
            <p className="text-sm font-medium">This order was cancelled</p>
          </div>
        ) : (
          <div className="space-y-0">
            {TIMELINE_STEPS.map((step, i) => {
              const done = i <= currentStepIndex;
              const isLast = i === TIMELINE_STEPS.length - 1;
              const time = historyTimeFor(step.status);
              return (
                <div key={step.status} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    {done ? (
                      <CheckCircle2 size={20} className="text-brand-green-500 flex-shrink-0" />
                    ) : (
                      <Circle size={20} className="text-gray-300 flex-shrink-0" />
                    )}
                    {!isLast && <div className={`w-0.5 flex-1 min-h-[24px] ${done && i < currentStepIndex ? 'bg-brand-green-500' : 'bg-gray-200'}`} />}
                  </div>
                  <div className="pb-6">
                    <p className={`text-sm font-medium ${done ? 'text-foreground' : 'text-muted-foreground'}`}>{step.label}</p>
                    {time && <p className="text-xs text-muted-foreground mt-0.5">{formatDateTime(time)}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Route */}
      <div className="bg-card border rounded-2xl shadow-sm p-5 space-y-4">
        <h3 className="font-semibold text-sm">Route</h3>
        <div className="space-y-3">
          <a href={mapsUrl(order.pickupLatitude, order.pickupLongitude, order.pickupAddress)} target="_blank" rel="noopener noreferrer"
            className="flex items-start gap-3 p-3 rounded-xl border hover:bg-muted/50 transition-colors">
            <MapPin size={16} className="text-brand-green-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Pickup</p>
              <p className="text-sm font-medium">{order.pickupAddress}</p>
            </div>
            <Navigation size={14} className="text-muted-foreground mt-1 flex-shrink-0" />
          </a>
          <a href={mapsUrl(order.destinationLatitude, order.destinationLongitude, order.destinationAddress)} target="_blank" rel="noopener noreferrer"
            className="flex items-start gap-3 p-3 rounded-xl border hover:bg-muted/50 transition-colors">
            <Navigation size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Dropoff</p>
              <p className="text-sm font-medium">{order.destinationAddress}</p>
            </div>
            <Navigation size={14} className="text-muted-foreground mt-1 flex-shrink-0" />
          </a>
        </div>
      </div>

      {/* Customer */}
      {order.customer && (
        <div className="bg-card border rounded-2xl shadow-sm p-5 flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-brand-green-100 text-brand-green-700 flex items-center justify-center font-bold flex-shrink-0">
            {order.customer.firstName?.[0]}{order.customer.lastName?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{order.customer.firstName} {order.customer.lastName}</p>
            <p className="text-xs text-muted-foreground">Customer</p>
          </div>
          {order.customer.phone && (
            <a href={`tel:${order.customer.phone}`} className="p-2.5 rounded-xl bg-brand-green-500 text-white hover:bg-brand-green-600 transition-colors">
              <Phone size={16} />
            </a>
          )}
        </div>
      )}

      {/* Order info */}
      <div className="bg-card border rounded-2xl shadow-sm p-5 space-y-3">
        <h3 className="font-semibold text-sm">Order Information</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><p className="text-xs text-muted-foreground">Service Type</p><p className="font-medium">{order.type}</p></div>
          <div><p className="text-xs text-muted-foreground">Fare</p><p className="font-bold">{formatCurrency(order.totalAmount)}</p></div>
          <div><p className="text-xs text-muted-foreground">Payment Method</p><p className="font-medium">{order.paymentMethod}</p></div>
          <div><p className="text-xs text-muted-foreground">Created</p><p className="font-medium flex items-center gap-1"><Clock size={12} />{formatDateTime(order.createdAt)}</p></div>
        </div>
        {order.description && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-1">Notes</p>
            <p className="text-sm">{order.description}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pb-6">
        {order.status === 'PENDING' && (
          <button onClick={() => acceptMutation.mutate()} disabled={acceptMutation.isPending}
            className="flex-1 py-3 bg-brand-green-500 text-white rounded-xl font-semibold text-sm hover:bg-brand-green-600 disabled:opacity-60 transition-colors">
            Accept Job
          </button>
        )}
        {NEXT_STATUS[order.status] && (
          <button onClick={() => statusMutation.mutate(NEXT_STATUS[order.status])} disabled={statusMutation.isPending}
            className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-semibold text-sm hover:bg-blue-600 disabled:opacity-60 transition-colors">
            {NEXT_LABEL[order.status]}
          </button>
        )}
        {(order.status === 'ACCEPTED' || order.status === 'PENDING') && (
          <button onClick={() => cancelMutation.mutate()} disabled={cancelMutation.isPending}
            className="px-4 py-3 border border-red-200 text-red-600 rounded-xl font-semibold text-sm hover:bg-red-50 disabled:opacity-60 transition-colors">
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

export default function RiderJobDetailsPage() {
  return (
    <Suspense fallback={<div className="text-center py-16 text-muted-foreground text-sm">Loading…</div>}>
      <DeliveryDetails />
    </Suspense>
  );
}
