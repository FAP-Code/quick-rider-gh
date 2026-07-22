'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDate, formatDateTime } from '@/lib/utils';
import { ShieldAlert, Check } from 'lucide-react';

function scoreColor(score: number): string {
  if (score >= 80) return 'bg-red-100 text-red-700 font-bold';
  if (score >= 60) return 'bg-orange-100 text-orange-700 font-semibold';
  if (score >= 40) return 'bg-yellow-100 text-yellow-700 font-semibold';
  return 'bg-gray-100 text-gray-600';
}

function scoreLabel(score: number): string {
  if (score >= 80) return 'High Risk';
  if (score >= 60) return 'Elevated';
  if (score >= 40) return 'Moderate';
  return 'Low';
}

export default function FraudFlagsPage() {
  const qc = useQueryClient();

  const { data: flagsData, isLoading } = useQuery<{ data: any[] }>({
    queryKey: ['admin-fraud-flags'],
    queryFn: () => api.get('/admin/fraud'),
  });

  const reviewMutation = useMutation({
    mutationFn: (id: string) => api.post(`/admin/fraud/${id}/review`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-fraud-flags'] }),
  });

  const flags = flagsData?.data ?? [];
  const unreviewed = flags.filter((f: any) => !f.reviewed).length;
  const highRisk   = flags.filter((f: any) => (f.score ?? 0) >= 70).length;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div className="flex items-center gap-2">
          <ShieldAlert size={22} className="text-red-500" />
          <h2>Fraud Flags</h2>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 max-w-md">
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Unreviewed</p>
          <p className="text-3xl font-bold mt-1 text-yellow-600">{isLoading ? '…' : unreviewed}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">High Risk (≥70)</p>
          <p className="text-3xl font-bold mt-1 text-red-600">{isLoading ? '…' : highRisk}</p>
        </div>
      </div>

      {/* Flags table */}
      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="bg-muted/50 text-xs text-muted-foreground">
                <th className="text-left px-4 py-3 font-medium">Order ID</th>
                <th className="text-left px-4 py-3 font-medium">Customer</th>
                <th className="text-left px-4 py-3 font-medium">Score</th>
                <th className="text-left px-4 py-3 font-medium">Signals</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-t animate-pulse">
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded w-full" /></td>
                      ))}
                    </tr>
                  ))
                : flags.length === 0
                ? (
                    <tr>
                      <td colSpan={7} className="text-center py-16 text-muted-foreground">
                        <ShieldAlert size={36} className="mx-auto mb-2 opacity-30" />
                        <p>No fraud flags found</p>
                      </td>
                    </tr>
                  )
                : flags.map((f: any) => (
                    <tr key={f.id} className={`border-t transition-colors hover:bg-muted/20 ${f.reviewed ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">#{(f.orderId ?? f.id)?.slice(-8)}</td>
                      <td className="px-4 py-3 text-muted-foreground truncate max-w-[160px]">{f.customerEmail ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${scoreColor(f.score ?? 0)}`}>
                          {f.score ?? 0} · {scoreLabel(f.score ?? 0)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs max-w-[200px]">
                        {Array.isArray(f.signals) ? f.signals.join(', ') : (f.signals ?? '—')}
                      </td>
                      <td className="px-4 py-3">
                        {f.reviewed
                          ? <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold flex items-center gap-1 w-fit"><Check size={10} /> Reviewed</span>
                          : <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-semibold">Pending</span>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">{f.createdAt ? formatDate(f.createdAt) : '—'}</td>
                      <td className="px-4 py-3">
                        {!f.reviewed && (
                          <button
                            onClick={() => reviewMutation.mutate(f.id)}
                            disabled={reviewMutation.isPending}
                            className="px-3 py-1.5 bg-brand-green-500 text-white text-xs font-semibold rounded-lg hover:bg-brand-green-600 disabled:opacity-60 transition-colors whitespace-nowrap"
                          >
                            Mark Reviewed
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
