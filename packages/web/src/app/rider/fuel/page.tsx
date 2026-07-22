'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Fuel, TrendingUp, TrendingDown, ExternalLink, Plus, CalendarDays } from 'lucide-react';

export default function RiderFuelPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [amount,   setAmount]   = useState('');
  const [litres,   setLitres]   = useState('');
  const [location, setLocation] = useState('');
  const [note,     setNote]     = useState('');
  const [date,     setDate]     = useState(new Date().toISOString().slice(0, 10));
  const [formErr,  setFormErr]  = useState('');
  const [formOk,   setFormOk]   = useState('');

  const { data: fuelData, isLoading: fuelLoading } = useQuery<{ data: any }>({
    queryKey: ['rider-fuel'],
    queryFn: () => api.get('/rider/fuel'),
  });

  const { data: earningsData } = useQuery<{ data: any }>({
    queryKey: ['rider-earnings'],
    queryFn: () => api.get('/riders/me/earnings'),
  });

  const fd = fuelData?.data ?? fuelData ?? {};
  const expenses: any[] = fd.expenses ?? [];
  const monthlyFuelTotal: number = fd.monthlyTotal ?? expenses.reduce((s: number, e: any) => s + parseFloat(e.amount ?? 0), 0);
  const e = earningsData?.data ?? earningsData ?? {};
  const grossEarnings: number = e.thisMonthEarnings ?? e.totalEarnings ?? 0;
  const netEarnings = grossEarnings - monthlyFuelTotal;

  const addMutation = useMutation({
    mutationFn: (body: any) => api.post('/rider/fuel', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rider-fuel'] });
      setFormOk('Expense logged!');
      setAmount(''); setLitres(''); setLocation(''); setNote('');
      setDate(new Date().toISOString().slice(0, 10));
      setShowForm(false);
      setTimeout(() => setFormOk(''), 4000);
    },
    onError: (err: any) => setFormErr(err?.message || 'Failed to save expense'),
  });

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setFormErr('');
    if (!amount || parseFloat(amount) <= 0) { setFormErr('Enter a valid amount'); return; }
    addMutation.mutate({
      amount:   parseFloat(amount),
      litres:   litres   ? parseFloat(litres)   : undefined,
      location: location || undefined,
      note:     note     || undefined,
      date,
    });
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Fuel Tracker</h2>
          <p className="text-muted-foreground text-sm mt-1">Log fuel costs and track net earnings</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand-green-500 text-white text-sm font-semibold rounded-xl hover:bg-brand-green-600 transition-colors flex-shrink-0"
        >
          <Plus size={16} /> Log Expense
        </button>
      </div>

      {formOk && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">{formOk}</div>
      )}

      {/* Net earnings summary */}
      <div className="bg-card border rounded-2xl shadow-sm p-5 space-y-3">
        <h3 className="font-semibold text-sm">This Month&apos;s Summary</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-muted-foreground"><TrendingUp size={15} className="text-green-500" /> Gross Earnings</span>
            <span className="font-semibold">{formatCurrency(grossEarnings)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-muted-foreground"><Fuel size={15} className="text-red-500" /> Total Fuel Costs</span>
            <span className="font-semibold text-red-600">−{formatCurrency(monthlyFuelTotal)}</span>
          </div>
          <div className="border-t pt-2 flex items-center justify-between">
            <span className="flex items-center gap-2 font-semibold text-sm"><TrendingDown size={15} className="text-brand-green-600" /> Net Earnings</span>
            <span className={`text-lg font-bold ${netEarnings >= 0 ? 'text-green-700' : 'text-red-600'}`}>{formatCurrency(netEarnings)}</span>
          </div>
        </div>
      </div>

      {/* Monthly fuel total card */}
      <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
          <Fuel size={22} className="text-red-500" />
        </div>
        <div>
          <p className="text-xs text-red-600 font-medium uppercase tracking-wide">Fuel Spend This Month</p>
          <p className="text-2xl font-bold text-red-700">{formatCurrency(monthlyFuelTotal)}</p>
          <p className="text-xs text-red-500 mt-0.5">{expenses.length} expense{expenses.length !== 1 ? 's' : ''} logged</p>
        </div>
      </div>

      {/* Log form */}
      {showForm && (
        <div className="bg-card border rounded-2xl shadow-sm p-5 space-y-4">
          <h3 className="font-semibold text-sm flex items-center gap-2"><CalendarDays size={15} /> Log Fuel Expense</h3>
          {formErr && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{formErr}</div>}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1.5">Amount (GHS) *</label>
                <input type="number" min="0" step="0.01" value={amount} onChange={ev => setAmount(ev.target.value)}
                  placeholder="e.g. 45.00"
                  className="w-full px-3 py-2.5 text-sm bg-muted rounded-xl outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5">Litres (optional)</label>
                <input type="number" min="0" step="0.01" value={litres} onChange={ev => setLitres(ev.target.value)}
                  placeholder="e.g. 5.0"
                  className="w-full px-3 py-2.5 text-sm bg-muted rounded-xl outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">Location (optional)</label>
              <input type="text" value={location} onChange={ev => setLocation(ev.target.value)}
                placeholder="e.g. Total Filling Station, Tema"
                className="w-full px-3 py-2.5 text-sm bg-muted rounded-xl outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">Date</label>
              <input type="date" value={date} onChange={ev => setDate(ev.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-muted rounded-xl outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">Note (optional)</label>
              <input type="text" value={note} onChange={ev => setNote(ev.target.value)}
                placeholder="e.g. Long route, extra fill-up"
                className="w-full px-3 py-2.5 text-sm bg-muted rounded-xl outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 bg-muted text-foreground rounded-xl text-sm font-medium hover:bg-muted/80 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={addMutation.isPending}
                className="flex-1 py-2.5 bg-brand-green-500 text-white rounded-xl text-sm font-bold hover:bg-brand-green-600 disabled:opacity-60 transition-colors">
                {addMutation.isPending ? 'Saving…' : 'Save Expense'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Expense history */}
      <div className="bg-card border rounded-2xl shadow-sm p-5">
        <h3 className="font-semibold text-sm mb-4">Expense History</h3>
        {fuelLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <Fuel size={36} className="mx-auto mb-2 opacity-30" />
            <p className="font-medium">No fuel expenses yet</p>
            <p className="text-sm">Tap &quot;Log Expense&quot; to start tracking</p>
          </div>
        ) : (
          <div className="space-y-2">
            {expenses.map((exp: any) => (
              <div key={exp.id} className="flex items-start justify-between border-b last:border-0 py-3 gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <Fuel size={16} className="text-red-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{exp.location || 'Fuel top-up'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {exp.date ? formatDate(exp.date) : ''}
                      {exp.litres ? ` · ${exp.litres}L` : ''}
                      {exp.note ? ` · ${exp.note}` : ''}
                    </p>
                  </div>
                </div>
                <span className="font-bold text-sm text-red-600 flex-shrink-0">−{formatCurrency(exp.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Link to earnings */}
      <a href="/rider/earnings" className="flex items-center justify-between p-4 bg-muted rounded-xl text-sm font-medium hover:bg-muted/80 transition-colors">
        <span>View full earnings breakdown</span>
        <ExternalLink size={14} className="text-muted-foreground" />
      </a>
    </div>
  );
}
