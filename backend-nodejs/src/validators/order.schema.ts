import { z } from 'zod';
import { OrderStatus } from '@prisma/client';

export const createOrderSchema = z.object({
  body: z.object({
    shippingAddressId: z.string().uuid('Invalid shipping address ID'),
    taxRate: z.number().min(0).max(1).optional(),
    shippingCost: z.number().min(0).optional(),
  }),
});

export const getOrdersSchema = z.object({
  query: z.object({
    status: z
      .enum([
        OrderStatus.PENDING,
        OrderStatus.CONFIRMED,
        OrderStatus.PROCESSING,
        OrderStatus.SHIPPED,
        OrderStatus.DELIVERED,
        OrderStatus.CANCELLED,
      ])
      .optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  }),
});

export const getOrderByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid order ID'),
  }),
});

export const updateOrderStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid order ID'),
  }),
  body: z.object({
    status: z.enum([
      OrderStatus.PENDING,
      OrderStatus.CONFIRMED,
      OrderStatus.PROCESSING,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
      OrderStatus.CANCELLED,
    ]),
  }),
});

export const cancelOrderSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid order ID'),
  }),
});
