import { prisma } from '../config/database';
import { AppError } from '../utils/AppError';
import * as cartService from './cart.service';
import { OrderStatus } from '@prisma/client';

interface CreateOrderInput {
  userId: string;
  shippingAddressId: string;
  taxRate?: number;
  shippingCost?: number;
}

interface OrderFilters {
  userId?: string;
  status?: OrderStatus;
  page?: number;
  limit?: number;
}

export const createOrder = async (input: CreateOrderInput) => {
  const { userId, shippingAddressId, taxRate = 0.1, shippingCost = 10 } = input;

  // Validate shipping address exists and belongs to user
  const address = await prisma.address.findUnique({
    where: { id: shippingAddressId },
  });

  if (!address) {
    throw new AppError('Shipping address not found', 404, 'ADDRESS_NOT_FOUND');
  }

  if (address.userId !== userId) {
    throw new AppError('Address does not belong to user', 403, 'FORBIDDEN');
  }

  // Get cart and validate
  const cart = await cartService.getCart(userId);

  if (cart.items.length === 0) {
    throw new AppError('Cart is empty', 400, 'CART_EMPTY');
  }

  // Validate cart
  const validation = await cartService.validateCart(userId);
  if (!validation.isValid) {
    throw new AppError(
      'Cart validation failed',
      400,
      'CART_INVALID',
      validation.errors
    );
  }

  // Calculate totals
  const subtotal = cart.subtotal;
  const tax = parseFloat((subtotal * taxRate).toFixed(2));
  const shipping = shippingCost;
  const total = parseFloat((subtotal + tax + shipping).toFixed(2));

  // Generate order number
  const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

  // Create order with items in a transaction
  const order = await prisma.$transaction(async (tx) => {
    // Check stock again within transaction for consistency
    for (const item of cart.items) {
      const product = await tx.product.findUnique({
        where: { id: item.product.id },
        select: { stock: true, isActive: true },
      });

      if (!product?.isActive) {
        throw new AppError(
          `Product ${item.product.name} is no longer available`,
          400,
          'PRODUCT_UNAVAILABLE'
        );
      }

      if (product.stock < item.quantity) {
        throw new AppError(
          `Insufficient stock for ${item.product.name}. Available: ${product.stock}`,
          400,
          'INSUFFICIENT_STOCK'
        );
      }
    }

    // Create order
    const newOrder = await tx.order.create({
      data: {
        userId,
        orderNumber,
        status: OrderStatus.PENDING,
        subtotal,
        tax,
        shipping,
        total,
        shippingAddressId,
        items: {
          create: cart.items.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            price: item.product.price,
            total: parseFloat((item.product.price * item.quantity).toFixed(2)),
          })),
        },
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  where: { isPrimary: true },
                  take: 1,
                },
              },
            },
          },
        },
        shippingAddress: true,
      },
    });

    // Update product stock
    for (const item of cart.items) {
      await tx.product.update({
        where: { id: item.product.id },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    return newOrder;
  });

  // Clear cart after successful order
  await cartService.clearCart(userId);

  return order;
};

export const getOrders = async (filters: OrderFilters) => {
  const { userId, status, page = 1, limit = 20 } = filters;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (userId) {
    where.userId = userId;
  }

  if (status) {
    where.status = status;
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  where: { isPrimary: true },
                  take: 1,
                },
              },
            },
          },
        },
        shippingAddress: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getOrderById = async (orderId: string, userId?: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: {
                where: { isPrimary: true },
                take: 1,
              },
            },
          },
        },
      },
      shippingAddress: true,
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!order) {
    throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
  }

  // If userId is provided (customer request), ensure order belongs to user
  if (userId && order.userId !== userId) {
    throw new AppError('Access denied', 403, 'FORBIDDEN');
  }

  return order;
};

export const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
  // Validate order exists
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
  }

  // Validate status transition
  const validTransitions: Record<OrderStatus, OrderStatus[]> = {
    PENDING: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
    CONFIRMED: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
    PROCESSING: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
    SHIPPED: [OrderStatus.DELIVERED],
    DELIVERED: [], // No transitions from delivered
    CANCELLED: [], // No transitions from cancelled
  };

  const allowedStatuses = validTransitions[order.status];
  if (!allowedStatuses.includes(status)) {
    throw new AppError(
      `Cannot transition from ${order.status} to ${status}`,
      400,
      'INVALID_STATUS_TRANSITION'
    );
  }

  // Update order status
  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: { status },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: {
                where: { isPrimary: true },
                take: 1,
              },
            },
          },
        },
      },
      shippingAddress: true,
    },
  });

  return updatedOrder;
};

export const cancelOrder = async (orderId: string, userId?: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
    },
  });

  if (!order) {
    throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
  }

  // If userId is provided (customer request), ensure order belongs to user
  if (userId && order.userId !== userId) {
    throw new AppError('Access denied', 403, 'FORBIDDEN');
  }

  // Check if order can be cancelled
  if (order.status === OrderStatus.DELIVERED) {
    throw new AppError('Cannot cancel delivered order', 400, 'CANNOT_CANCEL_DELIVERED');
  }

  if (order.status === OrderStatus.CANCELLED) {
    throw new AppError('Order is already cancelled', 400, 'ALREADY_CANCELLED');
  }

  // Cancel order and restore stock in transaction
  const updatedOrder = await prisma.$transaction(async (tx) => {
    // Restore stock
    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            increment: item.quantity,
          },
        },
      });
    }

    // Update order status
    return tx.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  where: { isPrimary: true },
                  take: 1,
                },
              },
            },
          },
        },
        shippingAddress: true,
      },
    });
  });

  return updatedOrder;
};
