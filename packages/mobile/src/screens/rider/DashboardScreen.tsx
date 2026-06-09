import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  SafeAreaView,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/auth.store';
import { COLORS, SHADOW } from '../../utils/theme';

function formatGHS(amount: number | string): string {
  return `GHS ${Number(amount).toFixed(2)}`;
}

export default function RiderDashboard() {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const { data: profile } = useQuery<{ data: any }>({
    queryKey: ['rider-profile'],
    queryFn: () => api.get('/riders/me'),
  });

  const { data: earnings } = useQuery<{ data: any }>({
    queryKey: ['rider-earnings'],
    queryFn: () => api.get('/riders/me/earnings'),
  });

  const { data: pendingOrders } = useQuery<{ data: any[] }>({
    queryKey: ['pending-orders'],
    queryFn: () => api.get('/orders?status=PENDING'),
    refetchInterval: 10_000,
  });

  const toggleAvailability = useMutation({
    mutationFn: (status: string) => api.patch('/riders/me/availability', { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rider-profile'] }),
  });

  const acceptOrder = useMutation({
    mutationFn: (orderId: string) => api.patch(`/orders/${orderId}/accept`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pending-orders'] });
      qc.invalidateQueries({ queryKey: ['my-orders'] });
    },
  });

  const isOnline = profile?.data?.availabilityStatus === 'ONLINE';
  const riderStatus = profile?.data?.status;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.firstName}! 👋</Text>
            <Text style={styles.subtitle}>{isOnline ? '🟢 You are online' : '⚫ You are offline'}</Text>
          </View>
          {riderStatus === 'APPROVED' && (
            <Switch
              value={isOnline}
              onValueChange={(val) =>
                toggleAvailability.mutate(val ? 'ONLINE' : 'OFFLINE')
              }
              trackColor={{ false: COLORS.border, true: COLORS.green }}
              thumbColor="#fff"
            />
          )}
        </View>

        {/* Approval banner */}
        {riderStatus === 'PENDING' && (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>
              ⏳ Your account is pending admin approval. You'll be notified once approved.
            </Text>
          </View>
        )}

        {/* Earnings cards */}
        <View style={styles.earningsGrid}>
          <View style={[styles.earningCard, { backgroundColor: COLORS.green }]}>
            <Text style={styles.earningLabel}>Today</Text>
            <Text style={styles.earningValue}>{formatGHS(earnings?.data?.todayEarnings || 0)}</Text>
          </View>
          <View style={[styles.earningCard, { backgroundColor: COLORS.gold }]}>
            <Text style={[styles.earningLabel, { color: COLORS.greenDark }]}>This Week</Text>
            <Text style={[styles.earningValue, { color: COLORS.greenDark }]}>{formatGHS(earnings?.data?.weekEarnings || 0)}</Text>
          </View>
          <View style={[styles.earningCard, { backgroundColor: '#1e3a5f' }]}>
            <Text style={styles.earningLabel}>Wallet</Text>
            <Text style={styles.earningValue}>{formatGHS(earnings?.data?.walletBalance || 0)}</Text>
          </View>
          <View style={[styles.earningCard, { backgroundColor: '#374151' }]}>
            <Text style={styles.earningLabel}>Deliveries</Text>
            <Text style={styles.earningValue}>{earnings?.data?.completedDeliveries || 0}</Text>
          </View>
        </View>

        {/* Available requests */}
        {isOnline && (
          <>
            <Text style={styles.sectionTitle}>
              Available Requests ({pendingOrders?.data?.length ?? 0})
            </Text>
            {pendingOrders?.data?.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No requests right now. Stay online!</Text>
              </View>
            ) : (
              pendingOrders?.data?.map((order: any) => (
                <View key={order.id} style={styles.orderCard}>
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderType}>{order.type.replace('_', ' ')}</Text>
                    <Text style={styles.orderAddr} numberOfLines={1}>📍 {order.pickupAddress}</Text>
                    <Text style={styles.orderAddr} numberOfLines={1}>📌 {order.destinationAddress}</Text>
                    <Text style={styles.orderFare}>GHS {Number(order.totalAmount).toFixed(2)} · {order.distanceKm?.toFixed(1)} km</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.acceptBtn}
                    onPress={() => acceptOrder.mutate(order.id)}
                    disabled={acceptOrder.isPending}
                  >
                    <Text style={styles.acceptBtnText}>Accept</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greeting: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  banner: { backgroundColor: '#fffbeb', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#fde68a' },
  bannerText: { fontSize: 13, color: '#92400e', lineHeight: 19 },
  earningsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  earningCard: { width: '47%', borderRadius: 14, padding: 16, ...SHADOW.sm },
  earningLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  earningValue: { fontSize: 20, fontWeight: '800', color: '#fff' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  emptyCard: { backgroundColor: COLORS.white, borderRadius: 14, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  emptyText: { color: COLORS.textMuted, fontSize: 14 },
  orderCard: { backgroundColor: COLORS.white, borderRadius: 14, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, ...SHADOW.sm },
  orderInfo: { flex: 1, marginRight: 12 },
  orderType: { fontSize: 13, fontWeight: '700', color: COLORS.green, textTransform: 'capitalize', marginBottom: 4 },
  orderAddr: { fontSize: 12, color: COLORS.textMuted, marginBottom: 2 },
  orderFare: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginTop: 6 },
  acceptBtn: { backgroundColor: COLORS.green, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14 },
  acceptBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
