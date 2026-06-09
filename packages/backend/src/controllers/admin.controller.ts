import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { sendSuccess, sendError, sendNotFound } from '../utils/response';
import { createNotification } from '../services/notification.service';
import { NotificationType } from '@prisma/client';

// GET /admin/dashboard
export async function getDashboardStats(req: Request, res: Response): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    totalUsers,
    totalRiders,
    activeRiders,
    pendingRiders,
    totalOrders,
    todayOrders,
    monthOrders,
    completedOrders,
    cancelledOrders,
    totalRevenue,
    monthRevenue,
    activeOrders,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.rider.count(),
    prisma.rider.count({ where: { availabilityStatus: 'ONLINE' } }),
    prisma.rider.count({ where: { status: 'PENDING' } }),
    prisma.order.count(),
    prisma.order.count({ where: { createdAt: { gte: today } } }),
    prisma.order.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.order.count({ where: { status: 'COMPLETED' } }),
    prisma.order.count({ where: { status: 'CANCELLED' } }),
    prisma.payment.aggregate({ where: { status: 'COMPLETED' }, _sum: { amount: true } }),
    prisma.payment.aggregate({
      where: { status: 'COMPLETED', createdAt: { gte: monthStart } },
      _sum: { amount: true },
    }),
    prisma.order.count({
      where: { status: { in: ['PENDING', 'ACCEPTED', 'RIDER_EN_ROUTE', 'PICKED_UP', 'IN_TRANSIT'] } },
    }),
  ]);

  const completionRate = totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : '0';

  sendSuccess(res, {
    users: { total: totalUsers },
    riders: { total: totalRiders, active: activeRiders, pending: pendingRiders },
    orders: {
      total: totalOrders,
      today: todayOrders,
      thisMonth: monthOrders,
      completed: completedOrders,
      cancelled: cancelledOrders,
      active: activeOrders,
      completionRate: `${completionRate}%`,
    },
    revenue: {
      total: totalRevenue._sum.amount || 0,
      thisMonth: monthRevenue._sum.amount || 0,
    },
  });
}

// GET /admin/analytics/orders-chart
export async function getOrdersChart(req: Request, res: Response): Promise<void> {
  const { period = '30d' } = req.query;
  const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: startDate } },
    select: { createdAt: true, status: true, totalAmount: true },
  });

  // Group by day
  const byDay: Record<string, { date: string; orders: number; revenue: number }> = {};
  orders.forEach((o) => {
    const key = o.createdAt.toISOString().split('T')[0];
    if (!byDay[key]) byDay[key] = { date: key, orders: 0, revenue: 0 };
    byDay[key].orders++;
    if (o.status === 'COMPLETED') byDay[key].revenue += Number(o.totalAmount);
  });

  const chart = Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date));
  sendSuccess(res, chart);
}

// GET /admin/riders
export async function listRiders(req: Request, res: Response): Promise<void> {
  const { status, page = '1', limit = '20', search } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  const take = parseInt(limit as string);

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (search) {
    where.user = {
      OR: [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search as string } },
      ],
    };
  }

  const [riders, total] = await Promise.all([
    prisma.rider.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, profilePhotoUrl: true, status: true } },
      },
    }),
    prisma.rider.count({ where }),
  ]);

  sendSuccess(res, riders, 'Riders retrieved', 200, {
    total,
    page: parseInt(page as string),
    limit: take,
    totalPages: Math.ceil(total / take),
  });
}

// PATCH /admin/riders/:id/approve
export async function approveRider(req: Request, res: Response): Promise<void> {
  const rider = await prisma.rider.findUnique({
    where: { id: req.params.id },
    include: { user: true },
  });

  if (!rider) {
    sendNotFound(res, 'Rider not found');
    return;
  }

  await prisma.rider.update({
    where: { id: rider.id },
    data: {
      status: 'APPROVED',
      approvedAt: new Date(),
      approvedBy: req.user!.userId,
      adminNotes: req.body.notes,
    },
  });

  await createNotification({
    userId: rider.userId,
    type: NotificationType.ACCOUNT_APPROVED,
    title: 'Account Approved!',
    body: 'Congratulations! Your rider account has been approved. You can now start accepting deliveries.',
  });

  sendSuccess(res, null, 'Rider approved successfully');
}

// PATCH /admin/riders/:id/reject
export async function rejectRider(req: Request, res: Response): Promise<void> {
  const rider = await prisma.rider.findUnique({ where: { id: req.params.id } });
  if (!rider) {
    sendNotFound(res);
    return;
  }

  await prisma.rider.update({
    where: { id: rider.id },
    data: { status: 'REJECTED', adminNotes: req.body.reason },
  });

  await createNotification({
    userId: rider.userId,
    type: NotificationType.SYSTEM,
    title: 'Account Application Update',
    body: `Your rider application was not approved. Reason: ${req.body.reason || 'Documents incomplete'}. Please resubmit.`,
  });

  sendSuccess(res, null, 'Rider rejected');
}

// GET /admin/users
export async function listUsers(req: Request, res: Response): Promise<void> {
  const { role, status, page = '1', limit = '20', search } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  const take = parseInt(limit as string);

  const where: Record<string, unknown> = {};
  if (role) where.role = role;
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        profilePhotoUrl: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        lastLoginAt: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  sendSuccess(res, users, 'Users retrieved', 200, {
    total,
    page: parseInt(page as string),
    limit: take,
    totalPages: Math.ceil(total / take),
  });
}

