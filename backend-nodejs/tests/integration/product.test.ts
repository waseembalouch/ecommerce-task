import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/config/database';
import { generateToken } from '../../src/utils/jwt';

describe('Product API Integration Tests', () => {
  const adminToken = generateToken({
    userId: 'admin-user-id',
    email: 'admin@example.com',
    role: 'ADMIN',
  });
  const customerToken = generateToken({
    userId: 'customer-user-id',
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
          id: 'product-1',
          name: 'Product 1',
          slug: 'product-1',
          description: 'Description 1',
          price: 99.99,
          sku: 'SKU-001',
          categoryId: 'cat-1',
          stock: 10,
          isActive: true,
          category: { id: 'cat-1', name: 'Category 1' },
          images: [{ id: 'img-1', url: '/image1.jpg', isPrimary: true }],
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
      expect(response.body.meta).toBeDefined();
      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.total).toBe(1);
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
        .get('/api/products?category=electronics')
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
      expect(response.body.meta.page).toBe(2);
      expect(response.body.meta.limit).toBe(10);
      expect(response.body.meta.totalPages).toBe(10);
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
        id: 'product-1',
        name: 'Test Product',
        slug: 'test-product',
        description: 'Test description',
        price: 99.99,
        sku: 'TEST-001',
        categoryId: 'cat-1',
        stock: 10,
        isActive: true,
        category: { id: 'cat-1', name: 'Category 1' },
        images: [],
      };

      (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);

      const response = await request(app)
        .get('/api/products/product-1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('product-1');
      expect(response.body.data.name).toBe('Test Product');
    });

    it('should return 404 for non-existent product', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/products/non-existent')
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
      categoryId: 'cat-1',
      stock: 50,
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should create product with admin token', async () => {
      const mockUser = {
        id: 'admin-user-id',
        email: 'admin@example.com',
        role: 'ADMIN',
      };
      const mockProduct = {
        id: 'product-1',
        ...validProductData,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(null);
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
        id: 'customer-user-id',
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
        id: 'admin-user-id',
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
        id: 'admin-user-id',
        email: 'admin@example.com',
        role: 'ADMIN',
      };
      const existingProduct = {
        id: 'product-1',
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
        .put('/api/products/product-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.price).toBe(updateData.price);
    });

    it('should return 404 for non-existent product', async () => {
      const mockUser = {
        id: 'admin-user-id',
        email: 'admin@example.com',
        role: 'ADMIN',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/products/non-existent')
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
        id: 'admin-user-id',
        email: 'admin@example.com',
        role: 'ADMIN',
      };
      const existingProduct = {
        id: 'product-1',
        name: 'Test Product',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(existingProduct);
      (prisma.product.delete as jest.Mock).mockResolvedValue(existingProduct);

      const response = await request(app)
        .delete('/api/products/product-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted');
    });

    it('should return 403 for non-admin user', async () => {
      const mockUser = {
        id: 'customer-user-id',
        email: 'customer@example.com',
        role: 'CUSTOMER',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .delete('/api/products/product-1')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent product', async () => {
      const mockUser = {
        id: 'admin-user-id',
        email: 'admin@example.com',
        role: 'ADMIN',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/products/non-existent')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});
