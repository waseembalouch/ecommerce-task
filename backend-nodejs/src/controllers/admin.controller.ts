import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as adminService from '../services/admin.service';

export const getDashboardStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await adminService.getDashboardStats();

  res.json({
    success: true,
    data: stats,
  });
});

export const getSalesStats = asyncHandler(async (req: Request, res: Response) => {
  const { period = 'month' } = req.query;

  const stats = await adminService.getSalesStats(period as 'week' | 'month' | 'year');

  res.json({
    success: true,
    data: stats,
  });
});

export const getUserStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await adminService.getUserStats();

  res.json({
    success: true,
    data: stats,
  });
});

export const getProductStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await adminService.getProductStats();

  res.json({
    success: true,
    data: stats,
  });
});
