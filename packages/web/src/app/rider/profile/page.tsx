'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { Save } from 'lucide-react';

export default function RiderProfilePage() {
  const user = useAuthStore(s => s.user);
  const qc   = useQueryClient();

  const { data: profileData } = useQuery<{ data: any }>({
    queryKey: ['rider-profile-edit'],
    queryFn: () => api.get('/riders/me'),
  });
  const riderProfile = profileData?.data ?? profileData;

  const [personal, setPersonal] = useState({ firstName: user?.firstName ?? '', lastName: user?.lastName ?? '', email: user?.email ?? '', phone: '' });
  const [moto, setMoto]         = useState({ motorcycleMake: '', motorcycleModel: '', motorcycleColor: '', motorcyclePlate: '', licenseClass: '', licenseNumber: '' });
  const [success, setSuccess]   = useState('');
  const [err, setErr]           = useState('');

  // Pre-fill moto when profile loads
  if (riderProfile && !moto.motorcycleMake && riderProfile.motorcycleMake) {
    setMoto({
      motorcycleMake:  riderProfile.motorcycleMake  ?? '',
      motorcycleModel: riderProfile.motorcycleModel ?? '',
      motorcycleColor: riderProfile.motorcycleColor ?? '',
      motorcyclePlate: riderProfile.motorcyclePlate ?? '',
      licenseClass:    riderProfile.licenseClass    ?? '',
      licenseNumber:   riderProfile.licenseNumber   ?? '',
    });
  }

  const updateMutation = useMutation({
    mutationFn: () => api.patch('/users/me', personal),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rider-profile-edit'] });
      setSuccess('Profile updated!');
      setTimeout(() => setSuccess(''), 4000);
    },
    onError: (e: any) => setErr(e?.message || 'Update failed'),
  });

  const updateMotoMutation = useMutation({
    mutationFn: () => api.patch('/riders/me/motorcycle', moto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rider-profile-edit'] });
      setSuccess('Motorcycle details updated!');
      setTimeout(() => setSuccess(''), 4000);
    },
    onError: (e: any) => setErr(e?.message || 'Update failed'),
  });

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div>
        <h2 className="text-2xl font-bold">My Profile</h2>
        <p className="text-muted-foreground text-sm mt-1">Manage your rider account</p>
      </div>

      {/* Avatar + status */}
      <div className="bg-gray-900 text-white rounded-2xl p-5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-brand-gold flex items-center justify-center text-gray-900 font-bold text-xl">
          {user?.firstName?.[0]}{user?.lastName?.[0]}
        </div>
        <div>
          <p className="font-bold text-lg">{user?.firstName} {user?.lastName}</p>
          <p className="text-gray-400 text-sm">Rider · {riderProfile?.status ?? 'PENDING'}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
            <span>⭐ {parseFloat(riderProfile?.averageRating ?? 0).toFixed(1)}</span>
            <span>✅ {riderProfile?.completedDeliveries ?? 0} deliveries</span>
          </div>
        </div>
      </div>

      {success && <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">{success}</div>}
      {err     && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{err}</div>}

      {/* Personal info */}
      <div className="bg-card border rounded-2xl p-5 space-y-4">
        <h3 className="font-semibold text-sm">Personal Information</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1.5">First Name</label>
            <input value={personal.firstName} onChange={e => setPersonal(f => ({ ...f, firstName: e.target.value }))}
              className="w-full px-3 py-2.5 text-sm bg-muted rounded-xl outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5">Last Name</label>
            <input value={personal.lastName} onChange={e => setPersonal(f => ({ ...f, lastName: e.target.value }))}
              className="w-full px-3 py-2.5 text-sm bg-muted rounded-xl outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5">Email</label>
          <input type="email" value={personal.email} onChange={e => setPersonal(f => ({ ...f, email: e.target.value }))}
            className="w-full px-3 py-2.5 text-sm bg-muted rounded-xl outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5">Phone</label>
          <input type="tel" value={personal.phone} onChange={e => setPersonal(f => ({ ...f, phone: e.target.value }))}
            placeholder="+233200111001"
            className="w-full px-3 py-2.5 text-sm bg-muted rounded-xl outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <button onClick={() => { setErr(''); updateMutation.mutate(); }} disabled={updateMutation.isPending}
          className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-brand-gold rounded-xl text-sm font-semibold disabled:opacity-60 hover:bg-gray-800 transition-colors">
          <Save size={15} />
          {updateMutation.isPending ? 'Saving…' : 'Save Personal Info'}
        </button>
      </div>

      {/* Motorcycle details */}
      <div className="bg-card border rounded-2xl p-5 space-y-4">
        <h3 className="font-semibold text-sm">Motorcycle & Licence</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1.5">Make</label>
            <input value={moto.motorcycleMake} onChange={e => setMoto(f => ({ ...f, motorcycleMake: e.target.value }))}
              placeholder="Yamaha" className="w-full px-3 py-2.5 text-sm bg-muted rounded-xl outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5">Model</label>
            <input value={moto.motorcycleModel} onChange={e => setMoto(f => ({ ...f, motorcycleModel: e.target.value }))}
              placeholder="FZ-S" className="w-full px-3 py-2.5 text-sm bg-muted rounded-xl outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5">Color</label>
            <input value={moto.motorcycleColor} onChange={e => setMoto(f => ({ ...f, motorcycleColor: e.target.value }))}
              placeholder="Red" className="w-full px-3 py-2.5 text-sm bg-muted rounded-xl outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5">Plate Number</label>
            <input value={moto.motorcyclePlate} onChange={e => setMoto(f => ({ ...f, motorcyclePlate: e.target.value }))}
              placeholder="GR-1234-22" className="w-full px-3 py-2.5 text-sm bg-muted rounded-xl outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5">Licence Class</label>
            <input value={moto.licenseClass} onChange={e => setMoto(f => ({ ...f, licenseClass: e.target.value }))}
              placeholder="e.g. B, C, D" className="w-full px-3 py-2.5 text-sm bg-muted rounded-xl outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5">Licence Number</label>
            <input value={moto.licenseNumber} onChange={e => setMoto(f => ({ ...f, licenseNumber: e.target.value }))}
              placeholder="GHA-12345678" className="w-full px-3 py-2.5 text-sm bg-muted rounded-xl outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>
        <button onClick={() => { setErr(''); updateMotoMutation.mutate(); }} disabled={updateMotoMutation.isPending}
          className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-brand-gold rounded-xl text-sm font-semibold disabled:opacity-60 hover:bg-gray-800 transition-colors">
          <Save size={15} />
          {updateMotoMutation.isPending ? 'Saving…' : 'Save Motorcycle Details'}
        </button>
      </div>
    </div>
  );
}
