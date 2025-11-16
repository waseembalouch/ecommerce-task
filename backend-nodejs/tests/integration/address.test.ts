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
    },
    address: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe('Address API Integration Tests', () => {
  let authToken: string;
  const mockUserId = 'user-123';

  beforeAll(() => {
    authToken = jwt.sign(
      { userId: mockUserId, role: 'CUSTOMER' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockAddress = {
    id: 'address-123',
    userId: mockUserId,
    street: '123 Main St',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'USA',
    isDefault: false,
    createdAt: new Date(),
  };

  describe('POST /api/addresses', () => {
    it('should create a new address', async () => {
      const addressData = {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
        isDefault: false,
      };

      (prisma.user.findUnique as any).mockResolvedValue({
        id: mockUserId,
        role: 'CUSTOMER',
      });
      (prisma.address.create as any).mockResolvedValue(mockAddress);

      const response = await request(app)
        .post('/api/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(addressData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.street).toBe('123 Main St');
    });

    it('should unset other default addresses when creating default address', async () => {
      const addressData = {
        street: '456 Oak Ave',
        city: 'Boston',
        state: 'MA',
        zipCode: '02101',
        country: 'USA',
        isDefault: true,
      };

      (prisma.user.findUnique as any).mockResolvedValue({
        id: mockUserId,
        role: 'CUSTOMER',
      });
      (prisma.address.updateMany as any).mockResolvedValue({ count: 1 });
      (prisma.address.create as any).mockResolvedValue({
        ...mockAddress,
        ...addressData,
      });

      const response = await request(app)
        .post('/api/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(addressData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(prisma.address.updateMany).toHaveBeenCalled();
    });

    it('should validate required fields', async () => {
      const invalidData = {
        street: '123 Main St',
        // Missing required fields
      };

      (prisma.user.findUnique as any).mockResolvedValue({
        id: mockUserId,
        role: 'CUSTOMER',
      });

      await request(app)
        .post('/api/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);
    });

    it('should return 401 if not authenticated', async () => {
      await request(app)
        .post('/api/addresses')
        .send(mockAddress)
        .expect(401);
    });
  });

  describe('GET /api/addresses', () => {
    it('should get all addresses for current user', async () => {
      const addresses = [
        mockAddress,
        { ...mockAddress, id: 'address-456', isDefault: true },
      ];

      (prisma.user.findUnique as any).mockResolvedValue({
        id: mockUserId,
        role: 'CUSTOMER',
      });
      (prisma.address.findMany as any).mockResolvedValue(addresses);

      const response = await request(app)
        .get('/api/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe('GET /api/addresses/:id', () => {
    it('should get address by ID', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        id: mockUserId,
        role: 'CUSTOMER',
      });
      (prisma.address.findUnique as any).mockResolvedValue(mockAddress);

      const response = await request(app)
        .get(`/api/addresses/${mockAddress.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(mockAddress.id);
    });

    it('should return 404 if address not found', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        id: mockUserId,
        role: 'CUSTOMER',
      });
      (prisma.address.findUnique as any).mockResolvedValue(null);

      await request(app)
        .get('/api/addresses/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 403 if accessing another user\'s address', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        id: mockUserId,
        role: 'CUSTOMER',
      });
      (prisma.address.findUnique as any).mockResolvedValue({
        ...mockAddress,
        userId: 'other-user-id',
      });

      await request(app)
        .get(`/api/addresses/${mockAddress.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });
  });

  describe('PUT /api/addresses/:id', () => {
    it('should update address', async () => {
      const updateData = {
        street: '789 Pine St',
        city: 'Chicago',
      };

      (prisma.user.findUnique as any).mockResolvedValue({
        id: mockUserId,
        role: 'CUSTOMER',
      });
      (prisma.address.findUnique as any).mockResolvedValue(mockAddress);
      (prisma.address.update as any).mockResolvedValue({
        ...mockAddress,
        ...updateData,
      });

      const response = await request(app)
        .put(`/api/addresses/${mockAddress.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.street).toBe('789 Pine St');
    });

    it('should handle setting address as default', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        id: mockUserId,
        role: 'CUSTOMER',
      });
      (prisma.address.findUnique as any).mockResolvedValue(mockAddress);
      (prisma.address.updateMany as any).mockResolvedValue({ count: 1 });
      (prisma.address.update as any).mockResolvedValue({
        ...mockAddress,
        isDefault: true,
      });

      const response = await request(app)
        .put(`/api/addresses/${mockAddress.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ isDefault: true })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(prisma.address.updateMany).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/addresses/:id', () => {
    it('should delete address', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        id: mockUserId,
        role: 'CUSTOMER',
      });
      (prisma.address.findUnique as any).mockResolvedValue(mockAddress);
      (prisma.address.delete as any).mockResolvedValue(mockAddress);

      const response = await request(app)
        .delete(`/api/addresses/${mockAddress.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');
    });

    it('should return 403 if deleting another user\'s address', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        id: mockUserId,
        role: 'CUSTOMER',
      });
      (prisma.address.findUnique as any).mockResolvedValue({
        ...mockAddress,
        userId: 'other-user-id',
      });

      await request(app)
        .delete(`/api/addresses/${mockAddress.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });
  });
});
