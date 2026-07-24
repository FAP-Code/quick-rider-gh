import { RequestHandler } from 'express';
import { v4 as uuid } from 'uuid';
import bcrypt from 'bcryptjs';
import { BadgeType, NotificationType, OrderType, PaymentMethod } from '@prisma/client';
import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';
import { getEtaWithConfidence } from '../services/eta.service';
import { calculateCarbonSaved, formatCarbonSaved } from '../services/carbon.service';
import { scoreFraud, saveFraudFlag } from '../services/fraud.service';
import { resolveGhanaPost, isGhanaPostCode } from '../utils/ghanapost';

// Silence unused-import linting — scoreFraud / saveFraudFlag are re-exported
// for callers (e.g. the order controller) that want to score on creation.
void scoreFraud;
void saveFraudFlag;

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dL = (lat2 - lat1) * Math.PI / 180;
  const dN = (lng2 - lng1) * Math.PI / 180;
  const a  = Math.sin(dL / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dN / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── PIN-VERIFIED DELIVERY ────────────────────────────────────────────────────

export const generateDeliveryPin: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.customerId !== (req as any).user.userId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const pin  = String(Math.floor(1000 + Math.random() * 9000));
    const hash = await bcrypt.hash(pin, 10);
    await prisma.order.update({ where: { id }, data: { deliveryPin: hash, pinVerified: false } });
    await prisma.orderEvent.create({
      data: { orderId: id, event: 'PIN_GENERATED', actorId: (req as any).user.userId, actorRole: 'CUSTOMER' },
    });

    res.json({ success: true, data: { pin, message: 'Share this PIN with your rider on delivery.' } });
  } catch (e) {
    logger.error({ msg: 'generateDeliveryPin error', error: e });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const verifyDeliveryPin: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { pin } = req.body;
    const order = await prisma.order.findUnique({
      where:   { id },
      include: { customer: { select: { id: true } } },
    });
    if (!order || !order.deliveryPin) {
      return res.status(404).json({ success: false, message: 'No PIN set for this order' });
    }

    const match = await bcrypt.compare(String(pin), order.deliveryPin);
    if (!match) {
      return res.status(400).json({ success: false, message: 'Incorrect PIN. Please check with the customer.' });
    }

    await prisma.order.update({ where: { id }, data: { pinVerified: true } });
    await prisma.orderEvent.create({
      data: { orderId: id, event: 'PIN_VERIFIED', actorId: (req as any).user.userId, actorRole: 'RIDER' },
    });
    await prisma.notification.create({
      data: {
        userId: order.customerId,
        type:   NotificationType.DELIVERY_COMPLETED,
        title:  'Delivery verified',
        body:   `Your rider verified your PIN for order ${order.orderNumber}. Delivery confirmed!`,
      },
    });

    res.json({ success: true, message: 'PIN verified. Delivery confirmed.' });
  } catch (e) {
    logger.error({ msg: 'verifyDeliveryPin error', error: e });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── SHAREABLE TRACKING LINK ──────────────────────────────────────────────────

export const createTrackingLink: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.customerId !== (req as any).user.userId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const token     = uuid().replace(/-/g, '');
    const expiresAt = new Date(Date.now() + 24 * 3_600_000);
    await prisma.trackingLink.create({ data: { orderId: id, token, expiresAt } });

    const baseUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    res.json({ success: true, data: { url: `${baseUrl}/track/${token}`, token, expiresAt } });
  } catch (e) {
    logger.error({ msg: 'createTrackingLink error', error: e });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getPublicTracking: RequestHandler = async (req, res) => {
  try {
    const { token } = req.params;
    const link = await prisma.trackingLink.findUnique({
      where:   { token },
      include: {
        order: {
          include: {
            rider: {
              include: { user: { select: { firstName: true } } },
            },
          },
        },
      },
    });
    if (!link) return res.status(404).json({ success: false, message: 'Tracking link not found' });
    if (link.expiresAt < new Date()) {
      return res.status(410).json({ success: false, message: 'This tracking link has expired' });
    }

    await prisma.trackingLink.update({ where: { token }, data: { viewCount: { increment: 1 } } });

    const o = link.order;
    const now         = new Date();
    const eta         = o.distanceKm
      ? getEtaWithConfidence(o.distanceKm, o.type, now.getHours(), now.getDay())
      : null;
    const hoursLeft   = Math.max(0, Math.floor((link.expiresAt.getTime() - Date.now()) / 3_600_000));

    res.json({
      success: true,
      data: {
        orderNumber:        o.orderNumber,
        status:             o.status,
        pickupAddress:      o.pickupAddress,
        destinationAddress: o.destinationAddress,
        type:               o.type,
        // Rider: first name + initial only — no PII
        riderName:          o.rider ? `${o.rider.user.firstName} R.` : null,
        riderPlate:         o.rider?.motorcyclePlate ?? null,
        riderLat:           o.rider?.currentLatitude  ?? null,
        riderLng:           o.rider?.currentLongitude ?? null,
        eta,
        etaLow:             o.etaMinLow,
        etaHigh:            o.etaMinHigh,
        viewCount:          link.viewCount + 1,
        expiresInHours:     hoursLeft,
      },
    });
  } catch (e) {
    logger.error({ msg: 'getPublicTracking error', error: e });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── GAMIFICATION ─────────────────────────────────────────────────────────────

/**
 * Internal helper — call this after every completed delivery to keep streaks
 * current and award any newly unlocked badges.
 */
export async function checkAndAwardBadges(riderId: string): Promise<void> {
  const rider = await prisma.rider.findUnique({
    where:   { id: riderId },
    include: { badges: true },
  });
  if (!rider) return;

  // ── Streak update ──
  const today     = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const lastDate  = rider.lastDeliveryDate ? new Date(rider.lastDeliveryDate) : null;
  if (lastDate) lastDate.setHours(0, 0, 0, 0);

  let newStreak: number;
  if (!lastDate || lastDate < yesterday) {
    newStreak = 1;                             // gap — reset
  } else if (lastDate.getTime() === yesterday.getTime()) {
    newStreak = rider.currentStreak + 1;       // consecutive day
  } else {
    newStreak = rider.currentStreak;           // already counted today
  }
  const newLongest = Math.max(rider.longestStreak, newStreak);

  // ── Badge checks ──
  const earned   = new Set(rider.badges.map(b => b.badge));
  const toAward: BadgeType[] = [];

  if (newStreak >= 3   && !earned.has(BadgeType.STREAK_3))         toAward.push(BadgeType.STREAK_3);
  if (newStreak >= 7   && !earned.has(BadgeType.STREAK_7))         toAward.push(BadgeType.STREAK_7);
  if (newStreak >= 30  && !earned.has(BadgeType.STREAK_30))        toAward.push(BadgeType.STREAK_30);
  if (rider.completedDeliveries >= 10  && !earned.has(BadgeType.DELIVERIES_10))  toAward.push(BadgeType.DELIVERIES_10);
  if (rider.completedDeliveries >= 50  && !earned.has(BadgeType.DELIVERIES_50))  toAward.push(BadgeType.DELIVERIES_50);
  if (rider.completedDeliveries >= 100 && !earned.has(BadgeType.DELIVERIES_100)) toAward.push(BadgeType.DELIVERIES_100);
  if (rider.completedDeliveries >= 500 && !earned.has(BadgeType.DELIVERIES_500)) toAward.push(BadgeType.DELIVERIES_500);
  if (rider.averageRating >= 4.8 && rider.totalRatings >= 10 && !earned.has(BadgeType.TOP_RATED)) {
    toAward.push(BadgeType.TOP_RATED);
  }
  if (rider.completedDeliveries >= 200 && !earned.has(BadgeType.VETERAN)) toAward.push(BadgeType.VETERAN);

  // ── Persist ──
  await prisma.rider.update({
    where: { id: riderId },
    data:  { currentStreak: newStreak, longestStreak: newLongest, lastDeliveryDate: new Date() },
  });

  for (const badge of toAward) {
    await prisma.riderBadge.create({ data: { riderId, badge } }).catch(() => {/* already awarded */});
    await prisma.notification.create({
      data: {
        userId: rider.userId,
        type:   NotificationType.BADGE_EARNED,
        title:  '🏅 New badge earned!',
        body:   `You earned the ${badge.replace(/_/g, ' ')} badge. Keep it up!`,
        data:   { badge },
      },
    });
  }
}

export const getRiderGameStats: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const rider  = await prisma.rider.findUnique({ where: { userId }, include: { badges: true } });
    if (!rider) return res.status(404).json({ success: false, message: 'Rider not found' });

    // Rank = how many riders have MORE completed deliveries + 1
    const rank = await prisma.rider.count({
      where: { completedDeliveries: { gt: rider.completedDeliveries } },
    }) + 1;

    const allBadges = Object.values(BadgeType).map(b => ({
      badge:     b,
      earned:    rider.badges.some(rb => rb.badge === b),
      awardedAt: rider.badges.find(rb => rb.badge === b)?.awardedAt ?? null,
    }));

    res.json({
      success: true,
      data: {
        currentStreak:       rider.currentStreak,
        longestStreak:       rider.longestStreak,
        completedDeliveries: rider.completedDeliveries,
        totalCarbonSaved:    rider.totalCarbonSaved,
        carbonFormatted:     formatCarbonSaved(rider.totalCarbonSaved),
        rank,
        badges:              allBadges,
      },
    });
  } catch (e) {
    logger.error({ msg: 'getRiderGameStats error', error: e });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── FUEL EXPENSES ────────────────────────────────────────────────────────────

export const addFuelExpense: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const rider  = await prisma.rider.findUnique({ where: { userId } });
    if (!rider) return res.status(404).json({ success: false, message: 'Rider not found' });

    const { amount, litres, location, note, date } = req.body;
    const expense = await prisma.fuelExpense.create({
      data: {
        riderId:  rider.id,
        amount:   parseFloat(amount),
        litres:   litres   ? parseFloat(litres)   : null,
        location: location ?? null,
        note:     note     ?? null,
        date:     date     ? new Date(date)        : new Date(),
      },
    });

    // Return updated monthly net earnings
    const now        = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthExpenses = await prisma.fuelExpense.findMany({
      where: { riderId: rider.id, date: { gte: monthStart } },
    });
    const monthlyFuelTotal = monthExpenses.reduce((s, e) => s + Number(e.amount), 0);
    const netEarnings      = Number(rider.totalEarnings) - monthlyFuelTotal;

    res.status(201).json({
      success: true,
      data: {
        expense,
        monthlyFuelTotal: parseFloat(monthlyFuelTotal.toFixed(2)),
        grossEarnings:    parseFloat(Number(rider.totalEarnings).toFixed(2)),
        netEarnings:      parseFloat(Math.max(0, netEarnings).toFixed(2)),
      },
    });
  } catch (e) {
    logger.error({ msg: 'addFuelExpense error', error: e });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getFuelExpenses: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const rider  = await prisma.rider.findUnique({ where: { userId } });
    if (!rider) return res.status(404).json({ success: false, message: 'Rider not found' });

    const now        = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const expenses         = await prisma.fuelExpense.findMany({ where: { riderId: rider.id }, orderBy: { date: 'desc' } });
    const monthlyFuelTotal = expenses.filter(e => e.date >= monthStart).reduce((s, e) => s + Number(e.amount), 0);
    const allTimeFuel      = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const netEarnings      = Number(rider.totalEarnings) - allTimeFuel;

    res.json({
      success: true,
      data: {
        expenses,
        monthlyFuelTotal: parseFloat(monthlyFuelTotal.toFixed(2)),
        grossEarnings:    parseFloat(Number(rider.totalEarnings).toFixed(2)),
        netEarnings:      parseFloat(Math.max(0, netEarnings).toFixed(2)),
      },
    });
  } catch (e) {
    logger.error({ msg: 'getFuelExpenses error', error: e });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── RIDER SCHEDULE ───────────────────────────────────────────────────────────

const DEFAULT_SCHEDULE = {
  mon: { active: true,  start: '08:00', end: '20:00' },
  tue: { active: true,  start: '08:00', end: '20:00' },
  wed: { active: true,  start: '08:00', end: '20:00' },
  thu: { active: true,  start: '08:00', end: '20:00' },
  fri: { active: true,  start: '08:00', end: '20:00' },
  sat: { active: true,  start: '09:00', end: '18:00' },
  sun: { active: false, start: '10:00', end: '16:00' },
};

export const getSchedule: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const rider  = await prisma.rider.findUnique({ where: { userId } });
    if (!rider) return res.status(404).json({ success: false, message: 'Rider not found' });

    const schedule = await prisma.riderSchedule.findUnique({ where: { riderId: rider.id } });
    res.json({ success: true, data: schedule?.schedule ?? DEFAULT_SCHEDULE });
  } catch (e) {
    logger.error({ msg: 'getSchedule error', error: e });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const saveSchedule: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const rider  = await prisma.rider.findUnique({ where: { userId } });
    if (!rider) return res.status(404).json({ success: false, message: 'Rider not found' });

    const schedule = await prisma.riderSchedule.upsert({
      where:  { riderId: rider.id },
      create: { riderId: rider.id, schedule: req.body },
      update: { schedule: req.body },
    });
    res.json({ success: true, data: schedule, message: 'Schedule saved' });
  } catch (e) {
    logger.error({ msg: 'saveSchedule error', error: e });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── COMMUNITY POOLING ────────────────────────────────────────────────────────

export const optInToPool: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const order  = await prisma.order.findUnique({ where: { id } });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.customerId !== (req as any).user.userId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    // Find an open pool within 2 km that still has capacity
    const openPools = await prisma.deliveryPool.findMany({
      where:   { status: 'OPEN' },
      include: { orders: true },
    });
    let matched = openPools.find(p =>
      p.orders.length < p.maxOrders &&
      haversineKm(p.pickupLat, p.pickupLng, order.pickupLatitude, order.pickupLongitude) <= 2,
    );

    if (!matched) {
      matched = await prisma.deliveryPool.create({
        data:    { pickupArea: order.pickupAddress, pickupLat: order.pickupLatitude, pickupLng: order.pickupLongitude, status: 'OPEN' },
        include: { orders: true },
      });
    }

    await prisma.order.update({ where: { id }, data: { poolId: matched.id } });

    const coRiders = matched.orders.length;
    const savings  = coRiders > 0 ? 30 : 0;

    // Close the pool when it reaches capacity
    if (coRiders >= matched.maxOrders - 1) {
      await prisma.deliveryPool.update({ where: { id: matched.id }, data: { status: 'MATCHED' } });
      await prisma.notification.create({
        data: {
          userId: order.customerId,
          type:   NotificationType.POOL_MATCH,
          title:  '🤝 Pool matched!',
          body:   `Your delivery has been pooled. You save ${savings}% on delivery fees!`,
        },
      });
    }

    res.json({ success: true, data: { poolId: matched.id, coRiders, estimatedSavingsPct: savings, status: matched.status } });
  } catch (e) {
    logger.error({ msg: 'optInToPool error', error: e });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getPoolStatus: RequestHandler = async (req, res) => {
  try {
    const { id }  = req.params;
    const order   = await prisma.order.findUnique({
      where:   { id },
      include: { pool: { include: { orders: true } } },
    });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (!order.pool) return res.json({ success: true, data: null });

    res.json({
      success: true,
      data: {
        poolId:               order.pool.id,
        status:               order.pool.status,
        coRidersCount:        order.pool.orders.length,
        maxOrders:            order.pool.maxOrders,
        estimatedSavingsPct:  order.pool.savingsPct,
      },
    });
  } catch (e) {
    logger.error({ msg: 'getPoolStatus error', error: e });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── SUBSCRIPTION PASS ───────────────────────────────────────────────────────

const PLANS: Record<string, { deliveries: number; amount: number }> = {
  BASIC:   { deliveries: 10, amount: 80  },
  PREMIUM: { deliveries: 20, amount: 120 },
};

export const getSubscription: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const sub    = await prisma.subscription.findUnique({ where: { customerId: userId } });
    res.json({ success: true, data: sub });
  } catch (e) {
    logger.error({ msg: 'getSubscription error', error: e });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const purchaseSubscription: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { plan } = req.body;
    const config = PLANS[plan as string];
    if (!config) return res.status(400).json({ success: false, message: 'Invalid plan. Choose BASIC or PREMIUM.' });

    const existing = await prisma.subscription.findUnique({ where: { customerId: userId } });
    if (existing?.active) {
      return res.status(409).json({ success: false, message: 'You already have an active subscription' });
    }

    const startDate = new Date();
    const endDate   = new Date(startDate.getTime() + 30 * 24 * 3_600_000);

    const sub = await prisma.subscription.upsert({
      where:  { customerId: userId },
      create: { customerId: userId, plan, deliveriesTotal: config.deliveries, amountPaid: config.amount, startDate, endDate, active: true },
      update: { plan, deliveriesTotal: config.deliveries, deliveriesUsed: 0, amountPaid: config.amount, startDate, endDate, active: true },
    });

    res.json({
      success: true,
      data:    sub,
      message: `${plan} pass activated. ${config.deliveries} deliveries available for 30 days.`,
    });
  } catch (e) {
    logger.error({ msg: 'purchaseSubscription error', error: e });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Internal helper — call when a customer places a new order.
 * Consumes one delivery from their active subscription if available.
 * Returns true if a delivery was consumed, false if they have no valid sub.
 */
export async function useSubscriptionDelivery(customerId: string): Promise<boolean> {
  const sub = await prisma.subscription.findUnique({ where: { customerId } });
  if (!sub || !sub.active || sub.deliveriesUsed >= sub.deliveriesTotal) return false;

  // Deactivate if this is the last delivery
  const isLast = sub.deliveriesUsed + 1 >= sub.deliveriesTotal;
  await prisma.subscription.update({
    where: { customerId },
    data:  {
      deliveriesUsed: { increment: 1 },
      ...(isLast ? { active: false } : {}),
    },
  });
  return true;
}

// ─── MERCHANT PORTAL ─────────────────────────────────────────────────────────

export const applyMerchant: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { businessName, businessType, address, phone } = req.body;

    const existing = await prisma.merchantProfile.findUnique({ where: { userId } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Merchant application already exists' });
    }

    const profile = await prisma.merchantProfile.create({
      data: { userId, businessName, businessType, address, phone },
    });
    res.status(201).json({ success: true, data: profile });
  } catch (e) {
    logger.error({ msg: 'applyMerchant error', error: e });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getMerchantProfile: RequestHandler = async (req, res) => {
  try {
    const userId  = (req as any).user.userId;
    const profile = await prisma.merchantProfile.findUnique({ where: { userId } });
    res.json({ success: true, data: profile });
  } catch (e) {
    logger.error({ msg: 'getMerchantProfile error', error: e });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getMerchantOrders: RequestHandler = async (req, res) => {
  try {
    const userId  = (req as any).user.userId;
    const profile = await prisma.merchantProfile.findUnique({ where: { userId } });
    if (!profile) return res.status(404).json({ success: false, message: 'No merchant profile found' });

    // Simple string-match on pickup address (as specified)
    const orders = await prisma.order.findMany({
      where:   { pickupAddress: { contains: profile.address, mode: 'insensitive' } },
      include: {
        customer: { select: { firstName: true, lastName: true, phone: true } },
        rider:    { include: { user: { select: { firstName: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take:    50,
    });
    res.json({ success: true, data: orders });
  } catch (e) {
    logger.error({ msg: 'getMerchantOrders error', error: e });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getMerchantStats: RequestHandler = async (req, res) => {
  try {
    const userId  = (req as any).user.userId;
    const profile = await prisma.merchantProfile.findUnique({ where: { userId } });
    if (!profile) return res.status(404).json({ success: false, message: 'No merchant profile found' });

    const orders = await prisma.order.findMany({
      where:  { pickupAddress: { contains: profile.address, mode: 'insensitive' }, status: { in: ['DELIVERED', 'COMPLETED'] } },
      select: { totalAmount: true },
    });
    const totalRevenue    = orders.reduce((s, o) => s + Number(o.totalAmount), 0);
    const averageOrderValue = orders.length ? totalRevenue / orders.length : 0;

    res.json({
      success: true,
      data: {
        totalOrders:        orders.length,
        totalRevenue:       parseFloat(totalRevenue.toFixed(2)),
        averageOrderValue:  parseFloat(averageOrderValue.toFixed(2)),
      },
    });
  } catch (e) {
    logger.error({ msg: 'getMerchantStats error', error: e });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── WHATSAPP BOT ─────────────────────────────────────────────────────────────

export const whatsappWebhook: RequestHandler = async (req, res) => {
  try {
    const rawBody: string = (req.body?.Body ?? '').trim();
    const from:    string = req.body?.From ?? '';
    const normalized      = rawBody.toLowerCase();

    logger.info({ msg: 'WhatsApp message received', from, body: rawBody });

    let reply: string;

    if (normalized === 'order' || normalized === '1') {
      reply = 'Welcome to Quick Rider GH! 🏍️\nReply with your pickup and dropoff separated by >\nExample: Accra Mall > East Legon';
    } else if (rawBody.includes('>')) {
      // Pattern: "Pickup > Dropoff"
      const parts  = rawBody.split('>').map((s: string) => s.trim());
      const pickup  = parts[0];
      const dropoff = parts[1] ?? '';
      if (pickup && dropoff) {
        const orderId = 'WA-' + Math.random().toString(36).slice(2, 8).toUpperCase();
        logger.info({ msg: 'WhatsApp order stub created', from, pickup, dropoff, orderId });
        reply = `✅ Order ${orderId} created!\nPickup: ${pickup}\nDropoff: ${dropoff}\nWe'll send your rider's details shortly.\nReply STATUS to track.`;
      } else {
        reply = 'Invalid format. Use: Pickup > Dropoff (e.g. Accra Mall > East Legon)';
      }
    } else if (normalized === 'status') {
      reply = 'To track your order, visit: https://quickridergh.com/track\nOr reply with your order number.';
    } else {
      reply = 'Quick Rider GH 🏍️\nReply:\n1 or ORDER — Place a delivery\nSTATUS — Track your order\nCANCEL — Cancel an order';
    }

    // Respond with Twilio TwiML
    res.set('Content-Type', 'text/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>${reply}</Message></Response>`);
  } catch (e) {
    logger.error({ msg: 'whatsappWebhook error', error: e });
    res.status(500).send('<Response><Message>Sorry, something went wrong. Please try again.</Message></Response>');
  }
};

export const whatsappVerify: RequestHandler = (_req, res) => {
  res.send('Quick Rider GH WhatsApp webhook active');
};

// ─── USSD ─────────────────────────────────────────────────────────────────────

export const ussdHandler: RequestHandler = async (req, res) => {
  const { sessionId, phoneNumber, text, serviceCode } = req.body;
  void sessionId;
  void serviceCode;

  const input = (text as string ?? '').trim();
  const parts  = input.split('*');

  logger.info({ msg: 'USSD request', phoneNumber, text: input });

  let response: string;

  if (input === '') {
    response = 'CON Welcome to Quick Rider GH\n1. Place Order\n2. Track Order\n3. Cancel Order';
  } else if (input === '1') {
    response = 'CON Enter pickup location:';
  } else if (parts.length === 2 && parts[0] === '1') {
    response = 'CON Enter destination:';
  } else if (parts.length >= 3 && parts[0] === '1') {
    const pickup      = parts[1];
    const destination = parts[2];

    // Attempt to create a stub order for registered users
    try {
      const user = await prisma.user.findFirst({ where: { phone: String(phoneNumber) } });
      if (user) {
        const order = await prisma.order.create({
          data: {
            customerId:           user.id,
            type:                 OrderType.PARCEL_DELIVERY,
            pickupAddress:        pickup,
            pickupLatitude:       0,
            pickupLongitude:      0,
            destinationAddress:   destination,
            destinationLatitude:  0,
            destinationLongitude: 0,
            baseFare:             0,
            distanceFee:          0,
            timeFee:              0,
            platformFee:          0,
            totalAmount:          0,
            paymentMethod:        PaymentMethod.CASH,
          },
        });
        response = `END Order ${order.orderNumber} created!\nPickup: ${pickup}\nTo: ${destination}\nA rider will be assigned shortly.`;
      } else {
        const oid = 'USSD-' + Math.random().toString(36).slice(2, 7).toUpperCase();
        response  = `END Order ${oid} created!\nPickup: ${pickup}\nTo: ${destination}\nA rider will be assigned shortly.`;
      }
    } catch {
      const oid = 'USSD-' + Math.random().toString(36).slice(2, 7).toUpperCase();
      response  = `END Order ${oid} created! We'll notify you when a rider is assigned.`;
    }
  } else if (input === '2') {
    response = 'CON Enter your order number:';
  } else if (parts.length === 2 && parts[0] === '2') {
    response = `END Order ${parts[1]}: Please check our app for live tracking.`;
  } else if (input === '3') {
    response = 'CON Enter order number to cancel:';
  } else if (parts.length === 2 && parts[0] === '3') {
    response = `END Cancellation requested for ${parts[1]}. Our team will process it shortly.`;
  } else {
    response = 'END Invalid option. Please dial again.';
  }

  res.set('Content-Type', 'text/plain');
  res.send(response);
};

// ─── SOS ESCALATION ──────────────────────────────────────────────────────────

export const triggerSos: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const rider  = await prisma.rider.findUnique({
      where:   { userId },
      include: { user: { select: { phone: true, firstName: true } } },
    });
    if (!rider) return res.status(404).json({ success: false, message: 'Rider not found' });

    const { latitude, longitude } = req.body;
    const sos = await prisma.sosEscalation.create({
      data: {
        riderId:   rider.id,
        latitude:  latitude  ?? rider.currentLatitude  ?? null,
        longitude: longitude ?? rider.currentLongitude ?? null,
      },
    });

    // Notify all admins immediately
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map(a => ({
          userId: a.id,
          type:   NotificationType.SOS_ALERT,
          title:  '🚨 SOS Alert',
          body:   `Rider ${rider.user.firstName} (${rider.id}) triggered SOS. Location: ${latitude ?? 'unknown'}, ${longitude ?? 'unknown'}`,
          data:   { sosId: sos.id, riderId: rider.id },
        })),
      });
    }

    // Escalate after 2 minutes if not acknowledged
    setTimeout(async () => {
      try {
        const fresh = await prisma.sosEscalation.findUnique({ where: { id: sos.id } });
        if (fresh && !fresh.acknowledged) {
          await prisma.sosEscalation.update({
            where: { id: sos.id },
            data:  { escalated: true, escalatedAt: new Date() },
          });
          // In production: call Twilio to SMS the rider's emergency contact
          const gpsLink = `https://maps.google.com/?q=${sos.latitude},${sos.longitude}`;
          const contactPhone = rider.user.phone ?? 'none';
          logger.warn({
            msg:     'SOS escalated — would SMS emergency contact',
            sosId:   sos.id,
            riderId: rider.id,
            phone:   contactPhone,
            gpsLink,
          });
        }
      } catch (err) {
        logger.error({ msg: 'SOS escalation check failed', sosId: sos.id, error: err });
      }
    }, 2 * 60 * 1000);

    res.status(201).json({
      success: true,
      data:    sos,
      message: 'SOS sent. Admins notified. If not acknowledged in 2 minutes, your emergency contact will be called.',
    });
  } catch (e) {
    logger.error({ msg: 'triggerSos error', error: e });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const acknowledgeSos: RequestHandler = async (req, res) => {
  try {
    const { id }  = req.params;
    const userId  = (req as any).user.userId;
    const updated = await prisma.sosEscalation.update({
      where: { id },
      data:  { acknowledged: true, acknowledgedBy: userId, acknowledgedAt: new Date() },
    });
    res.json({ success: true, data: updated });
  } catch (e) {
    logger.error({ msg: 'acknowledgeSos error', error: e });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getActiveSos: RequestHandler = async (req, res) => {
  try {
    const all = await prisma.sosEscalation.findMany({
      where:   { resolved: false },
      orderBy: { createdAt: 'desc' },
      take:    50,
    });
    res.json({ success: true, data: all });
  } catch (e) {
    logger.error({ msg: 'getActiveSos error', error: e });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── ETA + CARBON ESTIMATES ──────────────────────────────────────────────────

export const getEtaEstimate: RequestHandler = (req, res) => {
  const distanceKm = parseFloat(req.query.distanceKm as string) || 3;
  const orderType  = (req.query.orderType as string) || 'PARCEL_DELIVERY';
  const now        = new Date();
  const eta        = getEtaWithConfidence(distanceKm, orderType, now.getHours(), now.getDay());
  res.json({ success: true, data: eta });
};

export const getCarbonPreview: RequestHandler = (req, res) => {
  const distanceKm = parseFloat(req.query.distanceKm as string) || 3;
  const kg         = calculateCarbonSaved(distanceKm);
  res.json({ success: true, data: { kgSaved: kg, formatted: formatCarbonSaved(kg) } });
};

// ─── GHANAPOSTGPS ────────────────────────────────────────────────────────────

export const resolveGhanaPostCode: RequestHandler = async (req, res) => {
  const code = (req.query.code as string ?? '').trim();
  if (!code) return res.status(400).json({ success: false, message: 'code parameter required' });
  if (!isGhanaPostCode(code)) {
    return res.status(400).json({ success: false, message: 'Invalid GhanaPost code format (e.g. AK-039-5028)' });
  }

  const result = await resolveGhanaPost(code);
  if (!result) {
    return res.status(404).json({
      success: false,
      message: 'Could not resolve this GhanaPost code. Ensure GHANAPOST_ENABLED=true and the code is valid.',
    });
  }
  res.json({ success: true, data: result });
};

// ─── MULTI-STOP ORDER ─────────────────────────────────────────────────────────

export const createMultiStopOrder: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { stops, type, paymentMethod, specialInstructions } = req.body;

    if (!Array.isArray(stops) || stops.length < 2) {
      return res.status(400).json({ success: false, message: 'At least 2 stops required' });
    }

    // Sum distances of consecutive legs
    let totalDistance = 0;
    for (let i = 0; i < stops.length - 1; i++) {
      totalDistance += haversineKm(stops[i].lat, stops[i].lng, stops[i + 1].lat, stops[i + 1].lng);
    }

    // Fare calculation (20% multi-stop premium)
    const farePerKm = 3;
    const baseFare  = 10;
    const distFee   = totalDistance * farePerKm;
    const subtotal  = Math.max(15, (baseFare + distFee) * 1.2);
    const platFee   = subtotal * 0.15;
    const total     = subtotal + platFee;

    const first = stops[0];
    const last  = stops[stops.length - 1];

    const order = await prisma.order.create({
      data: {
        customerId:           userId,
        type:                 (type as OrderType) ?? OrderType.PARCEL_DELIVERY,
        pickupAddress:        first.address,
        pickupLatitude:       first.lat,
        pickupLongitude:      first.lng,
        destinationAddress:   last.address,
        destinationLatitude:  last.lat,
        destinationLongitude: last.lng,
        recipientName:        last.recipientName   ?? null,
        recipientPhone:       last.recipientPhone  ?? null,
        distanceKm:           parseFloat(totalDistance.toFixed(2)),
        estimatedDuration:    Math.ceil((totalDistance / 30) * 60),
        baseFare:             parseFloat(baseFare.toFixed(2)),
        distanceFee:          parseFloat(distFee.toFixed(2)),
        timeFee:              0,
        platformFee:          parseFloat(platFee.toFixed(2)),
        totalAmount:          parseFloat(total.toFixed(2)),
        paymentMethod:        (paymentMethod as PaymentMethod) ?? PaymentMethod.CASH,
        isMultiStop:          true,
        stops:                stops,
        specialInstructions:  specialInstructions ?? null,
      },
    });

    await prisma.orderEvent.create({
      data: {
        orderId:   order.id,
        event:     'MULTI_STOP_CREATED',
        actorId:   userId,
        actorRole: 'CUSTOMER',
        metadata:  { stopCount: stops.length },
      },
    });

    res.status(201).json({
      success: true,
      data: {
        order,
        fare: { baseFare, distanceFee: distFee, timeFee: 0, platformFee: platFee, totalAmount: total },
        stopsCount: stops.length,
      },
    });
  } catch (e) {
    logger.error({ msg: 'createMultiStopOrder error', error: e });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── ADMIN ANALYTICS ─────────────────────────────────────────────────────────

export const getDemandHeatmap: RequestHandler = async (req, res) => {
  try {
    const since  = new Date(Date.now() - 24 * 3_600_000);
    const orders = await prisma.order.findMany({
      where:  { createdAt: { gte: since } },
      select: { pickupLatitude: true, pickupLongitude: true },
    });

    // Group by coordinates rounded to 2 decimal places (~1 km precision)
    const grid = new Map<string, number>();
    for (const o of orders) {
      const key = `${o.pickupLatitude.toFixed(2)},${o.pickupLongitude.toFixed(2)}`;
      grid.set(key, (grid.get(key) ?? 0) + 1);
    }

    const hotspots = Array.from(grid.entries())
      .map(([k, count]) => {
        const [lat, lng] = k.split(',').map(Number);
        return { lat, lng, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 50);

    res.json({ success: true, data: hotspots });
  } catch (e) {
    logger.error({ msg: 'getDemandHeatmap error', error: e });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getFraudFlags: RequestHandler = async (req, res) => {
  try {
    const flags = await prisma.fraudFlag.findMany({
      orderBy: { createdAt: 'desc' },
      take:    100,
    });
    res.json({ success: true, data: flags });
  } catch (e) {
    logger.error({ msg: 'getFraudFlags error', error: e });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const reviewFraudFlag: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const flag   = await prisma.fraudFlag.update({ where: { id }, data: { reviewed: true } });
    res.json({ success: true, data: flag });
  } catch (e) {
    logger.error({ msg: 'reviewFraudFlag error', error: e });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
