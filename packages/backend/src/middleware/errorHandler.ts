import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/library';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  logger.error({ message: err.message, stack: err.stack, path: req.path });

  if (err instanceof PrismaClientKnownRequestError) {
    if ((err as any).code === 'P2002') {
      res.status(409).json({ success: false, message: 'A record with that value already exists' });
      return;
    }
    if ((err as any).code === 'P2025') {
      res.status(404).json({ success: false, message: 'Record not found' });
      return;
    }
  }

  if (err instanceof PrismaClientValidationError) {
    res.status(400).json({ success: false, message: 'Invalid data provided' });
    return;
  }

  res.status(500).json({ success: false, message: 'Internal server error' });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ success: false, message: `Route ${req.path} not found` });
}
