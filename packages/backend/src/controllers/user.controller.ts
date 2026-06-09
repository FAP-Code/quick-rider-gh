import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { sendSuccess, sendError, sendNotFound } from '../utils/response';
import { uploadToCloudinary } from '../services/upload.service';

// GET /users/me
export async function getProfile(req: Request, res: Response): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: {
      id: true,
      email: true,
      phone: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      profilePhotoUrl: true,
      isPhoneVerified: true,
      isEmailVerified: true,
      createdAt: true,
      savedAddresses: true,
    },
  });

  if (!user) {
    sendNotFound(res);
    return;
  }

  sendSuccess(res, user);
}

// PATCH /users/me
export async function updateProfile(req: Request, res: Response): Promise<void> {
  const { firstName, lastName, phone } = req.body;
  const updated = await prisma.user.update({
    where: { id: req.user!.userId },
    data: { firstName, lastName, phone },
    select: { id: true, firstName: true, lastName: true, phone: true, email: true, profilePhotoUrl: true },
  });
  sendSuccess(res, updated, 'Profile updated');
}

// POST /users/me/photo
export async function uploadProfilePhoto(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    sendError(res, 'No file provided');
    return;
  }
  const url = await uploadToCloudinary(req.file.buffer, 'profiles', req.user!.userId);
  const updated = await prisma.user.update({
    where: { id: req.user!.userId },
    data: { profilePhotoUrl: url },
    select: { id: true, profilePhotoUrl: true },
  });
  sendSuccess(res, updated, 'Profile photo updated');
}

// GET /users/me/addresses
export async function getSavedAddresses(req: Request, res: Response): Promise<void> {
  const addresses = await prisma.savedAddress.findMany({
    where: { userId: req.user!.userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });
  sendSuccess(res, addresses);
}

// POST /users/me/addresses
export async function addSavedAddress(req: Request, res: Response): Promise<void> {
  const { label, address, latitude, longitude, isDefault } = req.body;

  if (isDefault) {
    await prisma.savedAddress.updateMany({
      where: { userId: req.user!.userId },
      data: { isDefault: false },
    });
  }

  const saved = await prisma.savedAddress.create({
    data: { userId: req.user!.userId, label, address, latitude, longitude, isDefault: !!isDefault },
  });
  sendSuccess(res, saved, 'Address saved');
}

// DELETE /users/me/addresses/:id
export async function deleteSavedAddress(req: Request, res: Response): Promise<void> {
  const deleted = await prisma.savedAddress.deleteMany({
    where: { id: req.params.id, userId: req.user!.userId },
  });
  if (deleted.count === 0) {
    sendNotFound(res, 'Address not found');
    return;
  }
  sendSuccess(res, null, 'Address deleted');
}

// GET /users/me/notifications
export async function getNotifications(req: Request, res: Response): Promise<void> {
  const { page = '1', limit = '20' } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  const take = parseInt(limit as string);

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.notification.count({ where: { userId: req.user!.userId } }),
    prisma.notification.count({ where: { userId: req.user!.userId, isRead: false } }),
  ]);

  sendSuccess(res, { notifications, unreadCount }, 'Notifications retrieved', 200, {
    total,
    page: parseInt(page as string),
    limit: take,
    totalPages: Math.ceil(total / take),
  });
}

// PATCH /users/me/notifications/read
export async function markNotificationsRead(req: Request, res: Response): Promise<void> {
  const { ids } = req.body; // optional array of ids; if empty, mark all
  const where = ids?.length
    ? { userId: req.user!.userId, id: { in: ids } }
    : { userId: req.user!.userId, isRead: false };

  await prisma.notification.updateMany({ where, data: { isRead: true } });
  sendSuccess(res, null, 'Notifications marked as read');
}

// POST /users/me/ratings
export async function submitRating(req: Request, res: Response): Promise<void> {
  const { orderId, ratedId, score, comment } = req.body;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    sendNotFound(res, 'Order not found');
    return;
  }

  if (order.customerId !== req.user!.userId && order.status !== 'COMPLETED') {
    sendError(res, 'Cannot rate this order', 403);
    return;
  }

  const rating = await prisma.rating.create({
    data: { orderId, raterId: req.user!.userId, ratedId, score, comment },
  });

  // Update rider average rating
  const riderUser = await prisma.rider.findUnique({ where: { userId: ratedId } });
  if (riderUser) {
    const avg = await prisma.rating.aggregate({
      where: { ratedId },
      _avg: { score: true },
      _count: { score: true },
    });
    await prisma.rider.update({
      where: { userId: ratedId },
      data: {
        averageRating: avg._avg.score || 0,
        totalRatings: avg._count.score,
      },
    });
  }

  sendSuccess(res, rating, 'Rating submitted');
}
