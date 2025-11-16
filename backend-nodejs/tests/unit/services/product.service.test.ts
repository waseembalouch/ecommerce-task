import * as productService from '../../../src/services/product.service';
import { prisma } from '../../../src/config/database';
import { AppError } from '../../../src/utils/AppError';

describe('Product Service', () => {
  describe('createProduct', () => {
    const validProductData = {
      name: 'Test Product',
      slug: 'test-product',
      description: 'This is a test product',
      price: 99.99,
      comparePrice: 129.99,
      cost: 50.00,
      sku: 'TEST-001',
      categoryId: 'category-1',
      stock: 100,
      isActive: true,
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should successfully create a new product', async () => {
      const mockProduct = {
        id: 'product-1',
        ...validProductData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.product.findUnique as jest.Mock)
        .mockResolvedValueOnce(null) // slug check
        .mockResolvedValueOnce(null); // sku check
      (prisma.product.create as jest.Mock).mockResolvedValue(mockProduct);

      const result = await productService.createProduct(validProductData);

      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { slug: validProductData.slug },
      });
      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { sku: validProductData.sku },
      });
      expect(prisma.product.create).toHaveBeenCalledWith({
        data: validProductData,
        include: {
          category: true,
          images: true,
        },
      });
      expect(result).toEqual(mockProduct);
    });

    it('should throw error if slug already exists', async () => {
      const existingProduct = {
        id: 'existing-product',
        slug: validProductData.slug,
      };

      (prisma.product.findUnique as jest.Mock).mockResolvedValue(existingProduct);

      await expect(productService.createProduct(validProductData)).rejects.toThrow(
        new AppError('Product with this slug already exists', 400, 'SLUG_EXISTS')
      );

      expect(prisma.product.create).not.toHaveBeenCalled();
    });

    it('should throw error if SKU already exists', async () => {
      const existingProduct = {
        id: 'existing-product',
        sku: validProductData.sku,
      };

      (prisma.product.findUnique as jest.Mock)
        .mockResolvedValueOnce(null) // slug check passes
        .mockResolvedValueOnce(existingProduct); // sku check fails

      await expect(productService.createProduct(validProductData)).rejects.toThrow(
        new AppError('Product with this SKU already exists', 400, 'SKU_EXISTS')
      );

      expect(prisma.product.create).not.toHaveBeenCalled();
    });
  });

  describe('getProducts', () => {
    const defaultParams = {
      page: 1,
      limit: 20,
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return paginated products', async () => {
      const mockProducts = [
        {
          id: 'product-1',
          name: 'Product 1',
          price: 99.99,
          isActive: true,
        },
        {
          id: 'product-2',
          name: 'Product 2',
          price: 149.99,
          isActive: true,
        },
      ];
      const totalCount = 50;

      (prisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);
      (prisma.product.count as jest.Mock).mockResolvedValue(totalCount);

      const result = await productService.getProducts(defaultParams);

      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        skip: 0,
        take: 20,
        include: {
          category: true,
          images: {
            where: { isPrimary: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(prisma.product.count).toHaveBeenCalledWith({
        where: { isActive: true },
      });
      expect(result).toEqual({
        products: mockProducts,
        total: totalCount,
        page: 1,
        limit: 20,
        totalPages: 3,
      });
    });

    it('should filter products by search query', async () => {
      const searchParams = {
        ...defaultParams,
        search: 'laptop',
      };

      (prisma.product.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.product.count as jest.Mock).mockResolvedValue(0);

      await productService.getProducts(searchParams);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
            OR: [
              { name: { contains: 'laptop', mode: 'insensitive' } },
              { description: { contains: 'laptop', mode: 'insensitive' } },
            ],
          }),
        })
      );
    });

    it('should filter products by category', async () => {
      const categoryParams = {
        ...defaultParams,
        category: 'category-1',
      };

      (prisma.product.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.product.count as jest.Mock).mockResolvedValue(0);

      await productService.getProducts(categoryParams);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
            categoryId: 'category-1',
          }),
        })
      );
    });

    it('should filter products by price range', async () => {
      const priceParams = {
        ...defaultParams,
        minPrice: 50,
        maxPrice: 200,
      };

      (prisma.product.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.product.count as jest.Mock).mockResolvedValue(0);

      await productService.getProducts(priceParams);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
            price: {
              gte: 50,
              lte: 200,
            },
          }),
        })
      );
    });

    it('should apply sorting', async () => {
      const sortParams = {
        ...defaultParams,
        sort: '-price',
      };

      (prisma.product.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.product.count as jest.Mock).mockResolvedValue(0);

      await productService.getProducts(sortParams);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { price: 'desc' },
        })
      );
    });
  });

  describe('getProductById', () => {
    it('should return product by id', async () => {
      const productId = 'product-1';
      const mockProduct = {
        id: productId,
        name: 'Test Product',
        price: 99.99,
        category: { id: 'cat-1', name: 'Category 1' },
        images: [],
      };

      (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);

      const result = await productService.getProductById(productId);

      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: productId },
        include: {
          category: true,
          images: {
            orderBy: { order: 'asc' },
          },
        },
      });
      expect(result).toEqual(mockProduct);
    });

    it('should throw error if product not found', async () => {
      const productId = 'non-existent';

      (prisma.product.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(productService.getProductById(productId)).rejects.toThrow(
        new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND')
      );
    });
  });

  describe('updateProduct', () => {
    const productId = 'product-1';
    const updateData = {
      name: 'Updated Product',
      price: 129.99,
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should successfully update a product', async () => {
      const existingProduct = {
        id: productId,
        name: 'Old Name',
        price: 99.99,
      };
      const updatedProduct = {
        ...existingProduct,
        ...updateData,
      };

      (prisma.product.findUnique as jest.Mock).mockResolvedValue(existingProduct);
      (prisma.product.update as jest.Mock).mockResolvedValue(updatedProduct);

      const result = await productService.updateProduct(productId, updateData);

      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: productId },
      });
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: productId },
        data: updateData,
        include: {
          category: true,
          images: true,
        },
      });
      expect(result).toEqual(updatedProduct);
    });

    it('should throw error if product not found', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(productService.updateProduct(productId, updateData)).rejects.toThrow(
        new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND')
      );

      expect(prisma.product.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteProduct', () => {
    const productId = 'product-1';

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should successfully delete a product', async () => {
      const existingProduct = {
        id: productId,
        name: 'Test Product',
      };

      (prisma.product.findUnique as jest.Mock).mockResolvedValue(existingProduct);
      (prisma.product.delete as jest.Mock).mockResolvedValue(existingProduct);

      await productService.deleteProduct(productId);

      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: productId },
      });
      expect(prisma.product.delete).toHaveBeenCalledWith({
        where: { id: productId },
      });
    });

    it('should throw error if product not found', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(productService.deleteProduct(productId)).rejects.toThrow(
        new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND')
      );

      expect(prisma.product.delete).not.toHaveBeenCalled();
    });
  });
});
