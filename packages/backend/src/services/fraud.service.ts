import { PrismaClient } from '@prisma/client';

export interface FraudResult {
  score: number;
  signals: string[];
}

/**
 * Scores an order for fraud signals (0-100).
 * Automatically saves a FraudFlag record when the score reaches 40+.
 */
export async function scoreFraud(
  order: {
    id?: string;
    totalAmount: number | string;
    customerId: string;
    pickupLatitude: number;
    pickupLongitude: number;
    destinationLatitude: number;
    destinationLongitude: number;
  },
  customer: { id?: string; createdAt: Date },
  prisma: PrismaClient,
): Promise<FraudResult> {
  const signals: string[] = [];
  let score = 0;

  // +30 if account created < 24 hours ago
  const ageHours = (Date.now() - customer.createdAt.getTime()) / 3_600_000;
  if (ageHours < 24) {
    signals.push('Account created < 24 hours ago');
    score += 30;
  }

  // +20 if order amount > GHS 200
  const amount = Number(order.totalAmount);
  if (amount > 200) {
    signals.push(`High order value: GHS ${amount.toFixed(2)}`);
    score += 20;
  }

  // +15 if customer has 0 completed orders
  const completedOrders = await prisma.order.count({
    where: { customerId: order.customerId, status: { in: ['DELIVERED', 'COMPLETED'] } },
  });
  if (completedOrders === 0) {
    signals.push('No completed orders on account');
    score += 15;
  }

  // +20 if pickup and dropoff are > 50 km apart (Haversine)
  const R = 6371;
  const dLat = (order.destinationLatitude  - order.pickupLatitude)  * Math.PI / 180;
  const dLng = (order.destinationLongitude - order.pickupLongitude) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(order.pickupLatitude * Math.PI / 180)
    * Math.cos(order.destinationLatitude * Math.PI / 180)
    * Math.sin(dLng / 2) ** 2;
  const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  if (dist > 50) {
    signals.push(`Long distance order: ${dist.toFixed(0)} km`);
    score += 20;
  }

  // +15 if > 3 orders placed in last hour
  const oneHourAgo = new Date(Date.now() - 3_600_000);
  const recentOrders = await prisma.order.count({
    where: { customerId: order.customerId, createdAt: { gte: oneHourAgo } },
  });
  if (recentOrders > 3) {
    signals.push(`${recentOrders} orders placed in the last hour`);
    score += 15;
  }

  const finalScore = Math.min(100, score);

  // Auto-save a FraudFlag when the score is high enough
  if (finalScore >= 40) {
    await prisma.fraudFlag.create({
      data: {
        orderId: order.id ?? null,
        userId:  customer.id ?? order.customerId ?? null,
        score:   finalScore,
        signals,
      },
    });
  }

  return { score: finalScore, signals };
}

/**
 * Backwards-compatible helper kept so existing callers that split the
 * scoring from the flagging still compile. Prefer the new scoreFraud which
 * saves the flag automatically.
 */
export async function saveFraudFlag(
  orderId: string,
  userId: string,
  score: number,
  signals: string[],
  prisma: PrismaClient,
): Promise<void> {
  if (score >= 40) {
    await prisma.fraudFlag.create({ data: { orderId, userId, score, signals } });
  }
}

/**
 * Returns all unreviewed FraudFlag records, newest first.
 * Used by admin monitoring dashboards and the fraud service layer.
 */
export async function getFraudFlags(prisma: PrismaClient) {
  return prisma.fraudFlag.findMany({
    where:   { reviewed: false },
    orderBy: { createdAt: 'desc' },
  });
}
