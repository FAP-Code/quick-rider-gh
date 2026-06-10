import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import {
  sendSuccess,
  sendError,
  sendNotFound,
  sendCreated,
} from '../utils/response';
import { uploadToCloudinary } from '../services/upload.service';
import { AvailabilityStatus } from '@prisma/client';

// GET /riders/me
export async function getMyProfile(req: Request, res: Response): Promise<void> {
  const rider = await prisma.rider.findUnique({
    where: { userId: req.user!.userId },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, profilePhotoUrl: true } },
    },
  });
  if (!rider) {
    sendNotFound(res, 'Rider profile not found');
    return;
  }
  sendSuccess(res, rider);
}

// PATCH /riders/me/availability
export async function setAvailability(req: Request, res: Response): Promise<void> {
  const { status } = req.body;
  const rider = await prisma.rider.findUnique({ where: { userId: req.user!.userId } });

  if (!rider) {
    sendNotFound(res, 'Rider profile not found');
    return;
  }
  if (rider.status !== 'APPROVED') {
    sendError(res, 'Rider account is not approved yet', 403);
    return;
  }

  const updated = await prisma.rider.update({
    where: { id: rider.id },
    data: { availabilityStatus: status as AvailabilityStatus },
  });

  sendSuccess(res, { availabilityStatus: updated.availabilityStatus });
}

// PATCH /riders/me/location
export async function updateLocation(req: Request, res: Response): Promise<void> {
  const { latitude, longitude } = req.body;
  const rider = await prisma.rider.findUnique({ where: { userId: req.user!.userId } });

  if (!rider) {
    sendNotFound(res);
    return;
  }

  await prisma.rider.update({
    where: { id: rider.id },
    data: { currentLatitude: latitude, currentLongitude: longitude, lastLocationUpdate: new Date() },
  });

  sendSuccess(res, null, 'Location updated');
}

// POST /riders/me/documents — upload verification documents
export async function uploadDocuments(req: Request, res: Response): Promise<void> {
  const rider = await prisma.rider.findUnique({ where: { userId: req.user!.userId } });
  if (!rider) {
    sendNotFound(res, 'Rider profile not found');
    return;
  }

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const updates: Record<string, string> = {};

  const fieldMap: Record<string, { folder: 'ghana-cards' | 'drivers-licenses' | 'motorcycle-photos' | 'motorcycle-regs' | 'selfies'; dbField: string }> = {
    ghanaCard: { folder: 'ghana-cards', dbField: 'ghanaCardUrl' },
    driversLicense: { folder: 'drivers-licenses', dbField: 'driversLicenseUrl' },
    motorcyclePhoto: { folder: 'motorcycle-photos', dbField: 'motorcyclePhotoUrl' },
    motorcycleReg: { folder: 'motorcycle-regs', dbField: 'motorcycleRegUrl' },
    selfie: { folder: 'selfies', dbField: 'selfieUrl' },
  };

  for (const [field, meta] of Object.entries(fieldMap)) {
    if (files[field]?.[0]) {
      const url = await uploadToCloudinary(files[field][0].buffer, meta.folder, `${rider.id}-${field}`);
      updates[meta.dbField] = url;
    }
  }

  if (Object.keys(updates).length === 0) {
    sendError(res, 'No files provided');
    return;
  }

  const updated = await prisma.rider.update({ where: { id: rider.id }, data: updates });
  sendSuccess(res, updated, 'Documents uploaded successfully');
}

// PATCH /riders/me/motorcycle
export async function updateMotorcycleDetails(req: Request, res: Response): Promise<void> {
  const rider = await prisma.rider.findUnique({ where: { userId: req.user!.userId } });
  if (!rider) {
    sendNotFound(res);
    return;
  }

  const { motorcycleMake, motorcycleModel, motorcycleColor, motorcyclePlate, licenseClass, licenseNumber } = req.body;
  const updated = await prisma.rider.update({
    where: { id: rider.id },
    data: {
      ...(motorcycleMake  !== undefined && { motorcycleMake }),
      ...(motorcycleModel !== undefined && { motorcycleModel }),
      ...(motorcycleColor !== undefined && { motorcycleColor }),
      ...(motorcyclePlate !== undefined && { motorcyclePlate }),
      ...(licenseClass    !== undefined && { licenseClass }),
      ...(licenseNumber   !== undefined && { licenseNumber }),
    },
  });

  sendSuccess(res, updated, 'Motorcycle details updated');
}

