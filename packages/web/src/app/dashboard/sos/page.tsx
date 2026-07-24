'use client';
import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { timeAgo, formatDateTime } from '@/lib/utils';
import { AlertTriangle, CheckCircle, MapPin, Clock } from 'lucide-react';

export default function SosPage() {
  const qc = useQueryClient();

  const { data: sosData, isLoading } = useQuery<{ data: any[] }>({
    queryKey: ['admin-sos'],
    queryFn: () => api.get('/admin/sos'),
    refetchInterval: 10_000,
  });

  const ackMutation = useMutation({
    mutationFn: (id: string) => api.post(`/admin/sos/${id}/acknowledge`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-sos'] }),
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string) => api.post(`/admin/sos/${id}/resolve`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-sos'] }),
  });

  const all      = sosData?.data ?? [];
  const active   = all.filter((s: any) => !s.resolved);
  const resolved = all.filter((s: any) => s.resolved);

  function mapsUrl(lat: number, lng: number) {
    return `https://www.google.com/maps?q=${lat},${lng}`;
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div className="flex items-center gap-2">
          <AlertTriangle size={22} className="text-red-500" />
          <h2>SOS Escalations</h2>
        </div>
        <p className="text-sm text-muted-foreground">Auto-refreshing every 10 seconds</p>
      </div>

      {/* Active SOS */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-base">Active Alerts</h3>
          {!isLoading && active.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold animate-pulse">{active.length}</span>
          )}
        </div>

        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-28 bg-muted rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && active.length === 0 && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
            <CheckCircle size={32} className="mx-auto mb-2 text-green-500" />
            <p className="font-semibold text-green-800">No active SOS alerts</p>
            <p className="text-sm text-green-600 mt-0.5">All riders are safe</p>
          </div>
        )}

        {!isLoading && active.map((s: any) => {
          const riderName = `${s.rider?.user?.firstName ?? ''} ${s.rider?.user?.lastName ?? ''}`.trim() || 'Unknown Rider';
          return (
            <div key={s.id} className="bg-red-50 border-2 border-red-300 rounded-2xl p-5 space-y-3 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle size={20} className="text-red-600" />
                  </div>
                  <div>
                    <p className="font-bold text-red-800">{riderName}</p>
                    {s.acknowledged
                      ? <span className="text-xs bg-yellow-100 text-yellow-700 font-semibold px-2 py-0.5 rounded-full">Acknowledged</span>
                      : <span className="text-xs bg-red-200 text-red-700 font-semibold px-2 py-0.5 rounded-full animate-pulse">Unacknowledged</span>}
                  </div>
                </div>
                <div className="text-right text-xs text-red-600">
                  <p className="flex items-center gap-1 justify-end"><Clock size={12} /> {s.createdAt ? timeAgo(s.createdAt) : '—'}</p>
                </div>
              </div>

              {(s.latitude && s.longitude) && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin size={14} className="text-red-500 flex-shrink-0" />
                  <a
                    href={mapsUrl(s.latitude, s.longitude)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-700 underline font-medium hover:text-red-900"
                  >
                    {s.latitude.toFixed(5)}, {s.longitude.toFixed(5)} — Open in Maps ↗
                  </a>
                </div>
              )}

              {s.message && (
                <p className="text-sm text-red-700 bg-red-100 rounded-lg px-3 py-2">{s.message}</p>
              )}

              <div className="flex gap-2 pt-1">
                {!s.acknowledged && (
                  <button
                    onClick={() => ackMutation.mutate(s.id)}
                    disabled={ackMutation.isPending}
                    className="px-4 py-2 bg-yellow-500 text-white text-sm font-semibold rounded-xl hover:bg-yellow-600 disabled:opacity-60 transition-colors"
                  >
                    Acknowledge
                  </button>
                )}
                <button
                  onClick={() => resolveMutation.mutate(s.id)}
                  disabled={resolveMutation.isPending}
                  className="px-4 py-2 bg-brand-green-500 text-white text-sm font-semibold rounded-xl hover:bg-brand-green-600 disabled:opacity-60 transition-colors"
                >
                  Mark Resolved
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Resolved */}
      {resolved.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-base text-muted-foreground">Resolved ({resolved.length})</h3>
          <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[500px]">
                <thead>
                  <tr className="bg-muted/50 text-xs text-muted-foreground">
                    <th className="text-left px-4 py-3 font-medium">Rider</th>
                    <th className="text-left px-4 py-3 font-medium">Location</th>
                    <th className="text-left px-4 py-3 font-medium">Triggered</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {resolved.map((s: any) => {
                    const riderName = `${s.rider?.user?.firstName ?? ''} ${s.rider?.user?.lastName ?? ''}`.trim() || 'Unknown';
                    return (
                      <tr key={s.id} className="border-t opacity-70">
                        <td className="px-4 py-3 font-medium">{riderName}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {s.latitude && s.longitude
                            ? <a href={`https://www.google.com/maps?q=${s.latitude},${s.longitude}`} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">{s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}</a>
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{s.createdAt ? formatDateTime(s.createdAt) : '—'}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold flex items-center gap-1 w-fit">
                            <CheckCircle size={10} /> Resolved
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
