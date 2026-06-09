'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  OPEN:          'bg-yellow-100 text-yellow-800',
  UNDER_REVIEW:  'bg-blue-100 text-blue-800',
  RESOLVED:      'bg-green-100 text-green-800',
  DISMISSED:     'bg-gray-100 text-gray-800',
};

interface Report {
  id: string;
  type: string;
  reason: string;
  status: string;
  createdAt: string;
  reporter: { firstName: string; lastName: string };
  reported: { firstName: string; lastName: string };
}

export default function ReportsPage() {
  const { data, isLoading } = useQuery<{ data: Report[]; meta: { total: number } }>({
    queryKey: ['reports'],
    queryFn: () => api.get('/admin/reports?limit=50'),
  });

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h2>Reports & Complaints</h2>
          <p className="text-sm text-muted-foreground mt-1">{data?.meta.total ?? 0} total reports</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Reporter</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Reported</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Reason</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              : data?.data.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{r.reporter.firstName} {r.reporter.lastName}</td>
                    <td className="px-4 py-3">{r.reported.firstName} {r.reported.lastName}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 bg-muted rounded-md text-xs">{r.type}</span></td>
                    <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{r.reason}</td>
                    <td className="px-4 py-3"><span className={`status-badge ${STATUS_COLORS[r.status]}`}>{r.status}</span></td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{formatDateTime(r.createdAt)}</td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
