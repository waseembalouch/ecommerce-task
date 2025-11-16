import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as userService from '../services/user.service';

// User profile endpoints
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.getUserProfile(req.user!.id);

  res.json({
    success: true,
    data: user,
  });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.updateProfile(req.user!.id, req.body);

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: user,
  });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const result = await userService.changePassword(req.user!.id, req.body);

  res.json({
    success: true,
    message: result.message,
  });
});

// Admin endpoints
export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 20, search, role } = req.query;

  const result = await userService.getUsers({
    page: Number(page),
    limit: Number(limit),
    search: search as string,
    role: role as 'CUSTOMER' | 'ADMIN',
  });

  res.json({
    success: true,
    data: result.users,
    meta: result.pagination,
  });
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = await userService.getUserById(id);

  res.json({
    success: true,
    data: user,
  });
});

export const updateUserRole = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;

  const user = await userService.updateUserRole(id, role);

  res.json({
    success: true,
    message: 'User role updated successfully',
    data: user,
  });
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await userService.deleteUser(id);

  res.json({
    success: true,
    message: result.message,
  });
});
