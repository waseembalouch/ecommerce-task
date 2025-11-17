import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/config/database';
import { generateToken } from '../../src/utils/jwt';

// Mock prisma
jest.mock('../../src/config/database', () => ({
  prisma: {
    product: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    category: {
      findUnique: jest.fn(),
    },
    review: {
      aggregate: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

describe('Product API Integration Tests', () => {
  const adminToken = generateToken({
    userId: '450e8400-e29b-41d4-a716-446655440004',
    email: 'admin@example.com',
    role: 'ADMIN',
  });
  const customerToken = generateToken({
    userId: '450e8400-e29b-41d4-a716-446655440005',
    email: 'customer@example.com',
    role: 'CUSTOMER',
  });

  describe('GET /api/products', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return paginated products list', async () => {
      const mockProducts = [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'Product 1',
          slug: '550e8400-e29b-41d4-a716-446655440001',
          description: 'Description 1',
          price: 99.99,
          sku: 'SKU-001',
          categoryId: '650e8400-e29b-41d4-a716-446655440002',
          stock: 10,
          isActive: true,
          category: { id: '650e8400-e29b-41d4-a716-446655440002', name: 'Category 1' },
          images: [{ id: '750e8400-e29b-41d4-a716-446655440003', url: '/image1.jpg', isPrimary: true }],
        },
      ];

      (prisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);
      (prisma.product.count as jest.Mock).mockResolvedValue(1);

      const response = await request(app)
        .get('/api/products')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.total).toBe(1);
    });

    it('should filter products by search query', async () => {
      (prisma.product.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.product.count as jest.Mock).mockResolvedValue(0);

      const response = await request(app)
        .get('/api/products?search=laptop')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: expect.objectContaining({ contains: 'laptop' }) }),
            ]),
          }),
        })
      );
    });

    it('should filter products by category', async () => {
      (prisma.product.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.product.count as jest.Mock).mockResolvedValue(0);

      const response = await request(app)
        .get('/api/products?category=650e8400-e29b-41d4-a716-446655440002')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should filter products by price range', async () => {
      (prisma.product.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.product.count as jest.Mock).mockResolvedValue(0);

      const response = await request(app)
        .get('/api/products?minPrice=100&maxPrice=500')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            price: { gte: 100, lte: 500 },
          }),
        })
      );
    });

    it('should support pagination', async () => {
      (prisma.product.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.product.count as jest.Mock).mockResolvedValue(100);

      const response = await request(app)
        .get('/api/products?page=2&limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.pagination.page).toBe(2);
      expect(response.body.pagination.limit).toBe(10);
      expect(response.body.pagination.totalPages).toBe(10);
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
    });

    it('should support sorting', async () => {
      (prisma.product.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.product.count as jest.Mock).mockResolvedValue(0);

      const response = await request(app)
        .get('/api/products?sort=-price')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { price: 'desc' },
        })
      );
    });
  });

  describe('GET /api/products/:id', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return product by id', async () => {
      const mockProduct = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Test Product',
        slug: 'test-product',
        description: 'Test description',
        price: 99.99,
        sku: 'TEST-001',
        categoryId: '650e8400-e29b-41d4-a716-446655440002',
        stock: 10,
        isActive: true,
        category: { id: '650e8400-e29b-41d4-a716-446655440002', name: 'Category 1' },
        images: [],
        _count: { reviews: 5 },
      };

      (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
      (prisma.review.aggregate as jest.Mock).mockResolvedValue({
        _avg: { rating: 4.5 },
      });

      const response = await request(app)
        .get('/api/products/550e8400-e29b-41d4-a716-446655440001')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('550e8400-e29b-41d4-a716-446655440001');
      expect(response.body.data.name).toBe('Test Product');
    });

    it('should return 404 for non-existent product', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/products/999e8400-e29b-41d4-a716-446655440099')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PRODUCT_NOT_FOUND');
    });
  });

  describe('POST /api/products', () => {
    const validProductData = {
      name: 'New Product',
      slug: 'new-product',
      description: 'New product description',
      price: 149.99,
      sku: 'NEW-001',
      categoryId: '650e8400-e29b-41d4-a716-446655440002',
      stock: 50,
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should create product with admin token', async () => {
      const mockUser = {
        id: '450e8400-e29b-41d4-a716-446655440004',
        email: 'admin@example.com',
        role: 'ADMIN',
      };
      const mockProduct = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        ...validProductData,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.product.findUnique as jest.Mock)
        .mockResolvedValueOnce(null) // slug check
        .mockResolvedValueOnce(null); // sku check
      (prisma.category.findUnique as jest.Mock).mockResolvedValue({
        id: validProductData.categoryId,
        name: 'Test Category',
      });
      (prisma.product.create as jest.Mock).mockResolvedValue(mockProduct);

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validProductData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(validProductData.name);
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .post('/api/products')
        .send(validProductData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 403 for non-admin user', async () => {
      const mockUser = {
        id: '450e8400-e29b-41d4-a716-446655440005',
        email: 'customer@example.com',
        role: 'CUSTOMER',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(validProductData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('permission');
    });

    it('should return 400 for invalid data', async () => {
      const mockUser = {
        id: '450e8400-e29b-41d4-a716-446655440004',
        email: 'admin@example.com',
        role: 'ADMIN',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const invalidData = {
        name: 'Test',
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PUT /api/products/:id', () => {
    const updateData = {
      name: 'Updated Product',
      price: 199.99,
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should update product with admin token', async () => {
      const mockUser = {
        id: '450e8400-e29b-41d4-a716-446655440004',
        email: 'admin@example.com',
        role: 'ADMIN',
      };
      const existingProduct = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Old Name',
        price: 99.99,
      };
      const updatedProduct = {
        ...existingProduct,
        ...updateData,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(existingProduct);
      (prisma.product.update as jest.Mock).mockResolvedValue(updatedProduct);

      const response = await request(app)
        .put('/api/products/550e8400-e29b-41d4-a716-446655440001')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.price).toBe(updateData.price);
    });

    it('should return 404 for non-existent product', async () => {
      const mockUser = {
        id: '450e8400-e29b-41d4-a716-446655440004',
        email: 'admin@example.com',
        role: 'ADMIN',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/products/999e8400-e29b-41d4-a716-446655440099')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PRODUCT_NOT_FOUND');
    });
  });

  describe('DELETE /api/products/:id', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should delete product with admin token', async () => {
      const mockUser = {
        id: '450e8400-e29b-41d4-a716-446655440004',
        email: 'admin@example.com',
        role: 'ADMIN',
      };
      const existingProduct = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Test Product',
        _count: { orderItems: 0 },
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(existingProduct);
      (prisma.product.delete as jest.Mock).mockResolvedValue(existingProduct);

      const response = await request(app)
        .delete('/api/products/550e8400-e29b-41d4-a716-446655440001')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted');
    });

    it('should return 403 for non-admin user', async () => {
      const mockUser = {
        id: '450e8400-e29b-41d4-a716-446655440005',
        email: 'customer@example.com',
        role: 'CUSTOMER',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .delete('/api/products/550e8400-e29b-41d4-a716-446655440001')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent product', async () => {
      const mockUser = {
        id: '450e8400-e29b-41d4-a716-446655440004',
        email: 'admin@example.com',
        role: 'ADMIN',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/products/999e8400-e29b-41d4-a716-446655440099')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});
