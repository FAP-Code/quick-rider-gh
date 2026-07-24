'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency, formatDate, ORDER_STATUS_COLORS } from '@/lib/utils';
import { Building2, Clock, CheckCircle, ShoppingBag, TrendingUp, DollarSign } from 'lucide-react';

const BUSINESS_TYPES = ['Restaurant', 'Pharmacy', 'Grocery', 'Other'];

export default function MerchantPage() {
  const qc = useQueryClient();
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('Restaurant');
  const [address,      setAddress]      = useState('');
  const [phone,        setPhone]        = useState('');
  const [formErr,      setFormErr]      = useState('');

  const { data: profileData, isLoading: profileLoading } = useQuery<{ data: any }>({
    queryKey: ['merchant-profile'],
    queryFn: () => api.get('/merchant/profile'),
  });

  const { data: statsData } = useQuery<{ data: any }>({
    queryKey: ['merchant-stats'],
    queryFn: () => api.get('/merchant/stats'),
    enabled: profileData?.data?.status === 'APPROVED',
  });

  const { data: ordersData } = useQuery<{ data: any[] }>({
    queryKey: ['merchant-recent-orders'],
    queryFn: () => api.get('/merchant/orders?limit=5'),
    enabled: profileData?.data?.status === 'APPROVED',
  });

  const applyMutation = useMutation({
    mutationFn: (body: any) => api.post('/merchant/apply', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['merchant-profile'] }),
    onError: (err: any) => setFormErr(err?.message || 'Application failed. Please try again.'),
  });

  const merchant = profileData?.data ?? null;
  const stats    = statsData?.data ?? null;
  const orders   = ordersData?.data ?? [];

  function handleApply(ev: React.FormEvent) {
    ev.preventDefault();
    setFormErr('');
    if (!businessName.trim()) { setFormErr('Business name is required'); return; }
    if (!address.trim())      { setFormErr('Address is required'); return; }
    if (!phone.trim())        { setFormErr('Phone number is required'); return; }
    applyMutation.mutate({ businessName, businessType, address, phone });
  }

  if (profileLoading) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto animate-pulse">
        <div className="h-32 bg-muted rounded-2xl" />
        <div className="h-24 bg-muted rounded-2xl" />
      </div>
    );
  }

  // No merchant profile yet — show apply form
  if (!merchant) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Become a Merchant</h2>
          <p className="text-muted-foreground text-sm mt-1">Register your business to offer same-day delivery via Quick Rider GH</p>
        </div>

        <div className="bg-card border rounded-2xl shadow-sm p-6 space-y-4">
          <h3 className="font-semibold text-sm flex items-center gap-2"><Building2 size={15} className="text-brand-green-600" /> Business Details</h3>
          {formErr && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{formErr}</div>}
          <form onSubmit={handleApply} className="space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1.5">Business Name *</label>
              <input type="text" value={businessName} onChange={ev => setBusinessName(ev.target.value)}
                placeholder="e.g. Kofi's Kitchen"
                className="w-full px-3 py-2.5 text-sm bg-muted rounded-xl outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">Business Type</label>
              <select value={businessType} onChange={ev => setBusinessType(ev.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-muted rounded-xl outline-none border-0">
                {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">Business Address *</label>
              <input type="text" value={address} onChange={ev => setAddress(ev.target.value)}
                placeholder="e.g. 12 Kwame Nkrumah Ave, Accra"
                className="w-full px-3 py-2.5 text-sm bg-muted rounded-xl outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">Business Phone *</label>
              <input type="tel" value={phone} onChange={ev => setPhone(ev.target.value)}
                placeholder="+233 XX XXX XXXX"
                className="w-full px-3 py-2.5 text-sm bg-muted rounded-xl outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <button type="submit" disabled={applyMutation.isPending}
              className="w-full py-3 bg-brand-green-500 text-white rounded-xl font-bold text-sm hover:bg-brand-green-600 disabled:opacity-60 transition-colors">
              {applyMutation.isPending ? 'Submitting…' : 'Submit Application'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Pending approval
  if (merchant.status === 'PENDING') {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Application Submitted</h2>
          <p className="text-muted-foreground text-sm mt-1">{merchant.businessName}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-8 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-yellow-100 flex items-center justify-center mx-auto">
            <Clock size={28} className="text-yellow-600" />
          </div>
          <h3 className="font-bold text-lg text-yellow-800">Application Under Review</h3>
          <p className="text-yellow-700 text-sm">Our team is reviewing your application. This typically takes 1–2 business days. We&apos;ll notify you by email once a decision has been made.</p>
        </div>
      </div>
    );
  }

  // Approved — show dashboard
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold">{merchant.businessName}</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-green-100 text-green-700">
              <CheckCircle size={10} className="inline mr-1" />Approved
            </span>
            <span className="text-xs text-muted-foreground">{merchant.businessType}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Orders',         value: stats?.totalOrders ?? '—',                  icon: ShoppingBag,  color: 'bg-blue-100 text-blue-600' },
          { label: 'Total Revenue',        value: formatCurrency(stats?.totalRevenue ?? 0),   icon: DollarSign,   color: 'bg-green-100 text-green-600' },
          { label: 'Avg Order Value',      value: formatCurrency(stats?.averageOrderValue ?? 0), icon: TrendingUp, color: 'bg-purple-100 text-purple-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card border rounded-2xl p-5 shadow-sm">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon size={20} />
            </div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div className="bg-card border rounded-2xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">Recent Orders</h3>
          <a href="/merchant/orders" className="text-xs text-brand-green-600 font-semibold hover:underline">View all →</a>
        </div>
        {orders.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <ShoppingBag size={36} className="mx-auto mb-2 opacity-30" />
            <p>No orders yet</p>
          </div>
        ) : (
          <div className="space-y-2 overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="text-xs text-muted-foreground border-b">
                  <th className="text-left py-2 font-medium">Order</th>
                  <th className="text-left py-2 font-medium">Status</th>
                  <th className="text-left py-2 font-medium">Amount</th>
                  <th className="text-left py-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o: any) => (
                  <tr key={o.id} className="border-b last:border-0">
                    <td className="py-2.5 font-mono text-xs">#{o.orderNumber?.slice(-8)}</td>
                    <td className="py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${ORDER_STATUS_COLORS[o.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {o.status?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 font-bold">{formatCurrency(o.totalAmount)}</td>
                    <td className="py-2.5 text-muted-foreground text-xs">{formatDate(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
