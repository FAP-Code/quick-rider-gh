import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { sendSuccess, sendCreated, sendError, sendNotFound } from '../utils/response';
import {
  calculateFare,
  haversineDistance,
  estimateDuration,
} from '../utils/pricing';
import {
  notifyRiderNewOrder,
  notifyCustomerOrderAccepted,
  notifyCustomerDelivered,
} from '../services/notification.service';
import { OrderStatus, OrderType, PaymentMethod } from '@prisma/client';

// POST /orders
export async function createOrder(req: Request, res: Response): Promise<void> {
  const customerId = req.user!.userId;
  const {
    type,
    description,
    pickupAddress,
    pickupLatitude,
    pickupLongitude,
    pickupContactName,
    pickupContactPhone,
    destinationAddress,
    destinationLatitude,
    destinationLongitude,
    recipientName,
    recipientPhone,
    specialInstructions,
    paymentMethod,
  } = req.body;

  const pricing = await prisma.pricingConfig.findFirst({ where: { isActive: true } });
  if (!pricing) {
    sendError(res, 'Pricing configuration not available', 503);
    return;
  }

  const distanceKm = haversineDistance(
    pickupLatitude,
    pickupLongitude,
    destinationLatitude,
    destinationLongitude
  );
  const estimatedMinutes = estimateDuration(distanceKm);
  const fare = calculateFare(distanceKm, estimatedMinutes, pricing);

  const order = await prisma.order.create({
    data: {
      customerId,
      type: type as OrderType,
      description,
      pickupAddress,
      pickupLatitude,
      pickupLongitude,
      pickupContactName,
      pickupContactPhone,
      destinationAddress,
      destinationLatitude,
      destinationLongitude,
      recipientName,
      recipientPhone,
      specialInstructions,
      paymentMethod: (paymentMethod as PaymentMethod) || PaymentMethod.CASH,
      distanceKm,
      estimatedDuration: estimatedMinutes,
      baseFare: fare.baseFare,
      distanceFee: fare.distanceFee,
      timeFee: fare.timeFee,
      platformFee: fare.platformFee,
      totalAmount: fare.totalAmount,
    },
    include: { customer: { select: { firstName: true, lastName: true } } },
  });

  await prisma.orderStatusHistory.create({
    data: { orderId: order.id, status: OrderStatus.PENDING },
  });

  // Find nearby available riders and notify them
  const nearbyRiders = await prisma.rider.findMany({
    where: {
      status: 'APPROVED',
      availabilityStatus: 'ONLINE',
      currentLatitude: { not: null },
      currentLongitude: { not: null },
    },
    include: { user: { select: { id: true, firstName: true } } },
  });

  const withinRadius = nearbyRiders.filter((r) => {
    if (!r.currentLatitude || !r.currentLongitude) return false;
    const dist = haversineDistance(
      pickupLatitude,
      pickupLongitude,
      r.currentLatitude,
      r.currentLongitude
    );
    return dist <= 10; // 10 km radius
  });

  const customerName = `${order.customer.firstName}`;
  for (const rider of withinRadius) {
    await notifyRiderNewOrder(rider.id, order.id, customerName);
  }

  sendCreated(res, { order, fare, nearbyRidersCount: withinRadius.length });
}

// GET /orders
export async function getOrders(req: Request, res: Response): Promise<void> {
  const { userId, role } = req.user!;
  const { status, page = '1', limit = '20' } = req.query;

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  const take = parseInt(limit as string);

  const where: Record<string, unknown> = {};
  if (role === 'CUSTOMER') where.customerId = userId;
  if (role === 'RIDER') {
    const rider = await prisma.rider.findUnique({ where: { userId } });
    if (rider) where.riderId = rider.id;
  }
  if (status) where.status = status;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, firstName: true, lastName: true, profilePhotoUrl: true } },
        rider: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, profilePhotoUrl: true } },
          },
        },
      },
    }),
    prisma.order.count({ where }),
  ]);

  sendSuccess(res, orders, 'Orders retrieved', 200, {
    total,
    page: parseInt(page as string),
    limit: take,
    totalPages: Math.ceil(total / take),
  });
}

// GET /orders/:id
export async function getOrder(req: Request, res: Response): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
      customer: { select: { id: true, firstName: true, lastName: true, phone: true, profilePhotoUrl: true } },
      rider: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true, phone: true, profilePhotoUrl: true } },
        },
      },
      messages: {
        orderBy: { createdAt: 'asc' },
        include: { sender: { select: { id: true, firstName: true, profilePhotoUrl: true } } },
      },
      ratings: true,
      statusHistory: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!order) {
    sendNotFound(res, 'Order not found');
    return;
  }

  sendSuccess(res, order);
}

