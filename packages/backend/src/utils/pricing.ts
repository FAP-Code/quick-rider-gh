import { PricingConfig } from '@prisma/client';

export interface PricingBreakdown {
  baseFare: number;
  distanceFee: number;
  timeFee: number;
  platformFee: number;
  totalAmount: number;
  estimatedDurationMinutes: number;
}

export function calculateFare(
  distanceKm: number,
  estimatedMinutes: number,
  config: PricingConfig
): PricingBreakdown {
  const base = Number(config.baseFare);
  const distanceFee = distanceKm * Number(config.perKmRate);
  const timeFee = estimatedMinutes * Number(config.perMinuteRate);
  const surge = Number(config.surgeMultiplier);
  const subtotal = Math.max((base + distanceFee + timeFee) * surge, Number(config.minimumFare));
  const platformFee = subtotal * (Number(config.platformFeePercent) / 100);
  const total = subtotal + platformFee;

  return {
    baseFare: +base.toFixed(2),
    distanceFee: +distanceFee.toFixed(2),
    timeFee: +timeFee.toFixed(2),
    platformFee: +platformFee.toFixed(2),
    totalAmount: +total.toFixed(2),
    estimatedDurationMinutes: estimatedMinutes,
  };
}

// Haversine formula — distance between two lat/lng points in km
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

// Rough time estimate: avg motorcycle speed 30 km/h in Accra traffic
export function estimateDuration(distanceKm: number): number {
  return Math.ceil((distanceKm / 30) * 60);
}