// GET /riders/me/earnings
export async function getEarnings(req: Request, res: Response): Promise<void> {
  const rider = await prisma.rider.findUnique({ where: { userId: req.user!.userId } });
  if (!rider) {
    sendNotFound(res);
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [todayEarnings, weekEarnings, transactions] = await Promise.all([
    prisma.transaction.aggregate({
      where: { riderId: rider.id, type: 'EARNING', createdAt: { gte: today } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { riderId: rider.id, type: 'EARNING', createdAt: { gte: weekAgo } },
      _sum: { amount: true },
    }),
    prisma.transaction.findMany({
      where: { riderId: rider.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ]);

  sendSuccess(res, {
    walletBalance: rider.walletBalance,
    totalEarnings: rider.totalEarnings,
    todayEarnings: todayEarnings._sum.amount || 0,
    weekEarnings: weekEarnings._sum.amount || 0,
    completedDeliveries: rider.completedDeliveries,
    transactions,
  });
}

// POST /riders/me/withdraw
export async function requestWithdrawal(req: Request, res: Response): Promise<void> {
  const rider = await prisma.rider.findUnique({ where: { userId: req.user!.userId } });
  if (!rider) {
    sendNotFound(res);
    return;
  }

  const { amount, method, accountNumber, accountName } = req.body;

  if (Number(rider.walletBalance) < Number(amount)) {
    sendError(res, 'Insufficient wallet balance');
    return;
  }

  const MIN_WITHDRAWAL = 10;
  if (Number(amount) < MIN_WITHDRAWAL) {
    sendError(res, `Minimum withdrawal is GHS ${MIN_WITHDRAWAL}`);
    return;
  }

  const withdrawal = await prisma.$transaction(async (tx) => {
    await tx.rider.update({
      where: { id: rider.id },
      data: { walletBalance: { decrement: amount } },
    });
    return tx.withdrawalRequest.create({
      data: { riderId: rider.id, amount, method, accountNumber, accountName },
    });
  });

  sendCreated(res, withdrawal, 'Withdrawal request submitted');
}

// GET /riders/nearby — for customers
export async function getNearbyRiders(req: Request, res: Response): Promise<void> {
  const { lat, lng, radius = '10' } = req.query;

  if (!lat || !lng) {
    sendError(res, 'Latitude and longitude are required');
    return;
  }

  const riders = await prisma.rider.findMany({
    where: {
      status: 'APPROVED',
      availabilityStatus: 'ONLINE',
      currentLatitude: { not: null },
      currentLongitude: { not: null },
    },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, profilePhotoUrl: true },
      },
    },
  });

  const radiusKm = parseFloat(radius as string);
  const nearby = riders
    .map((r) => {
      const dist = Math.sqrt(
        Math.pow((r.currentLatitude! - parseFloat(lat as string)) * 111, 2) +
          Math.pow((r.currentLongitude! - parseFloat(lng as string)) * 111, 2)
      );
      return { ...r, distanceKm: +dist.toFixed(2) };
    })
    .filter((r) => r.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 20);

  sendSuccess(res, nearby);
}

// GET /riders/me/ratings
export async function getMyRatings(req: Request, res: Response): Promise<void> {
  const { page = '1', limit = '20' } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  const take = parseInt(limit as string);

  const [ratings, total, agg] = await Promise.all([
    prisma.rating.findMany({
      where: { ratedId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        rater: { select: { id: true, firstName: true, lastName: true, profilePhotoUrl: true } },
        order: { select: { id: true, orderNumber: true, type: true, destinationAddress: true } },
      },
    }),
    prisma.rating.count({ where: { ratedId: req.user!.userId } }),
    prisma.rating.aggregate({
      where: { ratedId: req.user!.userId },
      _avg: { score: true },
      _count: { score: true },
    }),
  ]);

  // Distribution of scores 1-5
  const distribution = await prisma.rating.groupBy({
    by: ['score'],
    where: { ratedId: req.user!.userId },
    _count: { score: true },
  });
  const breakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  distribution.forEach((d) => { breakdown[d.score] = d._count.score; });

  sendSuccess(res, {
    ratings,
    average: agg._avg.score || 0,
    total: agg._count.score,
    breakdown,
  }, 'Ratings retrieved', 200, {
    total,
    page: parseInt(page as string),
    limit: take,
    totalPages: Math.ceil(total / take),
  });
}
