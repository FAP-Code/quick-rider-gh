import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtPayload } from '../utils/jwt';
import { sendUnauthorized, sendForbidden } from '../utils/response';
import { prisma } from '../config/prisma';
import { UserRole } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload & { status: string };
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      sendUnauthorized(res, 'No token provided');
      return;
    }

    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, status: true, email: true },
    });

    if (!user) {
      sendUnauthorized(res, 'User not found');
      return;
    }

    if (user.status === 'SUSPENDED' || user.status === 'DEACTIVATED') {
      sendForbidden(res, 'Account is not active');
      return;
    }

    req.user = { ...payload, status: user.status, role: user.role };
    next();
  } catch {
    sendUnauthorized(res, 'Invalid or expired token');
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendUnauthorized(res);
      return;
    }
    if (!roles.includes(req.user.role as UserRole)) {
      sendForbidden(res, 'Insufficient permissions');
      return;
    }
    next();
  };
}

export const requireAdmin = requireRole(UserRole.ADMIN);
export const requireRider = requireRole(UserRole.RIDER, UserRole.ADMIN);
export const requireCustomer = requireRole(UserRole.CUSTOMER, UserRole.ADMIN);
