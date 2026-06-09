'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDateTime, formatCurrency } from '@/lib/utils';
import { CheckCircle, XCircle } from 'lucide-react';

interface Withdrawal {
  id: string;
  amount: string;
  method: string;
  accountNumber: string;
  accountName: string;
  status: string;
  createdAt: string;
  rider: { user: { firstName: string; lastName: string } };
}

const STATUS_COLORS: Record<string, string> = {
  PENDING:    'bg-yellow-100 text-yellow-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  COMPLETED:  'bg-green-100 text-green-800',
  FAILED:     'bg-red-100 text-red-800',
};

export default function WithdrawalsPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<{ data: Withdrawal[]; meta: { total: number; page: number; totalPages: number } }>({
    queryKey: ['withdrawals', statusFilter, page],
    queryFn: () => api.get(`/admin/withdrawals?page=${page}&limit=20${statusFilter ? `&status=${statusFilter}` : ''}`),
  });

  const process = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'reject' }) =>
      api.patch(`/admin/withdrawals/${id}/process`, { action }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['withdrawals'] }),
  });

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h2>Withdrawal Requests</h2>
          <p className="text-sm text-muted-foreground mt-1">{data?.meta.total ?? 0} requests</p>
        </div>
      </div>

      <div className="flex gap-2">
        {['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', ''].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              statusFilter === s
                ? 'bg-brand-green-500 text-white'
                : 'bg-card border hover:bg-muted text-muted-foreground'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Rider</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Amount</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Method</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Account</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Requested</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              : data?.data.map((w) => (
                  <tr key={w.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{w.rider.user.firstName} {w.rider.user.lastName}</td>
                    <td className="px-4 py-3 font-bold text-brand-green-700">{formatCurrency(parseFloat(w.amount))}</td>
                    <td className="px-4 py-3 text-muted-foreground">{w.method.replace('_', ' ')}</td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-mono">{w.accountNumber}</p>
                      <p className="text-xs text-muted-foreground">{w.accountName}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`status-badge ${STATUS_COLORS[w.status]}`}>{w.status}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{formatDateTime(w.createdAt)}</td>
                    <td className="px-4 py-3">
                      {w.status === 'PENDING' && (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => process.mutate({ id: w.id, action: 'approve' })}
                            className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition-colors"
                            title="Approve"
                          >
                            <CheckCircle size={15} />
                          </button>
                          <button
                            onClick={() => process.mutate({ id: w.id, action: 'reject' })}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                            title="Reject"
                          >
                            <XCircle size={15} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
