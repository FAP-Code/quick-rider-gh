'use client';
import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import {
  Package, ShoppingBag, Briefcase, Utensils, FileText, MapPin, Navigation,
  ArrowLeft, ArrowRight, CheckCircle2, Loader2, Bookmark, Crosshair,
} from 'lucide-react';

const SERVICES = [
  { type: 'PARCEL_DELIVERY',     label: 'Package',  icon: Package,    color: 'bg-blue-100 text-blue-600',     desc: 'Send a parcel' },
  { type: 'FOOD_PICKUP',         label: 'Food',      icon: Utensils,   color: 'bg-red-100 text-red-600',       desc: 'Pickup food order' },
  { type: 'SHOPPING_ASSISTANCE', label: 'Shopping',  icon: ShoppingBag,color: 'bg-orange-100 text-orange-600', desc: 'Shop & deliver' },
  { type: 'DOCUMENT_DELIVERY',   label: 'Documents', icon: FileText,   color: 'bg-purple-100 text-purple-600', desc: 'Send documents' },
  { type: 'PERSONAL_ERRAND',     label: 'Errand',    icon: Briefcase,  color: 'bg-teal-100 text-teal-600',     desc: 'Run an errand' },
];

const PAYMENT_METHODS = [
  { value: 'CASH',             label: 'Cash' },
  { value: 'MTN_MOMO',         label: 'MTN MoMo' },
  { value: 'TELECEL_CASH',     label: 'Telecel Cash' },
  { value: 'AIRTELTIGO_MONEY', label: 'AirtelTigo Money' },
  { value: 'VISA',             label: 'Visa Card' },
  { value: 'MASTERCARD',       label: 'Mastercard' },
];

// Default fallback coordinates (Accra)
const DEFAULT_PICKUP = { lat: 5.6037, lng: -0.187 };
const DEFAULT_DEST   = { lat: 5.614,  lng: -0.205 };

const STEPS = ['Service', 'Pickup', 'Destination', 'Details', 'Review'];

