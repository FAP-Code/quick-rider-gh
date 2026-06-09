import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { sendSuccess, sendCreated, sendError, sendUnauthorized } from '../utils/response';
import { generateOtp, otpExpiresAt } from '../utils/otp';
import { createNotification } from '../services/notification.service';
import { UserRole, NotificationType } from '@prisma/client';
import { logger } from '../utils/logger';
import crypto from 'crypto';

// POST /auth/register
export async function register(req: Request, res: Response): Promise<void> {
  const { email, phone, password, firstName, lastName, role } = req.body;

  if (!email && !phone) {
    sendError(res, 'Email or phone number is required');
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const userRole = role === 'RIDER' ? UserRole.RIDER : UserRole.CUSTOMER;

  const user = await prisma.user.create({
    data: {
      email: email?.toLowerCase(),
      phone,
      passwordHash,
      firstName,
      lastName,
      role: userRole,
    },
    select: { id: true, email: true, phone: true, firstName: true, lastName: true, role: true },
  });

  if (userRole === UserRole.RIDER) {
    await prisma.rider.create({ data: { userId: user.id } });
  }

  const accessToken = signAccessToken({ userId: user.id, role: user.role, email: user.email ?? undefined });
  const refreshToken = signRefreshToken({ userId: user.id });

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  sendCreated(res, { user, accessToken, refreshToken }, 'Account created successfully');
}

// POST /auth/login
export async function login(req: Request, res: Response): Promise<void> {
  const { email, phone, password } = req.body;

  const user = await prisma.user.findFirst({
    where: email ? { email: email.toLowerCase() } : { phone },
  });

  if (!user || !user.passwordHash) {
    sendUnauthorized(res, 'Invalid credentials');
    return;
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    sendUnauthorized(res, 'Invalid credentials');
    return;
  }

  if (user.status === 'SUSPENDED' || user.status === 'DEACTIVATED') {
    sendError(res, 'Account is not active', 403);
    return;
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  const accessToken = signAccessToken({ userId: user.id, role: user.role, email: user.email ?? undefined });
  const refreshToken = signRefreshToken({ userId: user.id });

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  sendSuccess(res, {
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      profilePhotoUrl: user.profilePhotoUrl,
    },
    accessToken,
    refreshToken,
  });
}

// POST /auth/refresh
export async function refreshToken(req: Request, res: Response): Promise<void> {
  const { refreshToken: token } = req.body;
  if (!token) {
    sendUnauthorized(res, 'Refresh token required');
    return;
  }

  try {
    const payload = verifyRefreshToken(token);
    const stored = await prisma.refreshToken.findUnique({ where: { token } });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      sendUnauthorized(res, 'Invalid refresh token');
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      sendUnauthorized(res);
      return;
    }

    // Rotate token
    await prisma.refreshToken.update({ where: { token }, data: { revokedAt: new Date() } });

    const newAccess = signAccessToken({ userId: user.id, role: user.role, email: user.email ?? undefined });
    const newRefresh = signRefreshToken({ userId: user.id });

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: newRefresh,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    sendSuccess(res, { accessToken: newAccess, refreshToken: newRefresh });
  } catch {
    sendUnauthorized(res, 'Invalid refresh token');
  }
}

// POST /auth/logout
export async function logout(req: Request, res: Response): Promise<void> {
  const { refreshToken: token } = req.body;
  if (token) {
    await prisma.refreshToken.updateMany({
      where: { token },
      data: { revokedAt: new Date() },
    });
  }
  sendSuccess(res, null, 'Logged out successfully');
}

// POST /auth/send-otp
export async function sendOtp(req: Request, res: Response): Promise<void> {
  const { phone, email, type } = req.body;

  const user = await prisma.user.findFirst({
    where: phone ? { phone } : { email: email?.toLowerCase() },
  });

  if (!user) {
    sendError(res, 'User not found', 404);
    return;
  }

  const code = generateOtp();

  await prisma.otpCode.create({
    data: {
      userId: user.id,
      code,
      type: type || 'phone_verification',
      expiresAt: otpExpiresAt(),
    },
  });

  // TODO: send via Twilio (SMS) or Nodemailer (email)
  logger.info({ msg: 'OTP generated', userId: user.id, code: code });

  sendSuccess(res, { message: 'OTP sent' });
}

// POST /auth/verify-otp
export async function verifyOtp(req: Request, res: Response): Promise<void> {
  const { userId, code, type } = req.body;

  const otp = await prisma.otpCode.findFirst({
    where: {
      userId,
      code,
      type: type || 'phone_verification',
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!otp) {
    sendError(res, 'Invalid or expired OTP', 400);
    return;
  }

  await prisma.otpCode.update({ where: { id: otp.id }, data: { usedAt: new Date() } });

  const updateData: Record<string, boolean> = {};
  if (type === 'phone_verification') updateData.isPhoneVerified = true;
  if (type === 'email_verification') updateData.isEmailVerified = true;

  await prisma.user.update({ where: { id: userId }, data: updateData });

  sendSuccess(res, { verified: true });
}

// POST /auth/forgot-password
export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email: email?.toLowerCase() } });

  // Always return success to prevent email enumeration
  if (user) {
    const code = generateOtp();
    await prisma.otpCode.create({
      data: {
        userId: user.id,
        code,
        type: 'password_reset',
        expiresAt: otpExpiresAt(30),
      },
    });
    logger.info({ msg: 'Password reset OTP', userId: user.id, code });
    await createNotification({
      userId: user.id,
      type: NotificationType.SYSTEM,
      title: 'Password Reset',
      body: `Your password reset code is: ${code}`,
    });
  }

  sendSuccess(res, null, 'If that email exists, a reset code has been sent');
}

// POST /auth/reset-password
export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { email, code, newPassword } = req.body;

  const user = await prisma.user.findUnique({ where: { email: email?.toLowerCase() } });
  if (!user) {
    sendError(res, 'Invalid reset attempt', 400);
    return;
  }

  const otp = await prisma.otpCode.findFirst({
    where: {
      userId: user.id,
      code,
      type: 'password_reset',
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (!otp) {
    sendError(res, 'Invalid or expired code', 400);
    return;
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await Promise.all([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
    prisma.otpCode.update({ where: { id: otp.id }, data: { usedAt: new Date() } }),
    // Revoke all refresh tokens on password reset
    prisma.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);

  sendSuccess(res, null, 'Password reset successfully');
}
