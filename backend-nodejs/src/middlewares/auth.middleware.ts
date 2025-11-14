import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { verifyToken } from '../utils/jwt';
import { prisma } from '../config/database';
import { asyncHandler } from '../utils/asyncHandler';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

export const authenticate = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.replace('Bearer ', '');

    try {
      const decoded = verifyToken(token);

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, role: true },
      });

      if (!user) {
        throw new AppError('User not found', 401, 'UNAUTHORIZED');
      }

      req.user = user;
      next();
    } catch (error) {
      throw new AppError('Invalid or expired token', 401, 'UNAUTHORIZED');
    }
  }
);

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    next();
  };
};
