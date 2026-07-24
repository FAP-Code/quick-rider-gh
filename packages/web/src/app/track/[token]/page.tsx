'use client';
import { useEffect, useState } from 'react';
import { CheckCircle, Clock, Eye, MapPin, Navigation, AlertCircle, Bike } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

const STATUS_STEPS = [
  { key: 'PENDING',        label: 'Order Placed',       desc: 'Your order has been received' },
  { key: 'ACCEPTED',       label: 'Rider Assigned',      desc: 'A rider has accepted your order' },
  { key: 'RIDER_EN_ROUTE', label: 'Rider En Route',      desc: 'Rider is heading to pickup location' },
  { key: 'PICKED_UP',      label: 'Picked Up',           desc: 'Package collected from sender' },
  { key: 'IN_TRANSIT',     label: 'In Transit',          desc: 'Your delivery is on the way' },
  { key: 'DELIVERED',      label: 'Delivered',           desc: 'Package delivered successfully' },
  { key: 'COMPLETED',      label: 'Completed',           desc: 'Order marked as complete' },
];

const STATUS_ORDER = ['PENDING', 'ACCEPTED', 'RIDER_EN_ROUTE', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED'];

const STATUS_BADGE: Record<string, string> = {
  PENDING:        'bg-yellow-100 text-yellow-800',
  ACCEPTED:       'bg-blue-100 text-blue-800',
  RIDER_EN_ROUTE: 'bg-indigo-100 text-indigo-800',
  PICKED_UP:      'bg-purple-100 text-purple-800',
  IN_TRANSIT:     'bg-cyan-100 text-cyan-800',
  DELIVERED:      'bg-teal-100 text-teal-800',
  COMPLETED:      'bg-green-100 text-green-800',
  CANCELLED:      'bg-red-100 text-red-800',
};

function currentStepIndex(status: string) {
  const idx = STATUS_ORDER.indexOf(status);
  return idx === -1 ? 0 : idx;
}

export default function TrackTokenPage({ params }: { params: { token: string } }) {
  const { token } = params;
  const [trackData, setTrackData] = useState<any>(null);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(true);

  async function fetchTrack() {
    try {
      const res = await fetch(`${API_URL}/api/track/${token}`, { cache: 'no-store' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message || 'This tracking link is invalid or has expired.');
        setTrackData(null);
      } else {
        const json = await res.json();
        setTrackData(json.data ?? json);
        setError('');
      }
    } catch {
      setError('Could not load tracking information. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTrack();
    const interval = setInterval(fetchTrack, 15_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const stepIdx = trackData ? currentStepIndex(trackData.status) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-green-800 text-white px-4 py-4 shadow-md">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-gold flex items-center justify-center text-xl">🏍️</div>
          <div>
            <p className="font-bold text-base leading-tight">Quick Rider GH</p>
            <p className="text-green-200 text-xs">Order Tracking</p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {loading && (
          <div className="space-y-4 animate-pulse">
            <div className="h-20 bg-white rounded-2xl border" />
            <div className="h-40 bg-white rounded-2xl border" />
            <div className="h-32 bg-white rounded-2xl border" />
          </div>
        )}

        {!loading && error && (
          <div className="bg-white rounded-2xl border shadow-sm p-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto">
              <AlertCircle size={28} className="text-red-500" />
            </div>
            <h2 className="font-bold text-lg">Link Unavailable</h2>
            <p className="text-muted-foreground text-sm">{error}</p>
            <p className="text-xs text-muted-foreground">Tracking links expire after 48 hours.</p>
          </div>
        )}

        {!loading && !error && trackData && (
          <>
            {/* Status badge + view count + expiry */}
            <div className="bg-white rounded-2xl border shadow-sm p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground font-mono mb-1">#{trackData.orderNumber?.slice(-8)}</p>
                  <span className={`text-sm px-3 py-1 rounded-full font-bold ${STATUS_BADGE[trackData.status] ?? 'bg-gray-100 text-gray-700'}`}>
                    {trackData.status?.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="text-right text-xs text-muted-foreground space-y-1">
                  {trackData.viewCount != null && (
                    <p className="flex items-center justify-end gap-1"><Eye size={12} /> Viewed {trackData.viewCount} time{trackData.viewCount !== 1 ? 's' : ''}</p>
                  )}
                  {trackData.expiresInHours != null && (
                    <p className="flex items-center justify-end gap-1"><Clock size={12} /> Link expires in {trackData.expiresInHours}h</p>
                  )}
                </div>
              </div>

              {/* ETA */}
              {trackData.etaLow != null && trackData.etaHigh != null && (
                <div className="flex items-center gap-2 pt-2 border-t text-sm font-semibold text-green-800">
                  <Clock size={16} className="text-green-600 flex-shrink-0" />
                  {trackData.etaLow}–{trackData.etaHigh} min remaining
                </div>
              )}
            </div>

            {/* Status timeline */}
            <div className="bg-white rounded-2xl border shadow-sm p-5">
              <h3 className="font-semibold text-sm mb-4">Delivery Progress</h3>
              <div className="space-y-0">
                {STATUS_STEPS.map((step, i) => {
                  const done    = i < stepIdx;
                  const current = i === stepIdx;
                  const future  = i > stepIdx;
                  return (
                    <div key={step.key} className="flex gap-3 pb-1">
                      {/* Connector line + icon */}
                      <div className="flex flex-col items-center">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                          done    ? 'bg-green-500 text-white' :
                          current ? 'bg-green-800 text-white ring-4 ring-green-800/20' :
                          'bg-gray-100 text-gray-400'
                        }`}>
                          {done ? <CheckCircle size={14} /> : <span className="text-[10px] font-bold">{i + 1}</span>}
                        </div>
                        {i < STATUS_STEPS.length - 1 && (
                          <div className={`w-0.5 flex-1 my-0.5 min-h-[20px] ${done ? 'bg-green-400' : 'bg-gray-200'}`} />
                        )}
                      </div>
                      {/* Text */}
                      <div className={`pb-4 min-w-0 ${future ? 'opacity-40' : ''}`}>
                        <p className={`text-sm font-semibold leading-tight ${current ? 'text-green-800' : ''}`}>{step.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Addresses */}
            <div className="bg-white rounded-2xl border shadow-sm p-5 space-y-3">
              <h3 className="font-semibold text-sm mb-1">Route</h3>
              <div className="flex items-start gap-3 text-sm">
                <MapPin size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Pickup</p>
                  <p>{trackData.pickupAddress}</p>
                </div>
              </div>
              <div className="border-l-2 border-dashed border-gray-200 ml-2 h-4" />
              <div className="flex items-start gap-3 text-sm">
                <Navigation size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Destination</p>
                  <p>{trackData.destinationAddress}</p>
                </div>
              </div>
            </div>

            {/* Rider info */}
            {trackData.rider && (
              <div className="bg-white rounded-2xl border shadow-sm p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Bike size={22} className="text-green-700" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-0.5">Your Rider</p>
                  <p className="font-semibold">{trackData.rider.firstName} {trackData.rider.lastName}</p>
                  {trackData.rider.motorcyclePlate && (
                    <p className="text-xs text-muted-foreground mt-0.5">Plate: <span className="font-mono font-bold">{trackData.rider.motorcyclePlate}</span></p>
                  )}
                </div>
              </div>
            )}

            {/* Footer note */}
            <p className="text-center text-xs text-muted-foreground pb-4">
              Auto-refreshing every 15 seconds · Powered by Quick Rider GH 🏍️
            </p>
          </>
        )}
      </main>
    </div>
  );
}
