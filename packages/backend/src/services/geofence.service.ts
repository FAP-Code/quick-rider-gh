import { OrderStatus } from '@prisma/client';

const EARTH_RADIUS_M = 6_371_000;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Returns true when the rider is within `radiusM` metres of the destination,
 * using the Haversine formula for accurate great-circle distance.
 */
export function checkGeofence(
  riderLat: number,
  riderLng: number,
  destLat:  number,
  destLng:  number,
  radiusM:  number,
): boolean {
  const dLat = toRad(destLat - riderLat);
  const dLng = toRad(destLng - riderLng);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(riderLat)) * Math.cos(toRad(destLat)) * Math.sin(dLng / 2) ** 2;

  const distanceM = EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return distanceM <= radiusM;
}

/**
 * Returns true when the order is in transit and the geofence arrival alert
 * has not yet been sent — i.e. we should fire an alert right now.
 */
export function shouldAlertGeofence(order: {
  status:          string;
  geofenceAlerted: boolean;
}): boolean {
  return order.status === OrderStatus.IN_TRANSIT && !order.geofenceAlerted;
}
