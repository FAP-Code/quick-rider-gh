'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { MapPin, Plus, Trash2, Star, Loader2 } from 'lucide-react';

const DEFAULT_COORDS = { lat: 5.6037, lng: -0.187 };

export default function SavedAddressesPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState('');
  const [address, setAddress] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const { data, isLoading } = useQuery<{ data: any[] }>({
    queryKey: ['saved-addresses'],
    queryFn: () => api.get('/users/me/addresses'),
  });
  const addresses = data?.data ?? [];

  const addMutation = useMutation({
    mutationFn: () => api.post('/users/me/addresses', {
      label, address, latitude: DEFAULT_COORDS.lat, longitude: DEFAULT_COORDS.lng, isDefault,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['saved-addresses'] });
      setLabel(''); setAddress(''); setIsDefault(false); setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/me/addresses/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['saved-addresses'] }),
  });

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Saved Addresses</h2>
          <p className="text-muted-foreground text-sm mt-1">Quickly reuse pickup & dropoff locations</p>
        </div>
        <button onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand-green-500 hover:bg-brand-green-600 text-white rounded-xl text-sm font-semibold transition-colors">
          <Plus size={16} /> Add Address
        </button>
      </div>

      {showForm && (
        <div className="bg-card border rounded-2xl shadow-sm p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Label (e.g. Home, Work)"
              className="px-4 py-2.5 text-sm bg-muted rounded-xl outline-none focus:ring-2 focus:ring-brand-green-500/20" />
            <label className="flex items-center gap-2 px-4 py-2.5 text-sm">
              <input type="checkbox" checked={isDefault} onChange={e => setIsDefault(e.target.checked)} className="accent-brand-green-500" />
              Set as default
            </label>
          </div>
          <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Full address"
            className="w-full px-4 py-2.5 text-sm bg-muted rounded-xl outline-none focus:ring-2 focus:ring-brand-green-500/20" />
          <button onClick={() => addMutation.mutate()} disabled={!label || !address || addMutation.isPending}
            className="px-5 py-2.5 bg-brand-green-500 hover:bg-brand-green-600 text-white rounded-xl text-sm font-bold disabled:opacity-40 transition-colors flex items-center gap-2">
            {addMutation.isPending && <Loader2 size={14} className="animate-spin" />}
            Save Address
          </button>
        </div>
      )}

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card rounded-2xl border p-4 animate-pulse h-16" />
          ))
        ) : addresses.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <MapPin size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No saved addresses yet</p>
            <p className="text-sm mt-1">Add your home, work, or other frequent locations</p>
          </div>
        ) : (
          addresses.map((a: any) => (
            <div key={a.id} className="bg-card border rounded-2xl shadow-sm p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-green-100 text-brand-green-600 flex items-center justify-center flex-shrink-0">
                <MapPin size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm flex items-center gap-1.5">
                  {a.label}
                  {a.isDefault && <Star size={12} className="text-brand-gold fill-brand-gold" />}
                </p>
                <p className="text-xs text-muted-foreground truncate">{a.address}</p>
              </div>
              <button onClick={() => deleteMutation.mutate(a.id)} disabled={deleteMutation.isPending}
                className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
