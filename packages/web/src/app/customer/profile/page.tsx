'use client';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { User, Phone, Mail, Save } from 'lucide-react';

export default function CustomerProfilePage() {
  const { user, setAuth } = useAuthStore();
  const [form, setForm] = useState({
    firstName: user?.firstName ?? '',
    lastName:  user?.lastName  ?? '',
    email:     user?.email     ?? '',
    phone:     '',
  });
  const [success, setSuccess] = useState('');
  const [err, setErr] = useState('');

  const updateMutation = useMutation({
    mutationFn: (values: typeof form) => api.patch('/users/me', values),
    onSuccess: (data: any) => {
      const updated = data.data ?? data;
      setAuth(
        { ...user!, ...updated },
        localStorage.getItem('access_token')!,
        localStorage.getItem('refresh_token')!
      );
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 4000);
    },
    onError: (e: any) => setErr(e?.message || 'Update failed'),
  });

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div>
        <h2 className="text-2xl font-bold">My Profile</h2>
        <p className="text-muted-foreground text-sm mt-1">Update your personal information</p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4 bg-card border rounded-2xl p-5">
        <div className="w-16 h-16 rounded-full bg-brand-green-100 flex items-center justify-center text-brand-green-700 font-bold text-xl">
          {user?.firstName?.[0]}{user?.lastName?.[0]}
        </div>
        <div>
          <p className="font-bold text-lg">{user?.firstName} {user?.lastName}</p>
          <p className="text-sm text-muted-foreground">Customer</p>
        </div>
      </div>

      {success && <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">{success}</div>}
      {err     && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{err}</div>}

      <div className="bg-card border rounded-2xl p-5 space-y-4">
        <h3 className="font-semibold text-sm">Personal Information</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1.5">First Name</label>
            <input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
              className="w-full px-3 py-2.5 text-sm bg-muted rounded-xl outline-none focus:ring-2 focus:ring-brand-green-500/20" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5">Last Name</label>
            <input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
              className="w-full px-3 py-2.5 text-sm bg-muted rounded-xl outline-none focus:ring-2 focus:ring-brand-green-500/20" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5 flex items-center gap-1"><Mail size={11} /> Email</label>
          <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            className="w-full px-3 py-2.5 text-sm bg-muted rounded-xl outline-none focus:ring-2 focus:ring-brand-green-500/20" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5 flex items-center gap-1"><Phone size={11} /> Phone (Ghana)</label>
          <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            placeholder="+233244123456"
            className="w-full px-3 py-2.5 text-sm bg-muted rounded-xl outline-none focus:ring-2 focus:ring-brand-green-500/20" />
        </div>
        <button onClick={() => { setErr(''); updateMutation.mutate(form); }} disabled={updateMutation.isPending}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-green-500 hover:bg-brand-green-600 text-white rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors">
          <Save size={15} />
          {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
