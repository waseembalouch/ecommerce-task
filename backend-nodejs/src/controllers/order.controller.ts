import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as orderService from '../services/order.service';
import { OrderStatus } from '@prisma/client';

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const { shippingAddressId, taxRate, shippingCost } = req.body;

  const order = await orderService.createOrder({
    userId: req.user!.id,
    shippingAddressId,
    taxRate,
    shippingCost,
  });

  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    data: order,
  });
});

export const getOrders = asyncHandler(async (req: Request, res: Response) => {
  const { status, page, limit } = req.query;

  // For customers, only show their orders
  // For admins, show all orders or filter by userId if provided
  const userId = req.user!.role === 'CUSTOMER' ? req.user!.id : undefined;

  const result = await orderService.getOrders({
    userId,
    status: status as OrderStatus,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });

  res.json({
    success: true,
    data: result.orders,
    meta: result.pagination,
  });
});

export const getOrderById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // For customers, ensure they can only access their own orders
  const userId = req.user!.role === 'CUSTOMER' ? req.user!.id : undefined;

  const order = await orderService.getOrderById(id, userId);

  res.json({
    success: true,
    data: order,
  });
});

export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const order = await orderService.updateOrderStatus(id, status);

  res.json({
    success: true,
    message: 'Order status updated',
    data: order,
  });
});

export const cancelOrder = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // For customers, ensure they can only cancel their own orders
  const userId = req.user!.role === 'CUSTOMER' ? req.user!.id : undefined;

  const order = await orderService.cancelOrder(id, userId);

  res.json({
    success: true,
    message: 'Order cancelled successfully',
    data: order,
  });
});
