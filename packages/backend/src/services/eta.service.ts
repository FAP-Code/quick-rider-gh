import { PrismaClient, OrderType } from '@prisma/client';
import { prisma as defaultPrisma } from '../config/prisma';

export interface EtaResult {
  low: number;
  high: number;
  mean: number;
  confidence: 'high' | 'medium' | 'low';
}

const RUSH_HOURS = [[7, 9], [17, 19]] as const;

function timeMultiplier(hour: number): { factor: number; label: string } {
  if (RUSH_HOURS.some(([s, e]) => hour >= s && hour < e)) return { factor: 1.4, label: 'rush hour' };
  if (hour >= 11 && hour < 14) return { factor: 1.2, label: 'midday' };
  if (hour >= 20 || hour < 6)  return { factor: 0.9, label: 'night'  };
  return { factor: 1.0, label: 'normal' };
}

const ORDER_TYPE_FACTOR: Record<string, number> = {
  PARCEL_DELIVERY:     1.0,
  FOOD_PICKUP:         1.05,
  SHOPPING_ASSISTANCE: 1.15,
  DOCUMENT_DELIVERY:   0.95,
  PERSONAL_ERRAND:     1.1,
};

export function getEtaWithConfidence(
  distanceKm: number,
  orderType: string,
  hourOfDay: number,
  dayOfWeek: number,
): EtaResult {
  // base = distanceKm * 3 + 5 minutes
  const base       = distanceKm * 3 + 5;
  const { factor } = timeMultiplier(hourOfDay);
  const typeFactor = ORDER_TYPE_FACTOR[orderType] ?? 1.0;
  // Weekend slight reduction in traffic
  const dayFactor  = dayOfWeek === 0 || dayOfWeek === 6 ? 0.95 : 1.0;

  const mean      = Math.round(base * factor * typeFactor * dayFactor);
  const bandPct   = factor >= 1.4 ? 0.30 : 0.20;   // ±30% in rush hour, ±20% otherwise
  const low       = Math.max(5, Math.round(mean * (1 - bandPct)));
  const high      = Math.round(mean * (1 + bandPct));
  const confidence: 'high' | 'medium' | 'low' =
    factor >= 1.4 ? 'low' : factor >= 1.2 ? 'medium' : 'high';

  return { low, high, mean, confidence };
}

/**
 * Records the actual delivery time for a completed order so the system can
 * learn over time. Pass a PrismaClient instance when you already have a
 * transaction open; omits the argument to use the default singleton.
 */
export async function recordEtaSample(
  orderId: string,
  actualMinutes: number,
  prismaClient: PrismaClient = defaultPrisma,
): Promise<void> {
  const order = await prismaClient.order.findUnique({ where: { id: orderId } });
  if (!order) return;

  const createdAt = order.createdAt;
  await prismaClient.etaSample.create({
    data: {
      distanceKm:    order.distanceKm ?? 3,
      hourOfDay:     createdAt.getHours(),
      dayOfWeek:     createdAt.getDay(),
      actualMinutes,
      orderType:     order.type,
    },
  });
}
