'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('30d');

  const { data: chart } = useQuery<{ data: Array<{ date: string; orders: number; revenue: number }> }>({
    queryKey: ['orders-chart', period],
    queryFn: () => api.get(`/admin/analytics/orders-chart?period=${period}`),
  });

  const { data: stats } = useQuery<{ data: { orders: { completed: number; cancelled: number; total: number }; revenue: { total: number; thisMonth: number } } }>({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get('/admin/dashboard'),
  });

  const chartData = chart?.data ?? [];
  const totalOrders = chartData.reduce((s, d) => s + d.orders, 0);
  const totalRevenue = chartData.reduce((s, d) => s + d.revenue, 0);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h2>Analytics</h2>
        <div className="flex gap-2">
          {[['7d', '7 Days'], ['30d', '30 Days'], ['90d', '90 Days']].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setPeriod(v)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                period === v
                  ? 'bg-brand-green-500 text-white'
                  : 'bg-card border hover:bg-muted text-muted-foreground'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Orders in Period', value: totalOrders },
          { label: 'Revenue in Period', value: formatCurrency(totalRevenue) },
          { label: 'Completion Rate', value: stats?.data.orders.total ? `${((stats.data.orders.completed / stats.data.orders.total) * 100).toFixed(1)}%` : '—' },
          { label: 'Lifetime Revenue', value: formatCurrency(stats?.data.revenue.total) },
        ].map((item) => (
          <div key={item.label} className="stat-card">
            <p className="text-sm text-muted-foreground">{item.label}</p>
            <p className="text-2xl font-bold mt-1">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-card rounded-xl border p-6 shadow-sm">
          <h3 className="font-semibold mb-4">Daily Orders</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="orders" fill="#006633" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl border p-6 shadow-sm">
          <h3 className="font-semibold mb-4">Daily Revenue (GHS)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="rev2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FCD116" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#FCD116" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(v: number) => [formatCurrency(v), 'Revenue']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#FCD116" strokeWidth={2} fill="url(#rev2)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Demand Heatmap */}
      <HeatmapSection />

      {/* ETA Accuracy note */}
      <div className="bg-card rounded-xl border p-6 shadow-sm space-y-2">
        <h3 className="font-semibold">ETA Accuracy &amp; Confidence Bands</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Quick Rider GH provides <strong>ETA confidence bands</strong> (e.g. &quot;18–24 min&quot;) rather than a single point estimate.
          The band width reflects real-time uncertainty: traffic density, rider distance to pickup, and historical delivery variance on that route.
          A <strong>narrow band</strong> (±3 min) indicates high confidence; a <strong>wide band</strong> (±10 min or more) signals high variance — typically during peak hours or in high-congestion areas.
          ETAs are recalculated every 60 seconds while an order is in transit and riders are tracked via GPS.
          Displayed estimates target the <strong>P10–P90 range</strong> — 80% of deliveries complete within the band.
        </p>
      </div>
    </div>
  );
}

function HeatmapSection() {
  const { data: heatmapData, isLoading } = useQuery<{ data: any[] }>({
    queryKey: ['admin-heatmap'],
    queryFn: () => api.get('/admin/heatmap'),
  });

  const spots = heatmapData?.data?.slice(0, 10) ?? [];

  return (
    <div className="bg-card rounded-xl border p-6 shadow-sm">
      <h3 className="font-semibold mb-4">Top 10 Demand Hotspots <span className="text-muted-foreground font-normal text-sm">(Last 24h)</span></h3>
      {isLoading ? (
        <div className="space-y-2 animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-8 bg-muted rounded" />)}
        </div>
      ) : spots.length === 0 ? (
        <p className="text-muted-foreground text-sm">No heatmap data available yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[400px]">
            <thead>
              <tr className="text-xs text-muted-foreground border-b">
                <th className="text-left py-2 font-medium pr-4">#</th>
                <th className="text-left py-2 font-medium pr-4">Latitude</th>
                <th className="text-left py-2 font-medium pr-4">Longitude</th>
                <th className="text-right py-2 font-medium">Order Count</th>
              </tr>
            </thead>
            <tbody>
              {spots.map((spot: any, idx: number) => (
                <tr key={idx} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="py-2.5 pr-4 text-muted-foreground font-mono text-xs">{idx + 1}</td>
                  <td className="py-2.5 pr-4 font-mono text-xs">{typeof spot.lat === 'number' ? spot.lat.toFixed(5) : spot.lat}</td>
                  <td className="py-2.5 pr-4 font-mono text-xs">{typeof spot.lng === 'number' ? spot.lng.toFixed(5) : spot.lng}</td>
                  <td className="py-2.5 text-right">
                    <span className="font-bold">{spot.count ?? spot.orderCount ?? '—'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
