'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Bike, Star, MapPin, Crosshair, Loader2, Users } from 'lucide-react';

const DEFAULT_COORDS = { lat: 5.6037, lng: -0.187 }; // Accra

export default function AvailableRidersPage() {
  const [coords, setCoords] = useState(DEFAULT_COORDS);
  const [locating, setLocating] = useState(false);
  const [usingDefault, setUsingDefault] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setUsingDefault(false);
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 8000 }
    );
  }, []);

  const { data, isLoading, refetch } = useQuery<{ data: any[] }>({
    queryKey: ['nearby-riders', coords.lat, coords.lng],
    queryFn: () => api.get(`/riders/nearby?lat=${coords.lat}&lng=${coords.lng}&radius=15`),
    refetchInterval: 15_000,
  });
  const riders = data?.data ?? [];

  function useMyLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setUsingDefault(false);
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 8000 }
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Available Riders</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {riders.length} rider{riders.length === 1 ? '' : 's'} online near you
            {usingDefault && ' (showing Accra area)'}
          </p>
        </div>
        <button onClick={useMyLocation} disabled={locating}
          className="flex items-center gap-1.5 px-3 py-2 border rounded-xl text-xs font-semibold hover:bg-muted disabled:opacity-50 transition-colors">
          {locating ? <Loader2 size={14} className="animate-spin" /> : <Crosshair size={14} />}
          Use my location
        </button>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card rounded-2xl border p-4 animate-pulse h-20" />
          ))
        ) : riders.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No riders online nearby</p>
            <p className="text-sm mt-1">You can still place a request — riders will be notified as they come online</p>
          </div>
        ) : (
          riders.map((r: any) => (
            <div key={r.id} className="bg-card border rounded-2xl shadow-sm p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-brand-green-100 text-brand-green-700 flex items-center justify-center font-bold flex-shrink-0 overflow-hidden">
                {r.user?.profilePhotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.user.profilePhotoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span>{r.user?.firstName?.[0]}{r.user?.lastName?.[0]}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{r.user?.firstName} {r.user?.lastName}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                  <span className="flex items-center gap-1"><Star size={11} className="text-brand-gold fill-brand-gold" /> {Number(r.averageRating ?? 0).toFixed(1)}</span>
                  {r.motorcycleMake && (
                    <span className="flex items-center gap-1"><Bike size={11} /> {r.motorcycleMake} {r.motorcycleModel}</span>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="flex items-center gap-1 text-xs font-semibold text-brand-green-600">
                  <MapPin size={11} /> {r.distanceKm} km
                </span>
                <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Online
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <Link href="/customer/request"
        className="flex items-center justify-center gap-2 w-full py-3 bg-brand-green-500 hover:bg-brand-green-600 text-white rounded-xl text-sm font-bold transition-colors">
        Request a Delivery
      </Link>
    </div>
  );
}
