import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as authService from '../services/auth.service';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: result,
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body);

  res.json({
    success: true,
    message: 'Login successful',
    data: result,
  });
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getMe(req.user!.id);

  res.json({
    success: true,
    data: user,
  });
});
