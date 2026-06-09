'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface PricingConfig {
  id: string;
  baseFare: string;
  perKmRate: string;
  perMinuteRate: string;
  platformFeePercent: string;
  minimumFare: string;
  surgeMultiplier: string;
}

export default function SettingsPage() {
  const qc = useQueryClient();
  const [saved, setSaved] = useState(false);

  const { data } = useQuery<{ data: PricingConfig }>({
    queryKey: ['pricing'],
    queryFn: () => api.get('/admin/pricing'),
  });

  const [form, setForm] = useState({
    baseFare: '',
    perKmRate: '',
    perMinuteRate: '',
    platformFeePercent: '',
    minimumFare: '',
    surgeMultiplier: '',
  });

  const pricing = data?.data;

  const mutation = useMutation({
    mutationFn: (values: typeof form) => api.patch('/admin/pricing', values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pricing'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const vals = {
      baseFare: form.baseFare || pricing?.baseFare,
      perKmRate: form.perKmRate || pricing?.perKmRate,
      perMinuteRate: form.perMinuteRate || pricing?.perMinuteRate,
      platformFeePercent: form.platformFeePercent || pricing?.platformFeePercent,
      minimumFare: form.minimumFare || pricing?.minimumFare,
      surgeMultiplier: form.surgeMultiplier || pricing?.surgeMultiplier,
    };
    mutation.mutate(vals as typeof form);
  }

  const fields = [
    { key: 'baseFare', label: 'Base Fare (GHS)', placeholder: pricing?.baseFare },
    { key: 'perKmRate', label: 'Per KM Rate (GHS)', placeholder: pricing?.perKmRate },
    { key: 'perMinuteRate', label: 'Per Minute Rate (GHS)', placeholder: pricing?.perMinuteRate },
    { key: 'platformFeePercent', label: 'Platform Fee (%)', placeholder: pricing?.platformFeePercent },
    { key: 'minimumFare', label: 'Minimum Fare (GHS)', placeholder: pricing?.minimumFare },
    { key: 'surgeMultiplier', label: 'Surge Multiplier (×)', placeholder: pricing?.surgeMultiplier },
  ];

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2>Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">Configure platform pricing and settings</p>
      </div>

      <div className="bg-card rounded-xl border shadow-sm p-6">
        <h3 className="font-semibold mb-1">Pricing Configuration</h3>
        <p className="text-sm text-muted-foreground mb-6">
          These rates apply to all new orders. Changes take effect immediately.
        </p>

        {saved && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            ✓ Pricing updated successfully
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          {fields.map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
              <input
                type="number"
                step="0.01"
                value={form[key as keyof typeof form]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder ?? ''}
                className="w-full px-3 py-2.5 text-sm bg-muted rounded-lg border-0 outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          ))}

          <div className="col-span-2 pt-2">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-6 py-2.5 bg-brand-green-500 hover:bg-brand-green-600 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {mutation.isPending ? 'Saving…' : 'Save Pricing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
