import * as orderService from '../../../src/services/order.service';
import { prisma } from '../../../src/config/database';
import * as cartService from '../../../src/services/cart.service';
import { OrderStatus } from '@prisma/client';

// Mock prisma and cart service
jest.mock('../../../src/config/database', () => ({
  prisma: {
    address: {
      findUnique: jest.fn(),
    },
    order: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('../../../src/services/cart.service');

describe('Order Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    const validInput = {
      userId: 'user-1',
      shippingAddressId: 'address-1',
      taxRate: 0.1,
      shippingCost: 10,
    };

    const mockAddress = {
      id: 'address-1',
      userId: 'user-1',
      street: '123 Main St',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345',
      country: 'Test Country',
      isDefault: true,
    };

    const mockCart = {
      items: [
        {
          product: {
            id: 'product-1',
            name: 'Test Product',
            price: 100.00,
            stock: 10,
            isActive: true,
          },
          quantity: 2,
          subtotal: 200.00,
        },
      ],
      subtotal: 200.00,
      itemCount: 2,
    };

    const mockValidation = {
      isValid: true,
      errors: [],
    };

    it('should throw error if shipping address not found', async () => {
      (prisma.address.findUnique as any).mockResolvedValue(null);

      await expect(orderService.createOrder(validInput)).rejects.toMatchObject({
        message: 'Shipping address not found',
        statusCode: 404,
      });
    });

    it('should throw error if address does not belong to user', async () => {
      const wrongAddress = { ...mockAddress, userId: 'different-user' };
      (prisma.address.findUnique as any).mockResolvedValue(wrongAddress);

      await expect(orderService.createOrder(validInput)).rejects.toMatchObject({
        message: 'Address does not belong to user',
        statusCode: 403,
      });
    });

    it('should throw error if cart is empty', async () => {
      (prisma.address.findUnique as any).mockResolvedValue(mockAddress);
      (cartService.getCart as any).mockResolvedValue({ items: [], subtotal: 0, itemCount: 0 });

      await expect(orderService.createOrder(validInput)).rejects.toMatchObject({
        message: 'Cart is empty',
        statusCode: 400,
      });
    });

    it('should throw error if cart validation fails', async () => {
      (prisma.address.findUnique as any).mockResolvedValue(mockAddress);
      (cartService.getCart as any).mockResolvedValue(mockCart);
      (cartService.validateCart as any).mockResolvedValue({
        isValid: false,
        errors: ['Product out of stock'],
      });

      await expect(orderService.createOrder(validInput)).rejects.toMatchObject({
        message: 'Cart validation failed',
        statusCode: 400,
      });
    });

    it('should successfully create an order', async () => {
      const mockOrder = {
        id: 'order-1',
        userId: validInput.userId,
        orderNumber: 'ORD-123456',
        status: OrderStatus.PENDING,
        subtotal: 200.00,
        tax: 20.00,
        shipping: 10.00,
        total: 230.00,
        shippingAddressId: validInput.shippingAddressId,
        items: [
          {
            id: 'item-1',
            productId: 'product-1',
            quantity: 2,
            price: 100.00,
            total: 200.00,
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.address.findUnique as any).mockResolvedValue(mockAddress);
      (cartService.getCart as any).mockResolvedValue(mockCart);
      (cartService.validateCart as any).mockResolvedValue(mockValidation);
      (cartService.clearCart as any).mockResolvedValue(undefined);

      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        const tx = {
          product: {
            findUnique: jest.fn().mockResolvedValue({
              stock: 10,
              isActive: true,
            }),
            update: jest.fn().mockResolvedValue({}),
          },
          order: {
            create: jest.fn().mockResolvedValue(mockOrder),
          },
        };
        return callback(tx);
      });

      const result = await orderService.createOrder(validInput);

      expect(result).toMatchObject({
        userId: validInput.userId,
        status: OrderStatus.PENDING,
      });
      expect(cartService.clearCart).toHaveBeenCalledWith(validInput.userId);
    });
  });

  describe('getOrders', () => {
    it('should return paginated orders', async () => {
      const mockOrders = [
        {
          id: 'order-1',
          orderNumber: 'ORD-001',
          status: OrderStatus.PENDING,
          total: 100.00,
        },
        {
          id: 'order-2',
          orderNumber: 'ORD-002',
          status: OrderStatus.CONFIRMED,
          total: 200.00,
        },
      ];

      (prisma.order.findMany as any).mockResolvedValue(mockOrders);
      (prisma.order.count as any).mockResolvedValue(50);

      const result = await orderService.getOrders({ page: 1, limit: 20 });

      expect(result.orders).toEqual(mockOrders);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 50,
        totalPages: 3,
      });
    });

    it('should filter orders by userId', async () => {
      (prisma.order.findMany as any).mockResolvedValue([]);
      (prisma.order.count as any).mockResolvedValue(0);

      await orderService.getOrders({ userId: 'user-1', page: 1, limit: 20 });

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'user-1' }),
        })
      );
    });

    it('should filter orders by status', async () => {
      (prisma.order.findMany as any).mockResolvedValue([]);
      (prisma.order.count as any).mockResolvedValue(0);

      await orderService.getOrders({ status: OrderStatus.DELIVERED, page: 1, limit: 20 });

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: OrderStatus.DELIVERED }),
        })
      );
    });
  });

  describe('getOrderById', () => {
    const mockOrder = {
      id: 'order-1',
      userId: 'user-1',
      orderNumber: 'ORD-001',
      status: OrderStatus.PENDING,
      total: 100.00,
    };

    it('should return order by id', async () => {
      (prisma.order.findUnique as any).mockResolvedValue(mockOrder);

      const result = await orderService.getOrderById('order-1');

      expect(result).toEqual(mockOrder);
    });

    it('should throw error if order not found', async () => {
      (prisma.order.findUnique as any).mockResolvedValue(null);

      await expect(orderService.getOrderById('non-existent')).rejects.toMatchObject({
        message: 'Order not found',
        statusCode: 404,
      });
    });

    it('should throw error if order does not belong to user', async () => {
      (prisma.order.findUnique as any).mockResolvedValue(mockOrder);

      await expect(orderService.getOrderById('order-1', 'different-user')).rejects.toMatchObject({
        message: 'Access denied',
        statusCode: 403,
      });
    });

    it('should return order if it belongs to user', async () => {
      (prisma.order.findUnique as any).mockResolvedValue(mockOrder);

      const result = await orderService.getOrderById('order-1', 'user-1');

      expect(result).toEqual(mockOrder);
    });
  });

  describe('updateOrderStatus', () => {
    const mockOrder = {
      id: 'order-1',
      status: OrderStatus.PENDING,
    };

    it('should throw error if order not found', async () => {
      (prisma.order.findUnique as any).mockResolvedValue(null);

      await expect(
        orderService.updateOrderStatus('order-1', OrderStatus.CONFIRMED)
      ).rejects.toMatchObject({
        message: 'Order not found',
        statusCode: 404,
      });
    });

    it('should throw error for invalid status transition', async () => {
      (prisma.order.findUnique as any).mockResolvedValue({
        id: 'order-1',
        status: OrderStatus.DELIVERED,
      });

      await expect(
        orderService.updateOrderStatus('order-1', OrderStatus.PENDING)
      ).rejects.toMatchObject({
        message: 'Cannot transition from DELIVERED to PENDING',
        statusCode: 400,
      });
    });

    it('should successfully update order status for valid transition', async () => {
      const updatedOrder = {
        ...mockOrder,
        status: OrderStatus.CONFIRMED,
      };

      (prisma.order.findUnique as any).mockResolvedValue(mockOrder);
      (prisma.order.update as any).mockResolvedValue(updatedOrder);

      const result = await orderService.updateOrderStatus('order-1', OrderStatus.CONFIRMED);

      expect(result.status).toBe(OrderStatus.CONFIRMED);
      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'order-1' },
          data: { status: OrderStatus.CONFIRMED },
        })
      );
    });
  });

  describe('cancelOrder', () => {
    const mockOrder = {
      id: 'order-1',
      userId: 'user-1',
      status: OrderStatus.PENDING,
      items: [
        {
          id: 'item-1',
          productId: 'product-1',
          quantity: 2,
        },
      ],
    };

    it('should throw error if order not found', async () => {
      (prisma.order.findUnique as any).mockResolvedValue(null);

      await expect(orderService.cancelOrder('non-existent')).rejects.toMatchObject({
        message: 'Order not found',
        statusCode: 404,
      });
    });

    it('should throw error if order does not belong to user', async () => {
      (prisma.order.findUnique as any).mockResolvedValue(mockOrder);

      await expect(orderService.cancelOrder('order-1', 'different-user')).rejects.toMatchObject({
        message: 'Access denied',
        statusCode: 403,
      });
    });

    it('should throw error if order is already delivered', async () => {
      (prisma.order.findUnique as any).mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.DELIVERED,
      });

      await expect(orderService.cancelOrder('order-1')).rejects.toMatchObject({
        message: 'Cannot cancel delivered order',
        statusCode: 400,
      });
    });

    it('should throw error if order is already cancelled', async () => {
      (prisma.order.findUnique as any).mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.CANCELLED,
      });

      await expect(orderService.cancelOrder('order-1')).rejects.toMatchObject({
        message: 'Order is already cancelled',
        statusCode: 400,
      });
    });

    it('should successfully cancel order and restore stock', async () => {
      const cancelledOrder = {
        ...mockOrder,
        status: OrderStatus.CANCELLED,
      };

      (prisma.order.findUnique as any).mockResolvedValue(mockOrder);

      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        const tx = {
          product: {
            update: jest.fn().mockResolvedValue({}),
          },
          order: {
            update: jest.fn().mockResolvedValue(cancelledOrder),
          },
        };
        return callback(tx);
      });

      const result = await orderService.cancelOrder('order-1', 'user-1');

      expect(result.status).toBe(OrderStatus.CANCELLED);
    });
  });
});
