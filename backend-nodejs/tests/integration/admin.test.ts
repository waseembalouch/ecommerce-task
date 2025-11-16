import { describe, it, expect, beforeAll, beforeEach} from '@jest/globals';
import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/config/database';
import * as jwt from 'jsonwebtoken';

// Mock prisma
jest.mock('../../src/config/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
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

describe('Admin API Integration Tests', () => {
  let adminToken: string;
  let customerToken: string;

  beforeAll(() => {
    adminToken = jwt.sign(
      { userId: 'admin-123', role: 'ADMIN' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    customerToken = jwt.sign(
      { userId: 'user-123', role: 'CUSTOMER' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/admin/dashboard', () => {
    it('should return dashboard statistics for admin', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        id: 'admin-123',
        role: 'ADMIN',
      });
      (prisma.user.count as any).mockResolvedValue(1250);
      (prisma.product.count as any).mockResolvedValue(450);
      (prisma.order.count as any).mockResolvedValue(3200);
      (prisma.order.aggregate as any).mockResolvedValue({
        _sum: { total: 156789.5 },
      });
      (prisma.order.findMany as any).mockResolvedValue([]);
      (prisma.product.findMany as any).mockResolvedValue([]);
      (prisma.orderItem.groupBy as any).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.overview).toBeDefined();
      expect(response.body.data.overview.totalUsers).toBe(1250);
      expect(response.body.data.overview.totalProducts).toBe(450);
      expect(response.body.data.overview.totalOrders).toBe(3200);
      expect(response.body.data.overview.totalRevenue).toBe(156789.5);
    });

    it('should return 403 for non-admin users', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        id: 'user-123',
        role: 'CUSTOMER',
      });

      await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });

    it('should return 401 if not authenticated', async () => {
      await request(app)
        .get('/api/admin/dashboard')
        .expect(401);
    });
  });

  describe('GET /api/admin/sales-stats', () => {
    it('should return sales statistics for month (default)', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        id: 'admin-123',
        role: 'ADMIN',
      });
      (prisma.order.findMany as any).mockResolvedValue([
        {
          createdAt: new Date(),
          total: 99.99,
          status: 'DELIVERED',
        },
      ]);

      const response = await request(app)
        .get('/api/admin/sales-stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.period).toBe('month');
      expect(response.body.data.summary).toBeDefined();
      expect(response.body.data.chartData).toBeDefined();
    });

    it('should return sales statistics for week', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        id: 'admin-123',
        role: 'ADMIN',
      });
      (prisma.order.findMany as any).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/admin/sales-stats?period=week')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.period).toBe('week');
    });

    it('should return sales statistics for year', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        id: 'admin-123',
        role: 'ADMIN',
      });
      (prisma.order.findMany as any).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/admin/sales-stats?period=year')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.period).toBe('year');
    });
  });

  describe('GET /api/admin/user-stats', () => {
    it('should return user statistics', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        id: 'admin-123',
        role: 'ADMIN',
      });
      (prisma.user.count as any)
        .mockResolvedValueOnce(1250)
        .mockResolvedValueOnce(1245)
        .mockResolvedValueOnce(5);
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
      (prisma.user.groupBy as any).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/admin/user-stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.summary).toBeDefined();
      expect(response.body.data.summary.totalUsers).toBe(1250);
      expect(response.body.data.recentUsers).toBeDefined();
    });
  });

  describe('GET /api/admin/product-stats', () => {
    it('should return product statistics', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        id: 'admin-123',
        role: 'ADMIN',
      });
      (prisma.product.count as any)
        .mockResolvedValueOnce(450)
        .mockResolvedValueOnce(420)
        .mockResolvedValueOnce(15);
      (prisma.category.findMany as any).mockResolvedValue([
        {
          id: 'cat-1',
          name: 'Electronics',
          _count: { products: 150 },
        },
      ]);

      const response = await request(app)
        .get('/api/admin/product-stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.summary).toBeDefined();
      expect(response.body.data.summary.totalProducts).toBe(450);
      expect(response.body.data.categoriesWithCount).toBeDefined();
    });
  });
});
