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
    </div>
  );
}
