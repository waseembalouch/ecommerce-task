import * as productService from '../../../src/services/product.service';
import { prisma } from '../../../src/config/database';

// Mock prisma
jest.mock('../../../src/config/database', () => ({
  prisma: {
    product: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
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
  },
}));

describe('Product Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createProduct', () => {
    const validProductData = {
      name: 'Test Product',
      slug: 'test-product',
      description: 'This is a test product',
      price: 99.99,
      comparePrice: 129.99,
      cost: 50.0,
      sku: 'TEST-001',
      categoryId: 'category-1',
      stock: 100,
      isActive: true,
    };

    it('should successfully create a new product', async () => {
      const mockProduct = {
        id: 'product-1',
        ...validProductData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.product.findUnique as any)
        .mockResolvedValueOnce(null) // slug check
        .mockResolvedValueOnce(null); // sku check
      (prisma.category.findUnique as any).mockResolvedValue({
        id: 'category-1',
        name: 'Test Category',
      });
      (prisma.product.create as any).mockResolvedValue(mockProduct);

      const result = await productService.createProduct(validProductData);

      expect(result).toEqual(mockProduct);
    });

    it('should throw error if slug already exists', async () => {
      const existingProduct = {
        id: 'existing-product',
        slug: validProductData.slug,
      };

      (prisma.product.findUnique as any).mockResolvedValue(existingProduct);

      await expect(productService.createProduct(validProductData)).rejects.toMatchObject({
        message: 'Product with this slug already exists',
        statusCode: 400,
      });
    });

    it('should throw error if SKU already exists', async () => {
      const existingProduct = {
        id: 'existing-product',
        sku: validProductData.sku,
      };

      (prisma.product.findUnique as any)
        .mockResolvedValueOnce(null) // slug check passes
        .mockResolvedValueOnce(existingProduct); // sku check fails

      await expect(productService.createProduct(validProductData)).rejects.toMatchObject({
        message: 'Product with this SKU already exists',
        statusCode: 400,
      });
    });

    it('should throw error if category not found', async () => {
      (prisma.product.findUnique as any)
        .mockResolvedValueOnce(null) // slug check
        .mockResolvedValueOnce(null); // sku check
      (prisma.category.findUnique as any).mockResolvedValue(null);

      await expect(productService.createProduct(validProductData)).rejects.toMatchObject({
        message: 'Category not found',
        statusCode: 404,
      });
    });
  });

  describe('getProducts', () => {
    const defaultParams = {
      page: 1,
      limit: 20,
    };

    it('should return paginated products', async () => {
      const mockProducts = [
        {
          id: 'product-1',
          name: 'Product 1',
          price: 99.99,
        },
        {
          id: 'product-2',
          name: 'Product 2',
          price: 149.99,
        },
      ];
      const totalCount = 50;

      (prisma.product.findMany as any).mockResolvedValue(mockProducts);
      (prisma.product.count as any).mockResolvedValue(totalCount);

      const result = await productService.getProducts(defaultParams);

      expect(result.products).toEqual(mockProducts);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 50,
        totalPages: 3,
      });
    });

    it('should filter products by search query', async () => {
      const searchParams = {
        ...defaultParams,
        search: 'laptop',
      };

      (prisma.product.findMany as any).mockResolvedValue([]);
      (prisma.product.count as any).mockResolvedValue(0);

      await productService.getProducts(searchParams);

      expect(prisma.product.findMany).toHaveBeenCalled();
      const callArgs = (prisma.product.findMany as any).mock.calls[0][0];
      expect(callArgs.where.OR).toBeDefined();
      expect(callArgs.where.OR).toContainEqual({
        name: { contains: 'laptop', mode: 'insensitive' },
      });
    });

    it('should filter products by category', async () => {
      const categoryParams = {
        ...defaultParams,
        category: 'category-1',
      };

      (prisma.product.findMany as any).mockResolvedValue([]);
      (prisma.product.count as any).mockResolvedValue(0);

      await productService.getProducts(categoryParams);

      const callArgs = (prisma.product.findMany as any).mock.calls[0][0];
      expect(callArgs.where.categoryId).toBe('category-1');
    });

    it('should filter products by price range', async () => {
      const priceParams = {
        ...defaultParams,
        minPrice: 50,
        maxPrice: 200,
      };

      (prisma.product.findMany as any).mockResolvedValue([]);
      (prisma.product.count as any).mockResolvedValue(0);

      await productService.getProducts(priceParams);

      const callArgs = (prisma.product.findMany as any).mock.calls[0][0];
      expect(callArgs.where.price).toEqual({
        gte: 50,
        lte: 200,
      });
    });

    it('should apply sorting', async () => {
      const sortParams = {
        ...defaultParams,
        sort: '-price',
      };

      (prisma.product.findMany as any).mockResolvedValue([]);
      (prisma.product.count as any).mockResolvedValue(0);

      await productService.getProducts(sortParams);

      const callArgs = (prisma.product.findMany as any).mock.calls[0][0];
      expect(callArgs.orderBy).toEqual({ price: 'desc' });
    });
  });

  describe('getProductById', () => {
    it('should return product by id with average rating', async () => {
      const productId = 'product-1';
      const mockProduct = {
        id: productId,
        name: 'Test Product',
        price: 99.99,
        category: { id: 'cat-1', name: 'Category 1' },
        images: [],
        reviews: [],
        _count: { reviews: 5 },
      };

      (prisma.product.findUnique as any).mockResolvedValue(mockProduct);
      (prisma.review.aggregate as any).mockResolvedValue({
        _avg: { rating: 4.5 },
      });

      const result = await productService.getProductById(productId);

      expect(result.id).toBe(productId);
      expect(result.averageRating).toBe(4.5);
    });

    it('should throw error if product not found', async () => {
      const productId = 'non-existent';

      (prisma.product.findUnique as any).mockResolvedValue(null);

      await expect(productService.getProductById(productId)).rejects.toMatchObject({
        message: 'Product not found',
        statusCode: 404,
      });
    });
  });

  describe('updateProduct', () => {
    const productId = 'product-1';
    const updateData = {
      name: 'Updated Product',
      price: 129.99,
    };

    it('should successfully update a product', async () => {
      const existingProduct = {
        id: productId,
        name: 'Old Name',
        price: 99.99,
        slug: 'old-slug',
        sku: 'OLD-SKU',
      };
      const updatedProduct = {
        ...existingProduct,
        ...updateData,
      };

      (prisma.product.findUnique as any).mockResolvedValue(existingProduct);
      (prisma.product.update as any).mockResolvedValue(updatedProduct);

      const result = await productService.updateProduct(productId, updateData);

      expect(result.name).toBe('Updated Product');
      expect(result.price).toBe(129.99);
    });

    it('should throw error if product not found', async () => {
      (prisma.product.findUnique as any).mockResolvedValue(null);

      await expect(productService.updateProduct(productId, updateData)).rejects.toMatchObject({
        message: 'Product not found',
        statusCode: 404,
      });
    });

    it('should check slug uniqueness when updating', async () => {
      const existingProduct = {
        id: productId,
        slug: 'old-slug',
        sku: 'OLD-SKU',
      };
      const updateWithSlug = {
        slug: 'new-slug',
      };

      (prisma.product.findUnique as any)
        .mockResolvedValueOnce(existingProduct) // initial product check
        .mockResolvedValueOnce({ id: 'other-product', slug: 'new-slug' }); // slug exists check

      await expect(productService.updateProduct(productId, updateWithSlug)).rejects.toMatchObject({
        message: 'Product with this slug already exists',
        statusCode: 400,
      });
    });
  });

  describe('deleteProduct', () => {
    const productId = 'product-1';

    it('should successfully delete a product with no orders', async () => {
      const existingProduct = {
        id: productId,
        name: 'Test Product',
        _count: { orderItems: 0 },
      };

      (prisma.product.findUnique as any).mockResolvedValue(existingProduct);
      (prisma.product.delete as any).mockResolvedValue(existingProduct);

      const result = await productService.deleteProduct(productId);

      expect(result.message).toContain('deleted successfully');
      expect(prisma.product.delete).toHaveBeenCalledWith({
        where: { id: productId },
      });
    });

    it('should deactivate product if it has orders', async () => {
      const existingProduct = {
        id: productId,
        name: 'Test Product',
        _count: { orderItems: 5 },
      };

      (prisma.product.findUnique as any).mockResolvedValue(existingProduct);
      (prisma.product.update as any).mockResolvedValue({ ...existingProduct, isActive: false });

      const result = await productService.deleteProduct(productId);

      expect(result.message).toContain('deactivated');
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: productId },
        data: { isActive: false },
      });
      expect(prisma.product.delete).not.toHaveBeenCalled();
    });

    it('should throw error if product not found', async () => {
      (prisma.product.findUnique as any).mockResolvedValue(null);

      await expect(productService.deleteProduct(productId)).rejects.toMatchObject({
        message: 'Product not found',
        statusCode: 404,
      });
    });
  });
});
