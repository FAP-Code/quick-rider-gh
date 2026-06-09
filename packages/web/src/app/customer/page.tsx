'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { useAuthStore } from '@/lib/auth-store';
import { MapPin, Navigation, Package, ShoppingBag, Briefcase, Utensils, ChevronRight, Clock, Star } from 'lucide-react';

const SERVICES = [
  { type: 'DELIVERY',  label: 'Delivery',  icon: Package,     color: 'bg-blue-100 text-blue-600',   desc: 'Send packages fast' },
  { type: 'ERRAND',   label: 'Errand',    icon: Briefcase,   color: 'bg-purple-100 text-purple-600', desc: 'Run errands for you' },
  { type: 'GROCERY',  label: 'Grocery',   icon: ShoppingBag, color: 'bg-orange-100 text-orange-600', desc: 'Shop & deliver' },
  { type: 'FOOD',     label: 'Food',      icon: Utensils,    color: 'bg-red-100 text-red-600',       desc: 'Food delivery' },
];

interface Estimate { distance: number; duration: number; fare: number; }

export default function CustomerHome() {
  const user = useAuthStore(s => s.user);
  const qc   = useQueryClient();
  const [serviceType, setServiceType] = useState('DELIVERY');
  const [pickup,   setPickup]   = useState('');
  const [dropoff,  setDropoff]  = useState('');
  const [note,     setNote]     = useState('');
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [success,  setSuccess]  = useState('');
  const [err,      setErr]      = useState('');

  const { data: ordersData } = useQuery<{ data: any[] }>({
    queryKey: ['my-orders'],
    queryFn: () => api.get('/orders?limit=3'),
  });
  const recentOrders = ordersData?.data ?? [];

  const estimateMutation = useMutation({
    mutationFn: () => api.post('/orders/estimate', {
      pickupAddress: pickup, dropoffAddress: dropoff,
      pickupLat: 5.6037, pickupLng: -0.187, dropoffLat: 5.614, dropoffLng: -0.205,
    }),
    onSuccess: (data: any) => setEstimate(data.data ?? data),
    onError: (e: any) => setErr(e?.message || 'Could not estimate fare'),
  });

  const placeMutation = useMutation({
    mutationFn: () => api.post('/orders', {
      serviceType,
      pickupAddress: pickup, dropoffAddress: dropoff,
      pickupLat: 5.6037, pickupLng: -0.187, dropoffLat: 5.614, dropoffLng: -0.205,
      recipientName: user?.firstName, recipientPhone: '',
      notes: note,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-orders'] });
      setSuccess('Order placed! We\'re finding a rider for you.');
      setPickup(''); setDropoff(''); setNote(''); setEstimate(null);
      setTimeout(() => setSuccess(''), 5000);
    },
    onError: (e: any) => setErr(e?.message || 'Failed to place order'),
  });

  const STATUS_COLOR: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    ACCEPTED: 'bg-blue-100 text-blue-700',
    PICKED_UP: 'bg-indigo-100 text-indigo-700',
    DELIVERED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Greeting */}
      <div>
        <h2 className="text-2xl font-bold">Hello, {user?.firstName} 👋</h2>
        <p className="text-muted-foreground mt-0.5">What would you like to send today?</p>
      </div>

      {/* Success */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium">{success}</div>
      )}
      {err && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{err}
          <button onClick={() => setErr('')} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {/* Service type */}
      <div className="grid grid-cols-4 gap-3">
        {SERVICES.map(({ type, label, icon: Icon, color, desc }) => (
          <button key={type} onClick={() => setServiceType(type)}
            className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all text-center ${serviceType === type ? 'border-brand-green-500 bg-brand-green-50' : 'border-border bg-card hover:border-brand-green-300'}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
              <Icon size={20} />
            </div>
            <span className="text-xs font-semibold">{label}</span>
          </button>
        ))}
      </div>

      {/* Order form */}
      <div className="bg-card rounded-2xl border shadow-sm p-5 space-y-4">
        <h3 className="font-semibold text-sm">Book a Rider</h3>
        <div className="space-y-3">
          <div className="relative">
            <MapPin className="absolute left-3 top-3 text-brand-green-500" size={16} />
            <input value={pickup} onChange={e => setPickup(e.target.value)}
              placeholder="Pickup address (e.g. Accra Mall, East Legon)"
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-muted rounded-xl outline-none focus:ring-2 focus:ring-brand-green-500/20" />
          </div>
          <div className="relative">
            <Navigation className="absolute left-3 top-3 text-red-500" size={16} />
            <input value={dropoff} onChange={e => setDropoff(e.target.value)}
              placeholder="Dropoff address (e.g. Tema Station, Accra)"
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-muted rounded-xl outline-none focus:ring-2 focus:ring-brand-green-500/20" />
          </div>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
            placeholder="Additional notes (optional)…"
            className="w-full px-4 py-2.5 text-sm bg-muted rounded-xl outline-none focus:ring-2 focus:ring-brand-green-500/20 resize-none" />
        </div>

        {estimate && (
          <div className="flex items-center justify-between p-3 bg-brand-green-50 border border-brand-green-200 rounded-xl text-sm">
            <div className="flex gap-4">
              <span className="text-muted-foreground">📍 {estimate.distance?.toFixed(1)} km</span>
              <span className="text-muted-foreground">⏱ ~{estimate.duration} min</span>
            </div>
            <span className="font-bold text-brand-green-700 text-base">{formatCurrency(estimate.fare)}</span>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={() => { setErr(''); estimateMutation.mutate(); }} disabled={!pickup || !dropoff || estimateMutation.isPending}
            className="flex-1 py-2.5 border border-brand-green-500 text-brand-green-600 rounded-xl text-sm font-semibold hover:bg-brand-green-50 disabled:opacity-40 transition-colors">
            {estimateMutation.isPending ? 'Estimating…' : 'Get Estimate'}
          </button>
          <button onClick={() => { setErr(''); placeMutation.mutate(); }} disabled={!pickup || !dropoff || placeMutation.isPending}
            className="flex-1 py-2.5 bg-brand-green-500 hover:bg-brand-green-600 text-white rounded-xl text-sm font-bold disabled:opacity-40 transition-colors">
            {placeMutation.isPending ? 'Booking…' : 'Book Rider'}
          </button>
        </div>
      </div>

      {/* Recent orders */}
      {recentOrders.length > 0 && (
        <div className="bg-card rounded-2xl border shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">Recent Orders</h3>
            <a href="/customer/orders" className="text-xs text-brand-green-600 hover:underline flex items-center gap-1">View all <ChevronRight size={12} /></a>
          </div>
          <div className="space-y-3">
            {recentOrders.map((o: any) => (
              <div key={o.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium truncate max-w-xs">{o.dropoffAddress}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Clock size={11} /> {new Date(o.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[o.status] ?? 'bg-gray-100 text-gray-600'}`}>{o.status}</span>
                  <span className="text-xs font-semibold">{formatCurrency(o.fare)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