// PATCH /admin/users/:id/suspend
export async function suspendUser(req: Request, res: Response): Promise<void> {
  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data: { status: 'SUSPENDED' },
  });

  await createNotification({
    userId: updated.id,
    type: NotificationType.ACCOUNT_SUSPENDED,
    title: 'Account Suspended',
    body: `Your account has been suspended. Reason: ${req.body.reason || 'Violation of terms'}. Contact support to appeal.`,
  });

  sendSuccess(res, null, 'User suspended');
}

// PATCH /admin/users/:id/activate
export async function activateUser(req: Request, res: Response): Promise<void> {
  await prisma.user.update({ where: { id: req.params.id }, data: { status: 'ACTIVE' } });
  sendSuccess(res, null, 'User activated');
}

// PATCH /admin/users/:id
export async function updateUser(req: Request, res: Response): Promise<void> {
  const { firstName, lastName, email, phone } = req.body;
  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data: {
      ...(firstName !== undefined && { firstName }),
      ...(lastName !== undefined && { lastName }),
      ...(email !== undefined && { email }),
      ...(phone !== undefined && { phone }),
    },
    select: { id: true, firstName: true, lastName: true, email: true, phone: true, status: true },
  });
  sendSuccess(res, updated, 'User updated');
}

// PATCH /admin/riders/:id
export async function updateRider(req: Request, res: Response): Promise<void> {
  const { firstName, lastName, email, phone, motorcycleMake, motorcycleModel, motorcycleColor, motorcyclePlate, licenseClass, licenseNumber } = req.body;

  const rider = await prisma.rider.findUnique({ where: { id: req.params.id }, select: { userId: true } });
  if (!rider) { sendSuccess(res, null, 'Rider not found'); return; }

  await Promise.all([
    prisma.user.update({
      where: { id: rider.userId },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
      },
    }),
    prisma.rider.update({
      where: { id: req.params.id },
      data: {
        ...(motorcycleMake !== undefined && { motorcycleMake }),
        ...(motorcycleModel !== undefined && { motorcycleModel }),
        ...(motorcycleColor !== undefined && { motorcycleColor }),
        ...(motorcyclePlate !== undefined && { motorcyclePlate }),
        ...(licenseClass !== undefined && { licenseClass }),
        ...(licenseNumber !== undefined && { licenseNumber }),
      },
    }),
  ]);

  sendSuccess(res, null, 'Rider updated');
}

// GET /admin/orders
export async function listOrders(req: Request, res: Response): Promise<void> {
  const { status, page = '1', limit = '20' } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  const take = parseInt(limit as string);
  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, firstName: true, lastName: true, phone: true } },
        rider: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
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

// GET /admin/reports
export async function listReports(req: Request, res: Response): Promise<void> {
  const { status, page = '1', limit = '20' } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  const take = parseInt(limit as string);
  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: { select: { id: true, firstName: true, lastName: true } },
        reported: { select: { id: true, firstName: true, lastName: true } },
      },
    }),
    prisma.report.count({ where }),
  ]);

  sendSuccess(res, reports, 'Reports retrieved', 200, {
    total,
    page: parseInt(page as string),
    limit: take,
    totalPages: Math.ceil(total / take),
  });
}

// GET /admin/withdrawals
export async function listWithdrawals(req: Request, res: Response): Promise<void> {
  const { status, page = '1', limit = '20' } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  const take = parseInt(limit as string);
  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const [withdrawals, total] = await Promise.all([
    prisma.withdrawalRequest.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        rider: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
      },
    }),
    prisma.withdrawalRequest.count({ where }),
  ]);

  sendSuccess(res, withdrawals, 'Withdrawals retrieved', 200, {
    total,
    page: parseInt(page as string),
    limit: take,
    totalPages: Math.ceil(total / take),
  });
}

// PATCH /admin/withdrawals/:id/process
export async function processWithdrawal(req: Request, res: Response): Promise<void> {
  const { action, failureReason } = req.body;
  const status = action === 'approve' ? 'COMPLETED' : 'FAILED';

  await prisma.withdrawalRequest.update({
    where: { id: req.params.id },
    data: {
      status,
      processedAt: new Date(),
      processedBy: req.user!.userId,
      failureReason: status === 'FAILED' ? failureReason : null,
    },
  });

  sendSuccess(res, null, `Withdrawal ${status.toLowerCase()}`);
}

// GET /admin/pricing
export async function getPricing(req: Request, res: Response): Promise<void> {
  const config = await prisma.pricingConfig.findFirst({ where: { isActive: true } });
  sendSuccess(res, config);
}

// PATCH /admin/pricing
export async function updatePricing(req: Request, res: Response): Promise<void> {
  const { baseFare, perKmRate, perMinuteRate, platformFeePercent, minimumFare, surgeMultiplier } = req.body;

  const config = await prisma.pricingConfig.findFirst({ where: { isActive: true } });
  if (!config) {
    sendError(res, 'Pricing config not found', 404);
    return;
  }

  const updated = await prisma.pricingConfig.update({
    where: { id: config.id },
    data: { baseFare, perKmRate, perMinuteRate, platformFeePercent, minimumFare, surgeMultiplier },
  });

  sendSuccess(res, updated, 'Pricing updated');
}
