'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency, ORDER_STATUS_COLORS } from '@/lib/utils';
import { useAuthStore } from '@/lib/auth-store';
import {
  MapPin, Navigation, Package, ShoppingBag, Briefcase, Utensils, FileText,
  ChevronRight, Clock, Plus,
} from 'lucide-react';

const SERVICES = [
  { type: 'PARCEL_DELIVERY',     label: 'Package',  icon: Package,    color: 'bg-blue-100 text-blue-600' },
  { type: 'FOOD_PICKUP',         label: 'Food',      icon: Utensils,   color: 'bg-red-100 text-red-600' },
  { type: 'SHOPPING_ASSISTANCE', label: 'Shopping',  icon: ShoppingBag,color: 'bg-orange-100 text-orange-600' },
  { type: 'DOCUMENT_DELIVERY',   label: 'Documents', icon: FileText,   color: 'bg-purple-100 text-purple-600' },
  { type: 'PERSONAL_ERRAND',     label: 'Errand',    icon: Briefcase,  color: 'bg-teal-100 text-teal-600' },
];

export default function CustomerHome() {
  const user = useAuthStore(s => s.user);

  const { data: ordersData } = useQuery<{ data: any[] }>({
    queryKey: ['my-orders', 'recent'],
    queryFn: () => api.get('/orders?limit=3'),
  });
  const recentOrders = ordersData?.data ?? [];

  const activeOrder = recentOrders.find((o: any) =>
    !['DELIVERED', 'COMPLETED', 'CANCELLED'].includes(o.status)
  );

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Greeting */}
      <div>
        <h2 className="text-2xl font-bold">Hello, {user?.firstName} 👋</h2>
        <p className="text-muted-foreground mt-0.5">What would you like to send today?</p>
      </div>

      {/* Active order banner */}
      {activeOrder && (
        <Link href={`/customer/track?id=${activeOrder.id}`}
          className="block bg-gray-900 text-white rounded-2xl p-5 hover:bg-gray-800 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">Active delivery</p>
              <p className="font-semibold mt-0.5 truncate max-w-xs">{activeOrder.destinationAddress}</p>
              <span className={`inline-block mt-2 text-xs px-2.5 py-1 rounded-full font-semibold ${ORDER_STATUS_COLORS[activeOrder.status] ?? 'bg-gray-700 text-gray-300'}`}>
                {activeOrder.status.replace(/_/g, ' ')}
              </span>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </div>
        </Link>
      )}

      {/* 3-click quick request */}
      <div className="bg-card rounded-2xl border shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Quick Request</h3>
          <Link href="/customer/request" className="text-xs text-brand-green-600 hover:underline flex items-center gap-1">
            Full request <ChevronRight size={12} />
          </Link>
        </div>
        <p className="text-xs text-muted-foreground -mt-2">Pick a service to start in 3 clicks</p>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {SERVICES.map(({ type, label, icon: Icon, color }) => (
            <Link key={type} href={`/customer/request?type=${type}`}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl border-2 border-border bg-card hover:border-brand-green-300 transition-all text-center">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                <Icon size={20} />
              </div>
              <span className="text-xs font-semibold">{label}</span>
            </Link>
          ))}
        </div>
        <Link href="/customer/request"
          className="flex items-center justify-center gap-2 w-full py-3 bg-brand-green-500 hover:bg-brand-green-600 text-white rounded-xl text-sm font-bold transition-colors">
          <Plus size={16} /> Request a Delivery
        </Link>
      </div>

      {/* Recent orders */}
      <div className="bg-card rounded-2xl border shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">Recent Orders</h3>
          <Link href="/customer/orders" className="text-xs text-brand-green-600 hover:underline flex items-center gap-1">View all <ChevronRight size={12} /></Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <Package size={36} className="mx-auto mb-2 opacity-30" />
            <p className="font-medium">No orders yet</p>
            <p className="text-sm">Request your first delivery above</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((o: any) => (
              <Link key={o.id} href={`/customer/track?id=${o.id}`}
                className="flex items-center justify-between py-2 border-b last:border-0 hover:bg-muted/40 -mx-2 px-2 rounded-lg transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin size={11} className="text-brand-green-500 flex-shrink-0" />
                    <span className="truncate">{o.pickupAddress}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium mt-0.5">
                    <Navigation size={11} className="text-red-500 flex-shrink-0" />
                    <span className="truncate">{o.destinationAddress}</span>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Clock size={11} /> {new Date(o.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right flex flex-col items-end gap-1 ml-3 flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ORDER_STATUS_COLORS[o.status] ?? 'bg-gray-100 text-gray-600'}`}>{o.status.replace(/_/g, ' ')}</span>
                  <span className="text-xs font-semibold">{formatCurrency(o.totalAmount)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
