import { describe, it, expect, beforeEach} from '@jest/globals';
import { prisma } from '../../../src/config/database';
import * as adminService from '../../../src/services/admin.service';

// Mock dependencies
jest.mock('../../../src/config/database', () => ({
  prisma: {
    user: {
      count: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    product: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    order: {
      count: jest.fn(),
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
    orderItem: {
      groupBy: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
    },
  },
}));

describe('Admin Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboardStats', () => {
    it('should return complete dashboard statistics', async () => {
      // Mock all the parallel promises
      (prisma.user.count as any).mockResolvedValue(1250);
      (prisma.product.count as any).mockResolvedValue(450);
      (prisma.order.count as any).mockResolvedValue(3200);
      (prisma.order.aggregate as any).mockResolvedValue({
        _sum: { total: 156789.5 },
      });
      (prisma.order.findMany as any).mockResolvedValue([
        {
          id: 'order-1',
          orderNumber: 'ORD-001',
          total: 99.99,
          createdAt: new Date(),
          user: {
            id: 'user-1',
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
          },
        },
      ]);
      (prisma.product.findMany as any).mockResolvedValue([
        {
          id: 'product-1',
          name: 'Low Stock Product',
          sku: 'SKU-001',
          stock: 5,
          price: 29.99,
        },
      ]);
      (prisma.orderItem.groupBy as any).mockResolvedValue([
        {
          productId: 'product-1',
          _sum: { quantity: 100, total: 2999 },
        },
      ]);

      const result = await adminService.getDashboardStats();

      expect(result.overview).toBeDefined();
      expect(result.overview.totalUsers).toBe(1250);
      expect(result.overview.totalProducts).toBe(450);
      expect(result.overview.totalOrders).toBe(3200);
      expect(result.overview.totalRevenue).toBe(156789.5);
      expect(result.recentOrders).toHaveLength(1);
      expect(result.lowStockProducts).toHaveLength(1);
      expect(result.topSellingProducts).toBeDefined();
    });
  });

  describe('getSalesStats', () => {
    it('should return sales statistics for month', async () => {
      const mockOrders = [
        {
          createdAt: new Date('2024-01-15'),
          total: 99.99,
          status: 'DELIVERED',
        },
        {
          createdAt: new Date('2024-01-15'),
          total: 149.99,
          status: 'CONFIRMED',
        },
        {
          createdAt: new Date('2024-01-16'),
          total: 75.50,
          status: 'SHIPPED',
        },
      ];

      (prisma.order.findMany as any).mockResolvedValue(mockOrders);

      const result = await adminService.getSalesStats('month');

      expect(result.period).toBe('month');
      expect(result.summary.totalRevenue).toBe(325.48);
      expect(result.summary.totalOrders).toBe(3);
      expect(result.summary.averageOrderValue).toBeCloseTo(108.49, 2);
      expect(result.chartData).toBeDefined();
      expect(result.chartData.length).toBeGreaterThan(0);
      expect(result.statusBreakdown).toBeDefined();
    });

    it('should return sales statistics for week', async () => {
      (prisma.order.findMany as any).mockResolvedValue([]);

      const result = await adminService.getSalesStats('week');

      expect(result.period).toBe('week');
      expect(result.summary.totalRevenue).toBe(0);
      expect(result.summary.totalOrders).toBe(0);
    });

    it('should return sales statistics for year', async () => {
      (prisma.order.findMany as any).mockResolvedValue([]);

      const result = await adminService.getSalesStats('year');

      expect(result.period).toBe('year');
    });
  });

  describe('getUserStats', () => {
    it('should return user statistics', async () => {
      (prisma.user.count as any)
        .mockResolvedValueOnce(1250) // total users
        .mockResolvedValueOnce(1245) // customers
        .mockResolvedValueOnce(5); // admins

      (prisma.user.findMany as any).mockResolvedValue([
        {
          id: 'user-1',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'CUSTOMER',
          createdAt: new Date(),
          _count: { orders: 5 },
        },
      ]);

      (prisma.user.groupBy as any).mockResolvedValue([
        { createdAt: new Date(), _count: 10 },
      ]);

      const result = await adminService.getUserStats();

      expect(result.summary.totalUsers).toBe(1250);
      expect(result.summary.customerCount).toBe(1245);
      expect(result.summary.adminCount).toBe(5);
      expect(result.recentUsers).toHaveLength(1);
      expect(result.growthData).toBeDefined();
    });
  });

  describe('getProductStats', () => {
    it('should return product statistics', async () => {
      (prisma.product.count as any)
        .mockResolvedValueOnce(450) // total
        .mockResolvedValueOnce(420) // active
        .mockResolvedValueOnce(15); // out of stock

      (prisma.category.findMany as any).mockResolvedValue([
        {
          id: 'cat-1',
          name: 'Electronics',
          _count: { products: 150 },
        },
        {
          id: 'cat-2',
          name: 'Clothing',
          _count: { products: 200 },
        },
      ]);

      const result = await adminService.getProductStats();

      expect(result.summary.totalProducts).toBe(450);
      expect(result.summary.activeProducts).toBe(420);
      expect(result.summary.outOfStockCount).toBe(15);
      expect(result.categoriesWithCount).toHaveLength(2);
      expect(result.categoriesWithCount[0].name).toBe('Electronics');
    });
  });
});
