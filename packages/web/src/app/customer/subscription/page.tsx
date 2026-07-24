'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { CheckCircle, Leaf, Package, RefreshCw, Zap, Star } from 'lucide-react';

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-brand-green-500' : 'bg-gray-300'}`}
    >
      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${checked ? 'left-6' : 'left-1'}`} />
    </button>
  );
}

const PLANS = [
  {
    id: 'BASIC',
    name: 'Basic',
    price: 80,
    deliveries: 10,
    perks: ['Delivery fee waived on each', 'Standard dispatch priority', 'Valid for 30 days'],
    icon: Package,
    accent: 'border-brand-green-500 bg-brand-green-500/5',
    badgeColor: 'bg-brand-green-500 text-white',
  },
  {
    id: 'PREMIUM',
    name: 'Premium',
    price: 120,
    deliveries: 20,
    perks: ['Priority dispatch + fee waived', 'Fastest rider assignment', 'Valid for 30 days'],
    icon: Zap,
    accent: 'border-brand-gold bg-brand-gold/5',
    badgeColor: 'bg-brand-gold text-gray-900',
  },
];

export default function SubscriptionPage() {
  const qc = useQueryClient();
  const [activatingPlan, setActivatingPlan] = useState<string | null>(null);
  const [success, setSuccess] = useState('');
  const [error, setError]     = useState('');

  const { data: subData, isLoading } = useQuery<{ data: any }>({
    queryKey: ['customer-subscription'],
    queryFn: () => api.get('/customer/subscription'),
  });
  const sub = subData?.data ?? null;

  const activateMutation = useMutation({
    mutationFn: (plan: string) => api.post('/customer/subscription', { plan }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customer-subscription'] });
      setSuccess('Subscription activated! Enjoy your delivery pass.');
      setActivatingPlan(null);
      setTimeout(() => setSuccess(''), 5000);
    },
    onError: (err: any) => {
      setError(err?.message || 'Failed to activate subscription');
      setActivatingPlan(null);
    },
  });

  const renewMutation = useMutation({
    mutationFn: (autoRenew: boolean) => api.patch('/customer/subscription', { autoRenew }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customer-subscription'] }),
  });

  const activePlanId = sub?.plan as string | undefined;
  const deliveriesUsed = sub?.deliveriesUsed ?? 0;
  const deliveriesTotal = sub?.deliveriesTotal ?? 0;
  const deliveriesRemaining = Math.max(0, deliveriesTotal - deliveriesUsed);
  const progressPct = deliveriesTotal > 0 ? Math.min(100, (deliveriesUsed / deliveriesTotal) * 100) : 0;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold">Delivery Pass</h2>
        <p className="text-muted-foreground text-sm mt-1">Subscribe and save on every delivery</p>
      </div>

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm flex items-center gap-2">
          <CheckCircle size={16} /> {success}
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
      )}

      {/* Active subscription card */}
      {!isLoading && sub && sub.status === 'ACTIVE' && (
        <div className="bg-gray-900 text-white rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">Active Plan</p>
              <h3 className="text-xl font-bold mt-0.5">{sub.plan === 'PREMIUM' ? 'Premium' : 'Basic'} Pass</h3>
            </div>
            <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold uppercase">Active</span>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-gray-300">{deliveriesRemaining} deliveries remaining</span>
              <span className="text-gray-400">{deliveriesUsed}/{deliveriesTotal} used</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-green-400 rounded-full transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-300">
              Expires <span className="font-semibold text-white">{sub.endDate ? formatDate(sub.endDate) : '—'}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <RefreshCw size={14} />
              <span>Auto-renew</span>
              <Toggle checked={!!sub.autoRenew} onChange={(v) => renewMutation.mutate(v)} />
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="bg-card rounded-2xl border p-6 animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-1/3" />
          <div className="h-8 bg-muted rounded w-1/2" />
          <div className="h-2 bg-muted rounded" />
        </div>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PLANS.map((plan) => {
          const isCurrentPlan = activePlanId === plan.id && sub?.status === 'ACTIVE';
          const Icon = plan.icon;
          return (
            <div key={plan.id} className={`bg-card border-2 rounded-2xl p-5 shadow-sm relative ${isCurrentPlan ? plan.accent : 'border-border'}`}>
              {isCurrentPlan && (
                <span className={`absolute top-4 right-4 text-xs font-bold px-2.5 py-1 rounded-full ${plan.badgeColor}`}>
                  Current Plan
                </span>
              )}

              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${plan.id === 'PREMIUM' ? 'bg-brand-gold/20' : 'bg-brand-green-500/10'}`}>
                <Icon size={20} className={plan.id === 'PREMIUM' ? 'text-brand-gold' : 'text-brand-green-600'} />
              </div>

              <h3 className="text-lg font-bold">{plan.name}</h3>
              <div className="flex items-end gap-1 mt-1 mb-3">
                <span className="text-2xl font-extrabold">GHS {plan.price}</span>
                <span className="text-muted-foreground text-sm mb-0.5">/month</span>
              </div>

              <p className="text-sm font-semibold text-muted-foreground mb-2">{plan.deliveries} deliveries included</p>

              <ul className="space-y-1.5 mb-5">
                {plan.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2 text-sm">
                    <CheckCircle size={14} className={`mt-0.5 flex-shrink-0 ${plan.id === 'PREMIUM' ? 'text-brand-gold' : 'text-brand-green-500'}`} />
                    {perk}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => {
                  setError('');
                  setActivatingPlan(plan.id);
                  activateMutation.mutate(plan.id);
                }}
                disabled={isCurrentPlan || (activateMutation.isPending && activatingPlan === plan.id)}
                className={`w-full py-2.5 rounded-xl text-sm font-bold transition-colors ${
                  isCurrentPlan
                    ? 'bg-muted text-muted-foreground cursor-default'
                    : plan.id === 'PREMIUM'
                    ? 'bg-brand-gold text-gray-900 hover:bg-yellow-400'
                    : 'bg-brand-green-500 text-white hover:bg-brand-green-600'
                } disabled:opacity-60`}
              >
                {isCurrentPlan
                  ? 'Current Plan'
                  : activateMutation.isPending && activatingPlan === plan.id
                  ? 'Activating…'
                  : 'Activate'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Carbon note */}
      <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
        <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
          <Leaf size={20} className="text-green-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-green-800">Greener than you think</p>
          <p className="text-xs text-green-700 mt-0.5">Avg subscriber saves <strong>2.4 kg CO₂/month</strong> vs. individual car trips</p>
        </div>
      </div>

      {/* FAQ / note */}
      <div className="bg-card border rounded-2xl p-5 text-sm text-muted-foreground space-y-2">
        <p className="font-semibold text-foreground flex items-center gap-1.5"><Star size={14} className="text-brand-gold" /> How it works</p>
        <p>Each delivery covered by your pass has the delivery fee waived. Deliveries beyond your monthly quota are charged at the standard rate.</p>
        <p>Unused deliveries do not roll over. Auto-renew charges your preferred payment method on the renewal date.</p>
      </div>
    </div>
  );
}
