'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Wallet, TrendingUp, ArrowUpRight, DollarSign, X } from 'lucide-react';

export default function RiderEarningsPage() {
  const qc = useQueryClient();
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [amount, setAmount]   = useState('');
  const [momoNumber, setMomo] = useState('');
  const [momoProvider, setProv] = useState('MTN');
  const [wErr, setWErr] = useState('');
  const [wOk, setWOk]   = useState('');

  const { data: earningsData } = useQuery<{ data: any }>({
    queryKey: ['rider-earnings'],
    queryFn: () => api.get('/riders/me/earnings'),
  });
  const e = earningsData?.data ?? earningsData ?? {};

  const withdrawMutation = useMutation({
    mutationFn: (body: any) => api.post('/riders/me/withdrawal', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rider-earnings'] });
      setWOk('Withdrawal request submitted! It will be processed within 24 hours.');
      setShowWithdraw(false);
      setAmount(''); setMomo('');
      setTimeout(() => setWOk(''), 6000);
    },
    onError: (err: any) => setWErr(err?.message || 'Failed to request withdrawal'),
  });

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold">Earnings</h2>
        <p className="text-muted-foreground text-sm mt-1">Your wallet and earnings summary</p>
      </div>

      {wOk && <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">{wOk}</div>}

      {/* Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-900 text-white rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-400">Wallet Balance</p>
            <div className="w-9 h-9 rounded-xl bg-brand-gold/20 flex items-center justify-center">
              <Wallet size={18} className="text-brand-gold" />
            </div>
          </div>
          <p className="text-3xl font-bold">{formatCurrency(e.walletBalance ?? 0)}</p>
          <button onClick={() => setShowWithdraw(true)}
            className="mt-3 text-xs bg-brand-gold text-gray-900 font-bold px-3 py-1.5 rounded-lg hover:bg-yellow-400 transition-colors">
            Withdraw
          </button>
        </div>

        <div className="bg-card border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-muted-foreground">Total Earned</p>
            <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
              <TrendingUp size={18} className="text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-bold">{formatCurrency(e.totalEarnings ?? 0)}</p>
          <p className="text-xs text-muted-foreground mt-1">{e.completedDeliveries ?? 0} deliveries</p>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="bg-card rounded-2xl border shadow-sm p-5">
        <h3 className="font-semibold text-sm mb-4">Recent Earnings</h3>
        {(!e.recentTransactions || e.recentTransactions.length === 0) ? (
          <div className="text-center py-8 text-muted-foreground">
            <DollarSign size={36} className="mx-auto mb-2 opacity-30" />
            <p>No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {e.recentTransactions?.map((t: any) => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
                    <ArrowUpRight size={16} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t.description || 'Delivery earnings'}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(t.createdAt)}</p>
                  </div>
                </div>
                <span className="font-bold text-sm text-green-600">+{formatCurrency(t.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Withdraw modal */}
      {showWithdraw && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowWithdraw(false)}>
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg">Request Withdrawal</h3>
              <button onClick={() => setShowWithdraw(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><X size={18} /></button>
            </div>
            {wErr && <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{wErr}</div>}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5">Amount (GHS)</label>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
                  className="w-full px-3 py-2.5 text-sm bg-muted rounded-xl outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5">MoMo Provider</label>
                <select value={momoProvider} onChange={e => setProv(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-muted rounded-xl outline-none border-0">
                  <option value="MTN">MTN Mobile Money</option>
                  <option value="VODAFONE">Vodafone Cash</option>
                  <option value="AIRTELTIGO">AirtelTigo Money</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5">MoMo Number</label>
                <input type="tel" value={momoNumber} onChange={e => setMomo(e.target.value)} placeholder="+233244123456"
                  className="w-full px-3 py-2.5 text-sm bg-muted rounded-xl outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowWithdraw(false)} className="flex-1 py-2.5 bg-muted text-foreground rounded-xl text-sm font-medium hover:bg-muted/80 transition-colors">Cancel</button>
                <button
                  onClick={() => { setWErr(''); withdrawMutation.mutate({ amount: parseFloat(amount), momoNumber, momoProvider }); }}
                  disabled={!amount || !momoNumber || withdrawMutation.isPending}
                  className="flex-1 py-2.5 bg-gray-900 text-brand-gold rounded-xl text-sm font-bold disabled:opacity-60 hover:bg-gray-800 transition-colors">
                  {withdrawMutation.isPending ? 'Submitting…' : 'Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
