import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  FlatList,
  Alert,
  SafeAreaView,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/auth.store';
import { COLORS, SHADOW } from '../../utils/theme';

const SERVICE_TYPES = [
  { type: 'PARCEL_DELIVERY',    icon: '📦', label: 'Parcel' },
  { type: 'FOOD_PICKUP',        icon: '🍱', label: 'Food' },
  { type: 'SHOPPING_ASSISTANCE',icon: '🛒', label: 'Shopping' },
  { type: 'DOCUMENT_DELIVERY',  icon: '📄', label: 'Document' },
  { type: 'PERSONAL_ERRAND',    icon: '🏃', label: 'Errand' },
];

interface Rider {
  id: string;
  currentLatitude: number;
  currentLongitude: number;
  distanceKm: number;
  averageRating: number;
  user: { firstName: string; lastName: string; profilePhotoUrl?: string };
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const mapRef = useRef<MapView>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location access is needed to find nearby riders.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    })();
  }, []);

  const { data: nearbyRiders } = useQuery<{ data: Rider[] }>({
    queryKey: ['nearby-riders', location?.latitude, location?.longitude],
    queryFn: () =>
      api.get(
        `/riders/nearby?lat=${location!.latitude}&lng=${location!.longitude}&radius=10`
      ),
    enabled: !!location,
    refetchInterval: 30_000,
  });

  const { data: recentOrders } = useQuery<{ data: any[] }>({
    queryKey: ['my-orders'],
    queryFn: () => api.get('/orders?limit=5'),
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          provider={PROVIDER_GOOGLE}
          showsUserLocation
          initialRegion={{
            latitude: location?.latitude ?? 5.6037,
            longitude: location?.longitude ?? -0.187,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          {nearbyRiders?.data.map((r) => (
            <Marker
              key={r.id}
              coordinate={{ latitude: r.currentLatitude, longitude: r.currentLongitude }}
              title={`${r.user.firstName} ${r.user.lastName}`}
              description={`⭐ ${r.averageRating.toFixed(1)} · ${r.distanceKm.toFixed(1)} km away`}
            >
              <View style={styles.riderMarker}>
                <Text style={{ fontSize: 20 }}>🏍️</Text>
              </View>
            </Marker>
          ))}
        </MapView>

        {/* Greeting overlay */}
        <View style={styles.greetingCard}>
          <Text style={styles.greeting}>Hello, {user?.firstName}! 👋</Text>
          <Text style={styles.riderCount}>
            {nearbyRiders?.data.length ?? 0} riders nearby
          </Text>
        </View>
      </View>

      {/* Bottom sheet */}
      <View style={styles.sheet}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Service type selection */}
          <Text style={styles.sectionTitle}>What do you need?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.servicesRow}>
            {SERVICE_TYPES.map((s) => (
              <TouchableOpacity
                key={s.type}
                style={styles.serviceCard}
                onPress={() =>
                  router.push({ pathname: '/(customer)/request', params: { type: s.type } })
                }
              >
                <Text style={styles.serviceIcon}>{s.icon}</Text>
                <Text style={styles.serviceLabel}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Quick request */}
          <TouchableOpacity
            style={styles.quickRequestBtn}
            onPress={() => router.push('/(customer)/request')}
          >
            <Text style={styles.quickRequestText}>📍  Where should we go?</Text>
          </TouchableOpacity>

          {/* Recent orders */}
          {recentOrders?.data && recentOrders.data.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Recent Orders</Text>
              {recentOrders.data.slice(0, 3).map((order: any) => (
                <TouchableOpacity
                  key={order.id}
                  style={styles.orderCard}
                  onPress={() => router.push({ pathname: '/(customer)/order', params: { id: order.id } })}
                >
                  <View>
                    <Text style={styles.orderNum}>#{order.orderNumber.slice(-8).toUpperCase()}</Text>
                    <Text style={styles.orderAddr} numberOfLines={1}>{order.destinationAddress}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: order.status === 'COMPLETED' ? '#d1fae5' : '#fef3c7' }]}>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: order.status === 'COMPLETED' ? '#065f46' : '#92400e' }}>
                      {order.status}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  mapContainer: { height: '45%' },
  riderMarker: { backgroundColor: '#fff', borderRadius: 20, padding: 4, ...SHADOW.md },
  greetingCard: {
    position: 'absolute', top: 16, left: 16, right: 16,
    backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 14, padding: 14,
    ...SHADOW.md,
  },
  greeting: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  riderCount: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  sheet: { flex: 1, backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -20, padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  servicesRow: { marginBottom: 16 },
  serviceCard: {
    alignItems: 'center', backgroundColor: COLORS.bg, borderRadius: 14, padding: 14,
    marginRight: 10, width: 80, borderWidth: 1, borderColor: COLORS.border,
  },
  serviceIcon: { fontSize: 28 },
  serviceLabel: { fontSize: 11, fontWeight: '600', color: COLORS.text, marginTop: 6 },
  quickRequestBtn: {
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 14,
    padding: 16, marginBottom: 4,
  },
  quickRequestText: { fontSize: 15, color: COLORS.textMuted },
  orderCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.bg, borderRadius: 12, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: COLORS.border,
  },
  orderNum: { fontSize: 13, fontWeight: '700', color: COLORS.green },
  orderAddr: { fontSize: 12, color: COLORS.textMuted, maxWidth: 220, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
});