function RequestWizard() {
  const router = useRouter();
  const params = useSearchParams();

  const [step, setStep] = useState(1);
  const [serviceType, setServiceType] = useState(params.get('type') || '');

  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupLat, setPickupLat] = useState<number | null>(null);
  const [pickupLng, setPickupLng] = useState<number | null>(null);
  const [pickupContactName, setPickupContactName] = useState('');
  const [pickupContactPhone, setPickupContactPhone] = useState('');

  const [destAddress, setDestAddress] = useState('');
  const [destLat, setDestLat] = useState<number | null>(null);
  const [destLng, setDestLng] = useState<number | null>(null);
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');

  const [description, setDescription] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');

  const [err, setErr] = useState('');
  const [locating, setLocating] = useState(false);

  const { data: addressesData } = useQuery<{ data: any[] }>({
    queryKey: ['saved-addresses'],
    queryFn: () => api.get('/users/me/addresses'),
  });
  const addresses = addressesData?.data ?? [];

  // If user came in with a service type pre-selected from the 3-click widget, skip to pickup
  useEffect(() => {
    if (params.get('type') && step === 1) setStep(2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const estimateQuery = useQuery<{ data: any }>({
    queryKey: ['order-estimate', pickupLat, pickupLng, destLat, destLng],
    queryFn: () => api.get(`/orders/estimate?pickupLat=${pickupLat}&pickupLng=${pickupLng}&destLat=${destLat}&destLng=${destLng}`),
    enabled: step === 5 && pickupLat != null && destLat != null,
  });
  const estimate = estimateQuery.data?.data;

  const placeMutation = useMutation({
    mutationFn: () => api.post('/orders', {
      type: serviceType,
      description,
      pickupAddress,
      pickupLatitude: pickupLat ?? DEFAULT_PICKUP.lat,
      pickupLongitude: pickupLng ?? DEFAULT_PICKUP.lng,
      pickupContactName, pickupContactPhone,
      destinationAddress: destAddress,
      destinationLatitude: destLat ?? DEFAULT_DEST.lat,
      destinationLongitude: destLng ?? DEFAULT_DEST.lng,
      recipientName, recipientPhone,
      specialInstructions,
      paymentMethod,
    }),
    onSuccess: (res: any) => {
      const order = res?.data?.order ?? res?.data;
      router.push(`/customer/track?id=${order.id}`);
    },
    onError: (e: any) => setErr(e?.message || 'Failed to place order'),
  });

  function useMyLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPickupLat(pos.coords.latitude);
        setPickupLng(pos.coords.longitude);
        if (!pickupAddress) setPickupAddress('My current location');
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 8000 }
    );
  }

  function pickSavedAddress(a: any, target: 'pickup' | 'dest') {
    if (target === 'pickup') {
      setPickupAddress(a.address); setPickupLat(a.latitude); setPickupLng(a.longitude);
    } else {
      setDestAddress(a.address); setDestLat(a.latitude); setDestLng(a.longitude);
    }
  }

  function next() { setErr(''); setStep((s) => Math.min(5, s + 1)); }
  function back() { setErr(''); setStep((s) => Math.max(1, s - 1)); }

  const canNextStep1 = !!serviceType;
  const canNextStep2 = pickupAddress.trim().length > 2;
  const canNextStep3 = destAddress.trim().length > 2;

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-10">
      <div className="flex items-center gap-3">
        <button onClick={() => (step === 1 ? router.push('/customer') : back())}
          className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="text-xl font-bold">Request a Delivery</h2>
          <p className="text-xs text-muted-foreground">Step {step} of {STEPS.length}: {STEPS[step - 1]}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-1.5">
        {STEPS.map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i + 1 <= step ? 'bg-brand-green-500' : 'bg-muted'}`} />
        ))}
      </div>

      {err && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{err}</div>
      )}

      {/* Step 1: Service type */}
      {step === 1 && (
        <div className="bg-card rounded-2xl border shadow-sm p-5 space-y-4">
          <h3 className="font-semibold text-sm">What do you need?</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {SERVICES.map(({ type, label, icon: Icon, color, desc }) => (
              <button key={type} onClick={() => setServiceType(type)}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all text-center ${serviceType === type ? 'border-brand-green-500 bg-brand-green-50' : 'border-border bg-card hover:border-brand-green-300'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                  <Icon size={20} />
                </div>
                <span className="text-xs font-semibold">{label}</span>
                <span className="text-[10px] text-muted-foreground">{desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Pickup */}
      {step === 2 && (
        <div className="bg-card rounded-2xl border shadow-sm p-5 space-y-4">
          <h3 className="font-semibold text-sm">Where should the rider pick up?</h3>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 text-brand-green-500" size={16} />
            <input value={pickupAddress} onChange={(e) => { setPickupAddress(e.target.value); setPickupLat(null); setPickupLng(null); }}
              placeholder="Pickup address"
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-muted rounded-xl outline-none focus:ring-2 focus:ring-brand-green-500/20" />
          </div>
          <button onClick={useMyLocation} disabled={locating}
            className="flex items-center gap-2 text-xs font-semibold text-brand-green-600 hover:underline disabled:opacity-50">
            {locating ? <Loader2 size={14} className="animate-spin" /> : <Crosshair size={14} />}
            Use my current location
          </button>

          {addresses.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Bookmark size={12} /> Saved addresses</p>
              <div className="flex flex-wrap gap-2">
                {addresses.map((a: any) => (
                  <button key={a.id} onClick={() => pickSavedAddress(a, 'pickup')}
                    className="px-3 py-1.5 rounded-full text-xs font-medium border hover:bg-muted transition-colors">
                    {a.label}: {a.address.length > 24 ? a.address.slice(0, 24) + '…' : a.address}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2 border-t">
            <input value={pickupContactName} onChange={(e) => setPickupContactName(e.target.value)}
              placeholder="Contact name (optional)"
              className="px-4 py-2.5 text-sm bg-muted rounded-xl outline-none focus:ring-2 focus:ring-brand-green-500/20" />
            <input value={pickupContactPhone} onChange={(e) => setPickupContactPhone(e.target.value)}
              placeholder="Contact phone (optional)"
              className="px-4 py-2.5 text-sm bg-muted rounded-xl outline-none focus:ring-2 focus:ring-brand-green-500/20" />
          </div>
        </div>
      )}

      {/* Step 3: Destination */}
      {step === 3 && (
        <div className="bg-card rounded-2xl border shadow-sm p-5 space-y-4">
          <h3 className="font-semibold text-sm">Where is it going?</h3>
          <div className="relative">
            <Navigation className="absolute left-3 top-3 text-red-500" size={16} />
            <input value={destAddress} onChange={(e) => { setDestAddress(e.target.value); setDestLat(null); setDestLng(null); }}
              placeholder="Destination address"
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-muted rounded-xl outline-none focus:ring-2 focus:ring-brand-green-500/20" />
          </div>

          {addresses.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Bookmark size={12} /> Saved addresses</p>
              <div className="flex flex-wrap gap-2">
                {addresses.map((a: any) => (
                  <button key={a.id} onClick={() => pickSavedAddress(a, 'dest')}
                    className="px-3 py-1.5 rounded-full text-xs font-medium border hover:bg-muted transition-colors">
                    {a.label}: {a.address.length > 24 ? a.address.slice(0, 24) + '…' : a.address}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2 border-t">
            <input value={recipientName} onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Recipient name (optional)"
              className="px-4 py-2.5 text-sm bg-muted rounded-xl outline-none focus:ring-2 focus:ring-brand-green-500/20" />
            <input value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)}
              placeholder="Recipient phone (optional)"
              className="px-4 py-2.5 text-sm bg-muted rounded-xl outline-none focus:ring-2 focus:ring-brand-green-500/20" />
          </div>
        </div>
      )}

      {/* Step 4: Item info & payment */}
      {step === 4 && (
        <div className="bg-card rounded-2xl border shadow-sm p-5 space-y-4">
          <h3 className="font-semibold text-sm">Item details & payment</h3>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
            placeholder="What are we delivering? (e.g. Documents, electronics, food order…)"
            className="w-full px-4 py-2.5 text-sm bg-muted rounded-xl outline-none focus:ring-2 focus:ring-brand-green-500/20 resize-none" />
          <textarea value={specialInstructions} onChange={(e) => setSpecialInstructions(e.target.value)} rows={2}
            placeholder="Special instructions for the rider (optional)"
            className="w-full px-4 py-2.5 text-sm bg-muted rounded-xl outline-none focus:ring-2 focus:ring-brand-green-500/20 resize-none" />
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">Payment method</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PAYMENT_METHODS.map((m) => (
                <button key={m.value} onClick={() => setPaymentMethod(m.value)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-semibold border-2 transition-colors ${paymentMethod === m.value ? 'border-brand-green-500 bg-brand-green-50 text-brand-green-700' : 'border-border hover:border-brand-green-300'}`}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Review */}
      {step === 5 && (
        <div className="space-y-4">
          <div className="bg-card rounded-2xl border shadow-sm p-5 space-y-4">
            <h3 className="font-semibold text-sm">Review your request</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2"><MapPin size={14} className="text-brand-green-500 mt-0.5 flex-shrink-0" /><div><p className="text-xs text-muted-foreground">Pickup</p><p className="font-medium">{pickupAddress}</p></div></div>
              <div className="flex items-start gap-2"><Navigation size={14} className="text-red-500 mt-0.5 flex-shrink-0" /><div><p className="text-xs text-muted-foreground">Destination</p><p className="font-medium">{destAddress}</p></div></div>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                <div><p className="text-xs text-muted-foreground">Service</p><p className="font-medium">{SERVICES.find(s => s.type === serviceType)?.label}</p></div>
                <div><p className="text-xs text-muted-foreground">Payment</p><p className="font-medium">{PAYMENT_METHODS.find(p => p.value === paymentMethod)?.label}</p></div>
              </div>
              {description && <div><p className="text-xs text-muted-foreground">Item</p><p className="font-medium">{description}</p></div>}
            </div>
          </div>

          <div className="bg-brand-green-50 border border-brand-green-200 rounded-2xl p-5">
            {estimateQuery.isLoading ? (
              <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Calculating fare…</p>
            ) : estimate ? (
              <div className="flex items-center justify-between">
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>📍 {estimate.distanceKm} km</span>
                  <span>⏱ ~{estimate.estimatedDurationMinutes ?? estimate.estimatedDuration ?? estimate.duration} min</span>
                </div>
                <span className="font-bold text-brand-green-700 text-xl">{formatCurrency(estimate.totalAmount ?? estimate.fare)}</span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Fare will be calculated once you confirm.</p>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        {step > 1 && (
          <button onClick={back} className="px-5 py-3 border rounded-xl text-sm font-semibold hover:bg-muted transition-colors">Back</button>
        )}
        {step < 5 ? (
          <button onClick={next}
            disabled={(step === 1 && !canNextStep1) || (step === 2 && !canNextStep2) || (step === 3 && !canNextStep3)}
            className="flex-1 py-3 bg-brand-green-500 hover:bg-brand-green-600 text-white rounded-xl text-sm font-bold disabled:opacity-40 transition-colors flex items-center justify-center gap-2">
            Continue <ArrowRight size={16} />
          </button>
        ) : (
          <button onClick={() => placeMutation.mutate()} disabled={placeMutation.isPending}
            className="flex-1 py-3 bg-brand-green-500 hover:bg-brand-green-600 text-white rounded-xl text-sm font-bold disabled:opacity-40 transition-colors flex items-center justify-center gap-2">
            {placeMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            {placeMutation.isPending ? 'Placing order…' : 'Confirm & Request Rider'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function RequestPage() {
  return (
    <Suspense fallback={<div className="text-center py-16 text-muted-foreground text-sm">Loading…</div>}>
      <RequestWizard />
    </Suspense>
  );
}