// PATCH /orders/:id/accept
export async function acceptOrder(req: Request, res: Response): Promise<void> {
  const rider = await prisma.rider.findUnique({ where: { userId: req.user!.userId } });
  if (!rider) {
    sendError(res, 'Rider profile not found', 404);
    return;
  }

  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order || order.status !== OrderStatus.PENDING) {
    sendError(res, 'Order is not available for acceptance');
    return;
  }

  const updated = await prisma.order.update({
    where: { id: req.params.id },
    data: { riderId: rider.id, status: OrderStatus.ACCEPTED, acceptedAt: new Date() },
  });

  await prisma.orderStatusHistory.create({
    data: { orderId: order.id, status: OrderStatus.ACCEPTED },
  });

  const riderUser = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (riderUser) {
    await notifyCustomerOrderAccepted(
      order.customerId,
      order.id,
      `${riderUser.firstName} ${riderUser.lastName}`
    );
  }

  sendSuccess(res, updated, 'Order accepted');
}

// PATCH /orders/:id/status
export async function updateOrderStatus(req: Request, res: Response): Promise<void> {
  const { status, note } = req.body;
  const validTransitions: Record<string, OrderStatus[]> = {
    RIDER: [OrderStatus.RIDER_EN_ROUTE, OrderStatus.PICKED_UP, OrderStatus.IN_TRANSIT, OrderStatus.DELIVERED],
    CUSTOMER: [OrderStatus.CANCELLED],
    ADMIN: Object.values(OrderStatus),
  };

  const allowed = validTransitions[req.user!.role] || [];
  if (!allowed.includes(status as OrderStatus)) {
    sendError(res, 'Invalid status transition', 400);
    return;
  }

  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) {
    sendNotFound(res, 'Order not found');
    return;
  }

  const updateData: Record<string, unknown> = { status };
  if (status === OrderStatus.PICKED_UP) updateData.pickedUpAt = new Date();
  if (status === OrderStatus.DELIVERED) updateData.deliveredAt = new Date();
  if (status === OrderStatus.COMPLETED) updateData.completedAt = new Date();
  if (status === OrderStatus.CANCELLED) {
    updateData.cancelledAt = new Date();
    updateData.cancelledBy = req.user!.userId;
    if (req.body.cancelReason) updateData.cancelReason = req.body.cancelReason;
  }

  const updated = await prisma.order.update({ where: { id: req.params.id }, data: updateData });

  await prisma.orderStatusHistory.create({
    data: { orderId: order.id, status: status as OrderStatus, note },
  });

  if (status === OrderStatus.DELIVERED || status === OrderStatus.COMPLETED) {
    await notifyCustomerDelivered(order.customerId, order.id);
    // Credit rider earnings
    if (order.riderId) {
      const commission = Number(order.totalAmount) * 0.15;
      const earning = Number(order.totalAmount) - commission;
      await prisma.$transaction([
        prisma.rider.update({
          where: { id: order.riderId },
          data: {
            walletBalance: { increment: earning },
            totalEarnings: { increment: earning },
            completedDeliveries: { increment: 1 },
          },
        }),
        prisma.transaction.create({
          data: {
            riderId: order.riderId,
            type: 'EARNING',
            amount: earning,
            balance: 0, // updated below
            orderId: order.id,
            description: `Earning for order #${order.orderNumber}`,
          },
        }),
      ]);
    }
  }

  sendSuccess(res, updated, 'Order status updated');
}

// GET /orders/estimate
export async function estimateOrder(req: Request, res: Response): Promise<void> {
  const { pickupLat, pickupLng, destLat, destLng } = req.query;

  const pricing = await prisma.pricingConfig.findFirst({ where: { isActive: true } });
  if (!pricing) {
    sendError(res, 'Pricing unavailable', 503);
    return;
  }

  const distanceKm = haversineDistance(
    parseFloat(pickupLat as string),
    parseFloat(pickupLng as string),
    parseFloat(destLat as string),
    parseFloat(destLng as string)
  );
  const estimatedMinutes = estimateDuration(distanceKm);
  const fare = calculateFare(distanceKm, estimatedMinutes, pricing);

  sendSuccess(res, { distanceKm: +distanceKm.toFixed(2), ...fare });
}
