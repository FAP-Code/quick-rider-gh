'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { Star, MessageSquareQuote } from 'lucide-react';

function Stars({ score, size = 14 }: { score: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= Math.round(score) ? 'fill-brand-gold text-brand-gold' : 'text-gray-300'}
        />
      ))}
    </div>
  );
}

export default function RiderRatingsPage() {
  const { data, isLoading } = useQuery<{ data: any; meta: any }>({
    queryKey: ['rider-ratings'],
    queryFn: () => api.get('/riders/me/ratings?limit=30'),
  });

  const ratings = data?.data?.ratings ?? [];
  const average = data?.data?.average ?? 0;
  const total = data?.data?.total ?? 0;
  const breakdown: Record<number, number> = data?.data?.breakdown ?? {};

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold">Ratings & Reviews</h2>
        <p className="text-muted-foreground text-sm mt-1">See what customers are saying about you</p>
      </div>

      {/* Summary */}
      <div className="bg-card border rounded-2xl shadow-sm p-6 flex flex-col sm:flex-row items-center gap-6">
        <div className="text-center flex-shrink-0">
          <p className="text-4xl font-bold">{Number(average).toFixed(1)}</p>
          <Stars score={Number(average)} size={18} />
          <p className="text-xs text-muted-foreground mt-1">{total} review{total === 1 ? '' : 's'}</p>
        </div>
        <div className="flex-1 w-full space-y-1.5">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = breakdown[star] ?? 0;
            const pct = total > 0 ? (count / total) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="w-3 text-muted-foreground">{star}</span>
                <Star size={11} className="fill-brand-gold text-brand-gold flex-shrink-0" />
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-brand-gold rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-6 text-right text-muted-foreground">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reviews list */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm">Recent Reviews</h3>
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card rounded-2xl border p-4 animate-pulse space-y-2">
              <div className="h-4 bg-muted rounded w-1/3" />
              <div className="h-3 bg-muted rounded w-3/4" />
            </div>
          ))
        ) : ratings.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <MessageSquareQuote size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No reviews yet</p>
            <p className="text-sm">Complete deliveries to start receiving ratings</p>
          </div>
        ) : (
          ratings.map((r: any) => (
            <div key={r.id} className="bg-card border rounded-2xl p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-brand-green-100 flex items-center justify-center text-brand-green-700 font-bold text-xs flex-shrink-0">
                    {r.rater?.firstName?.[0]}{r.rater?.lastName?.[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{r.rater?.firstName} {r.rater?.lastName}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(r.createdAt)}</p>
                  </div>
                </div>
                <Stars score={r.score} />
              </div>
              {r.comment && <p className="text-sm text-muted-foreground pl-10">{r.comment}</p>}
              {r.order && (
                <p className="text-xs text-muted-foreground/70 pl-10 font-mono">
                  Order #{r.order.orderNumber?.slice(-8)} · {r.order.type}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
