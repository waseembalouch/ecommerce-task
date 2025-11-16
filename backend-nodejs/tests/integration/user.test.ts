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
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  },
}));

describe('User API Integration Tests', () => {
  let authToken: string;
  const mockUserId = 'user-123';

  beforeAll(() => {
    // Create a valid JWT token for testing
    authToken = jwt.sign(
      { userId: mockUserId, role: 'CUSTOMER' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUser = {
    id: mockUserId,
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'CUSTOMER',
    passwordHash: 'hashed_password',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('GET /api/users/profile', () => {
    it('should get current user profile', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('test@example.com');
    });

    it('should return 401 if not authenticated', async () => {
      await request(app)
        .get('/api/users/profile')
        .expect(401);
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should update user profile', async () => {
      const updateData = {
        firstName: 'Jane',
        lastName: 'Smith',
      };

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);
      (prisma.user.update as any).mockResolvedValue({
        ...mockUser,
        ...updateData,
      });

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe('Jane');
      expect(response.body.data.lastName).toBe('Smith');
    });

    it('should validate input data', async () => {
      const invalidData = {
        firstName: 'A', // Too short
      };

      await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);
    });
  });

  describe('POST /api/users/change-password', () => {
    it('should change password successfully', async () => {
      const passwordData = {
        currentPassword: 'OldPassword123',
        newPassword: 'NewPassword123',
      };

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);
      const bcrypt = await import('bcrypt');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('new_hashed_password' as never);
      (prisma.user.update as any).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/users/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Password changed successfully');
    });

    it('should validate password requirements', async () => {
      const invalidData = {
        currentPassword: 'short',
        newPassword: 'short', // Too short
      };

      await request(app)
        .post('/api/users/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);
    });
  });

  describe('Admin User Management', () => {
    let adminToken: string;

    beforeAll(() => {
      adminToken = jwt.sign(
        { userId: 'admin-123', role: 'ADMIN' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );
    });

    describe('GET /api/users', () => {
      it('should get all users (admin only)', async () => {
        const users = [mockUser, { ...mockUser, id: 'user-456' }];

        (prisma.user.findUnique as any).mockResolvedValue({
          id: 'admin-123',
          role: 'ADMIN',
        });
        (prisma.user.findMany as any).mockResolvedValue(users);
        (prisma.user.count as any).mockResolvedValue(2);

        const response = await request(app)
          .get('/api/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(2);
        expect(response.body.meta).toBeDefined();
      });

      it('should return 403 for non-admin users', async () => {
        (prisma.user.findUnique as any).mockResolvedValue(mockUser);

        await request(app)
          .get('/api/users')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);
      });

      it('should filter users by search', async () => {
        (prisma.user.findUnique as any).mockResolvedValue({
          id: 'admin-123',
          role: 'ADMIN',
        });
        (prisma.user.findMany as any).mockResolvedValue([mockUser]);
        (prisma.user.count as any).mockResolvedValue(1);

        const response = await request(app)
          .get('/api/users?search=john')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });

    describe('GET /api/users/:id', () => {
      it('should get user by ID (admin only)', async () => {
        const userWithStats = {
          ...mockUser,
          _count: {
            orders: 5,
            reviews: 3,
            addresses: 2,
          },
        };

        (prisma.user.findUnique as any)
          .mockResolvedValueOnce({ id: 'admin-123', role: 'ADMIN' })
          .mockResolvedValueOnce(userWithStats);

        const response = await request(app)
          .get(`/api/users/${mockUserId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data._count).toBeDefined();
      });

      it('should return 404 if user not found', async () => {
        (prisma.user.findUnique as any)
          .mockResolvedValueOnce({ id: 'admin-123', role: 'ADMIN' })
          .mockResolvedValueOnce(null);

        await request(app)
          .get('/api/users/invalid-id')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);
      });
    });

    describe('PATCH /api/users/:id/role', () => {
      it('should update user role (admin only)', async () => {
        (prisma.user.findUnique as any).mockResolvedValue({
          id: 'admin-123',
          role: 'ADMIN',
        });
        (prisma.user.update as any).mockResolvedValue({
          ...mockUser,
          role: 'ADMIN',
        });

        const response = await request(app)
          .patch(`/api/users/${mockUserId}/role`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ role: 'ADMIN' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.role).toBe('ADMIN');
      });

      it('should validate role value', async () => {
        (prisma.user.findUnique as any).mockResolvedValue({
          id: 'admin-123',
          role: 'ADMIN',
        });

        await request(app)
          .patch(`/api/users/${mockUserId}/role`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ role: 'INVALID_ROLE' })
          .expect(400);
      });
    });

    describe('DELETE /api/users/:id', () => {
      it('should delete user (admin only)', async () => {
        (prisma.user.findUnique as any)
          .mockResolvedValueOnce({ id: 'admin-123', role: 'ADMIN' })
          .mockResolvedValueOnce(mockUser);
        (prisma.user.delete as any).mockResolvedValue(mockUser);

        const response = await request(app)
          .delete(`/api/users/${mockUserId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('deleted successfully');
      });

      it('should return 403 for non-admin users', async () => {
        (prisma.user.findUnique as any).mockResolvedValue(mockUser);

        await request(app)
          .delete(`/api/users/${mockUserId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);
      });
    });
  });
});
