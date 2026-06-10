'use client';
import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { formatCurrency, formatDateTime, ORDER_STATUS_COLORS } from '@/lib/utils';
import {
  ArrowLeft, MapPin, Navigation, Phone, Package, Clock, CheckCircle2,
  Circle, XCircle, Star,
} from 'lucide-react';

const TIMELINE_STEPS = [
  { status: 'PENDING',        label: 'Order Placed' },
  { status: 'ACCEPTED',       label: 'Rider Assigned' },
  { status: 'RIDER_EN_ROUTE', label: 'Rider En Route' },
  { status: 'PICKED_UP',      label: 'Picked Up' },
  { status: 'IN_TRANSIT',     label: 'In Transit' },
  { status: 'DELIVERED',      label: 'Delivered' },
];

function TrackOrder() {
  const params = useSearchParams();
  const router = useRouter();
  const qc = useQueryClient();
  const user = useAuthStore(s => s.user);
  const id = params.get('id');

  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const { data, isLoading } = useQuery<{ data: any }>({
    queryKey: ['order-detail', id],
    queryFn: () => api.get(`/orders/${id}`),
    enabled: !!id,
    refetchInterval: 8_000,
  });

  const order = data?.data;

  const cancelMutation = useMutation({
    mutationFn: () => api.patch(`/orders/${id}/status`, { status: 'CANCELLED', cancelReason: 'Cancelled by customer' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['order-detail', id] }),
  });

  const ratingMutation = useMutation({
    mutationFn: () => api.post('/users/me/ratings', {
      orderId: id, ratedId: order?.rider?.user?.id, score: rating, comment: review,
    }),
    onSuccess: () => { setReviewSubmitted(true); qc.invalidateQueries({ queryKey: ['order-detail', id] }); },
  });

  if (!id) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Package size={40} className="mx-auto mb-3 opacity-30" />
        <p className="font-medium">No order selected</p>
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

  const existingRating = (order.ratings ?? []).find((r: any) => r.raterId === user?.id);
  const canCancel = order.status === 'PENDING' || order.status === 'ACCEPTED';
  const isComplete = order.status === 'DELIVERED' || order.status === 'COMPLETED';

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-10">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="text-xl font-bold">Track Delivery</h2>
          <p className="text-xs font-mono text-muted-foreground">#{order.orderNumber?.slice(-8)}</p>
        </div>
        <span className={`ml-auto text-xs px-2.5 py-1 rounded-full font-semibold ${ORDER_STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
          {order.status.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Status Timeline */}
      <div className="bg-card border rounded-2xl shadow-sm p-5">
        <h3 className="font-semibold text-sm mb-4">Status</h3>
        {order.status === 'CANCELLED' ? (
          <div className="flex items-center gap-3 text-red-600">
            <XCircle size={20} />
            <p className="text-sm font-medium">This order was cancelled{order.cancelReason ? `: ${order.cancelReason}` : ''}</p>
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

      {/* Rider */}
      {order.rider ? (
        <div className="bg-card border rounded-2xl shadow-sm p-5 flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-brand-green-100 text-brand-green-700 flex items-center justify-center font-bold flex-shrink-0">
            {order.rider.user?.firstName?.[0]}{order.rider.user?.lastName?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{order.rider.user?.firstName} {order.rider.user?.lastName}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1"><Star size={11} className="text-brand-gold" /> {parseFloat(order.rider.averageRating ?? 0).toFixed(1)} rating</p>
          </div>
          {order.rider.user?.phone && (
            <a href={`tel:${order.rider.user.phone}`} className="p-2.5 rounded-xl bg-brand-green-500 text-white hover:bg-brand-green-600 transition-colors">
              <Phone size={16} />
            </a>
          )}
        </div>
      ) : (
        <div className="bg-card border rounded-2xl shadow-sm p-5 text-center text-sm text-muted-foreground">
          {order.status === 'PENDING' ? 'Looking for a nearby rider…' : 'No rider assigned'}
        </div>
      )}

      {/* Order info */}
      <div className="bg-card border rounded-2xl shadow-sm p-5 space-y-3">
        <h3 className="font-semibold text-sm">Order Information</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><p className="text-xs text-muted-foreground">Service Type</p><p className="font-medium">{order.type?.replace(/_/g, ' ')}</p></div>
          <div><p className="text-xs text-muted-foreground">Total</p><p className="font-bold">{formatCurrency(order.totalAmount)}</p></div>
          <div><p className="text-xs text-muted-foreground">Payment Method</p><p className="font-medium">{order.paymentMethod?.replace(/_/g, ' ')}</p></div>
          <div><p className="text-xs text-muted-foreground">Created</p><p className="font-medium flex items-center gap-1"><Clock size={12} />{formatDateTime(order.createdAt)}</p></div>
        </div>
        {order.description && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-1">Item</p>
            <p className="text-sm">{order.description}</p>
          </div>
        )}
        {order.specialInstructions && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-1">Instructions</p>
            <p className="text-sm">{order.specialInstructions}</p>
          </div>
        )}
      </div>

      {/* Rating */}
      {isComplete && !existingRating && (
        <div className="bg-card border rounded-2xl shadow-sm p-5 space-y-3">
          <h3 className="font-semibold text-sm">Rate this delivery</h3>
          {reviewSubmitted ? (
            <p className="text-sm text-brand-green-600 font-medium">Thanks for your feedback! ⭐</p>
          ) : (
            <>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setRating(n)}>
                    <Star size={26} className={n <= rating ? 'text-brand-gold fill-brand-gold' : 'text-gray-300'} />
                  </button>
                ))}
              </div>
              <textarea value={review} onChange={(e) => setReview(e.target.value)} rows={2}
                placeholder="Leave a review (optional)…"
                className="w-full px-4 py-2.5 text-sm bg-muted rounded-xl outline-none focus:ring-2 focus:ring-brand-green-500/20 resize-none" />
              <button onClick={() => ratingMutation.mutate()} disabled={!rating || ratingMutation.isPending}
                className="px-5 py-2.5 bg-brand-green-500 hover:bg-brand-green-600 text-white rounded-xl text-sm font-bold disabled:opacity-40 transition-colors">
                {ratingMutation.isPending ? 'Submitting…' : 'Submit Rating'}
              </button>
            </>
          )}
        </div>
      )}
      {isComplete && existingRating && (
        <div className="bg-card border rounded-2xl shadow-sm p-5">
          <h3 className="font-semibold text-sm mb-2">Your rating</h3>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star key={n} size={20} className={n <= existingRating.score ? 'text-brand-gold fill-brand-gold' : 'text-gray-300'} />
            ))}
          </div>
          {existingRating.comment && <p className="text-sm text-muted-foreground mt-2">{existingRating.comment}</p>}
        </div>
      )}

      {/* Actions */}
      {canCancel && (
        <div className="pb-6">
          <button onClick={() => cancelMutation.mutate()} disabled={cancelMutation.isPending}
            className="w-full py-3 border border-red-200 text-red-600 rounded-xl font-semibold text-sm hover:bg-red-50 disabled:opacity-60 transition-colors">
            {cancelMutation.isPending ? 'Cancelling…' : 'Cancel Order'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function CustomerTrackPage() {
  return (
    <Suspense fallback={<div className="text-center py-16 text-muted-foreground text-sm">Loading…</div>}>
      <TrackOrder />
    </Suspense>
  );
}
