'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import {
  Users,
  Bike,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Activity,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface DashboardData {
  data: {
    users: { total: number };
    riders: { total: number; active: number; pending: number };
    orders: {
      total: number;
      today: number;
      thisMonth: number;
      completed: number;
      cancelled: number;
      active: number;
      completionRate: string;
    };
    revenue: { total: number; thisMonth: number };
  };
}

interface ChartData {
  data: Array<{ date: string; orders: number; revenue: number }>;
}

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-3xl font-bold mt-1 text-foreground">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-xl ${color}`}>
          <Icon size={22} className="text-white" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery<DashboardData>({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get('/admin/dashboard'),
    refetchInterval: 30_000,
  });

  const { data: chart } = useQuery<ChartData>({
    queryKey: ['orders-chart'],
    queryFn: () => api.get('/admin/analytics/orders-chart?period=30d'),
  });

  const s = stats?.data;

  return (
    <div className="space-y-6">
      {/* Live indicator */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        Live — refreshes every 30s
      </div>

      {/* Stats grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="stat-card animate-pulse h-32 bg-muted/50" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Customers"
              value={s?.users.total ?? 0}
              icon={Users}
              color="bg-blue-500"
            />
            <StatCard
              title="Total Riders"
              value={s?.riders.total ?? 0}
              sub={`${s?.riders.active ?? 0} online · ${s?.riders.pending ?? 0} pending`}
              icon={Bike}
              color="bg-brand-green-500"
            />
            <StatCard
              title="Total Orders"
              value={s?.orders.total ?? 0}
              sub={`${s?.orders.today ?? 0} today`}
              icon={ShoppingBag}
              color="bg-purple-500"
            />
            <StatCard
              title="Total Revenue"
              value={formatCurrency(s?.revenue.total)}
              sub={`${formatCurrency(s?.revenue.thisMonth)} this month`}
              icon={DollarSign}
              color="bg-brand-gold-600"
            />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Active Orders"
              value={s?.orders.active ?? 0}
              icon={Activity}
              color="bg-indigo-500"
            />
            <StatCard
              title="This Month"
              value={s?.orders.thisMonth ?? 0}
              icon={TrendingUp}
              color="bg-cyan-500"
            />
            <StatCard
              title="Completed"
              value={s?.orders.completed ?? 0}
              sub={`${s?.orders.completionRate} completion rate`}
              icon={CheckCircle2}
              color="bg-emerald-500"
            />
            <StatCard
              title="Cancelled"
              value={s?.orders.cancelled ?? 0}
              icon={XCircle}
              color="bg-red-500"
            />
          </div>
        </>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 bg-card rounded-xl border p-6 shadow-sm">
          <h3 className="font-semibold mb-4">Orders — Last 30 Days</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chart?.data ?? []}>
              <defs>
                <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#006633" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#006633" stopOpacity={0} />
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
              />
              <Area
                type="monotone"
                dataKey="orders"
                stroke="#006633"
                strokeWidth={2}
                fill="url(#ordersGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-2 bg-card rounded-xl border p-6 shadow-sm">
          <h3 className="font-semibold mb-4">Revenue — Last 30 Days</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chart?.data ?? []}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
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
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#FCD116"
                strokeWidth={2}
                fill="url(#revenueGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
