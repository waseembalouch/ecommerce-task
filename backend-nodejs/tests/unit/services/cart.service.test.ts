import * as cartService from '../../../src/services/cart.service';
import { redis } from '../../../src/config/redis';
import { prisma } from '../../../src/config/database';
import { AppError } from '../../../src/utils/AppError';

jest.mock('../../../src/config/redis', () => ({
  redis: {
    hgetall: jest.fn(),
    hget: jest.fn(),
    hset: jest.fn(),
    hdel: jest.fn(),
    del: jest.fn(),
    expire: jest.fn(),
  },
}));

describe('Cart Service', () => {
  const userId = 'user-1';
  const productId = 'product-1';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCart', () => {
    it('should return empty cart when no items exist', async () => {
      (redis.hgetall as jest.Mock).mockResolvedValue({});

      const result = await cartService.getCart(userId);

      expect(result).toEqual({
        items: [],
        totalItems: 0,
        subtotal: 0,
      });
      expect(redis.hgetall).toHaveBeenCalledWith(`cart:${userId}`);
    });

    it('should return cart with items', async () => {
      const mockProduct = {
        id: productId,
        name: 'Test Product',
        price: 99.99,
        comparePrice: 129.99,
        stock: 10,
        isActive: true,
        images: [],
        category: {
          id: 'cat-1',
          name: 'Category 1',
          slug: 'category-1',
        },
      };

      (redis.hgetall as jest.Mock).mockResolvedValue({
        [productId]: '2',
      });
      (prisma.product.findMany as jest.Mock).mockResolvedValue([mockProduct]);
      (redis.expire as jest.Mock).mockResolvedValue(1);

      const result = await cartService.getCart(userId);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].product.id).toBe(productId);
      expect(result.items[0].quantity).toBe(2);
      expect(result.totalItems).toBe(2);
      expect(result.subtotal).toBe(199.98);
      expect(redis.expire).toHaveBeenCalledWith(`cart:${userId}`, 604800);
    });
  });

  describe('addToCart', () => {
    const mockProduct = {
      id: productId,
      name: 'Test Product',
      price: 99.99,
      stock: 10,
      isActive: true,
      images: [],
    };

    it('should add item to cart successfully', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
      (redis.hget as jest.Mock).mockResolvedValue(null);
      (redis.hset as jest.Mock).mockResolvedValue(1);
      (redis.expire as jest.Mock).mockResolvedValue(1);
      (redis.hgetall as jest.Mock).mockResolvedValue({ [productId]: '2' });
      (prisma.product.findMany as jest.Mock).mockResolvedValue([
        { ...mockProduct, category: { id: 'cat-1', name: 'Category', slug: 'category' } },
      ]);

      const result = await cartService.addToCart(userId, productId, 2);

      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: productId },
        include: {
          images: { where: { isPrimary: true }, take: 1 },
        },
      });
      expect(redis.hset).toHaveBeenCalledWith(`cart:${userId}`, productId, '2');
      expect(result.items).toHaveLength(1);
    });

    it('should throw error if product not found', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(cartService.addToCart(userId, productId, 2)).rejects.toThrow(
        new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND')
      );
    });

    it('should throw error if product is not active', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue({
        ...mockProduct,
        isActive: false,
      });

      await expect(cartService.addToCart(userId, productId, 2)).rejects.toThrow(
        new AppError('Product is not available', 400, 'PRODUCT_UNAVAILABLE')
      );
    });

    it('should throw error if insufficient stock', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue({
        ...mockProduct,
        stock: 5,
      });
      (redis.hget as jest.Mock).mockResolvedValue(null);

      await expect(cartService.addToCart(userId, productId, 10)).rejects.toThrow(
        new AppError('Only 5 items available in stock', 400, 'INSUFFICIENT_STOCK')
      );
    });

    it('should remove item if new quantity is 0 or less', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
      (redis.hget as jest.Mock).mockResolvedValue('2');
      (redis.hdel as jest.Mock).mockResolvedValue(1);
      (redis.hgetall as jest.Mock).mockResolvedValue({});

      const result = await cartService.addToCart(userId, productId, -2);

      expect(redis.hdel).toHaveBeenCalledWith(`cart:${userId}`, productId);
      expect(result.items).toHaveLength(0);
    });
  });

  describe('updateCartItem', () => {
    const mockProduct = {
      id: productId,
      name: 'Test Product',
      price: 99.99,
      stock: 10,
      isActive: true,
    };

    it('should update item quantity successfully', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
      (redis.hset as jest.Mock).mockResolvedValue(1);
      (redis.expire as jest.Mock).mockResolvedValue(1);
      (redis.hgetall as jest.Mock).mockResolvedValue({ [productId]: '5' });
      (prisma.product.findMany as jest.Mock).mockResolvedValue([
        { ...mockProduct, images: [], category: { id: 'cat-1', name: 'Category', slug: 'category' } },
      ]);

      const result = await cartService.updateCartItem(userId, productId, 5);

      expect(redis.hset).toHaveBeenCalledWith(`cart:${userId}`, productId, '5');
      expect(result.items).toHaveLength(1);
    });

    it('should throw error if quantity is negative', async () => {
      await expect(cartService.updateCartItem(userId, productId, -1)).rejects.toThrow(
        new AppError('Quantity cannot be negative', 400, 'INVALID_QUANTITY')
      );
    });

    it('should throw error if product not found', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(cartService.updateCartItem(userId, productId, 2)).rejects.toThrow(
        new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND')
      );
    });

    it('should throw error if product is not active', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue({
        ...mockProduct,
        isActive: false,
      });

      await expect(cartService.updateCartItem(userId, productId, 2)).rejects.toThrow(
        new AppError('Product is not available', 400, 'PRODUCT_UNAVAILABLE')
      );
    });

    it('should throw error if insufficient stock', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue({
        ...mockProduct,
        stock: 5,
      });

      await expect(cartService.updateCartItem(userId, productId, 10)).rejects.toThrow(
        new AppError('Only 5 items available in stock', 400, 'INSUFFICIENT_STOCK')
      );
    });

    it('should remove item if quantity is 0', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
      (redis.hdel as jest.Mock).mockResolvedValue(1);
      (redis.hgetall as jest.Mock).mockResolvedValue({});

      const result = await cartService.updateCartItem(userId, productId, 0);

      expect(redis.hdel).toHaveBeenCalledWith(`cart:${userId}`, productId);
      expect(result.items).toHaveLength(0);
    });
  });

  describe('removeFromCart', () => {
    it('should remove item from cart', async () => {
      (redis.hdel as jest.Mock).mockResolvedValue(1);
      (redis.hgetall as jest.Mock).mockResolvedValue({});

      const result = await cartService.removeFromCart(userId, productId);

      expect(redis.hdel).toHaveBeenCalledWith(`cart:${userId}`, productId);
      expect(result.items).toHaveLength(0);
    });
  });

  describe('clearCart', () => {
    it('should clear entire cart', async () => {
      (redis.del as jest.Mock).mockResolvedValue(1);

      await cartService.clearCart(userId);

      expect(redis.del).toHaveBeenCalledWith(`cart:${userId}`);
    });
  });

  describe('validateCart', () => {
    it('should return valid for a valid cart', async () => {
      const mockProduct = {
        id: productId,
        name: 'Test Product',
        price: 99.99,
        comparePrice: 129.99,
        stock: 10,
        isActive: true,
        images: [],
        category: { id: 'cat-1', name: 'Category', slug: 'category' },
      };

      (redis.hgetall as jest.Mock).mockResolvedValue({ [productId]: '2' });
      (prisma.product.findMany as jest.Mock).mockResolvedValue([mockProduct]);
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
      (redis.expire as jest.Mock).mockResolvedValue(1);

      const result = await cartService.validateCart(userId);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect unavailable products', async () => {
      const mockProduct = {
        id: productId,
        name: 'Test Product',
        price: 99.99,
        stock: 10,
        isActive: true,
        images: [],
        category: { id: 'cat-1', name: 'Category', slug: 'category' },
      };

      (redis.hgetall as jest.Mock).mockResolvedValue({ [productId]: '2' });
      (prisma.product.findMany as jest.Mock).mockResolvedValue([mockProduct]);
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(null);
      (redis.hdel as jest.Mock).mockResolvedValue(1);
      (redis.expire as jest.Mock).mockResolvedValue(1);

      const result = await cartService.validateCart(userId);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Product Test Product is no longer available');
    });

    it('should detect inactive products', async () => {
      const mockProduct = {
        id: productId,
        name: 'Test Product',
        price: 99.99,
        stock: 10,
        isActive: true,
        images: [],
        category: { id: 'cat-1', name: 'Category', slug: 'category' },
      };

      (redis.hgetall as jest.Mock).mockResolvedValue({ [productId]: '2' });
      (prisma.product.findMany as jest.Mock).mockResolvedValue([mockProduct]);
      (prisma.product.findUnique as jest.Mock).mockResolvedValue({
        ...mockProduct,
        isActive: false,
      });
      (redis.hdel as jest.Mock).mockResolvedValue(1);
      (redis.expire as jest.Mock).mockResolvedValue(1);

      const result = await cartService.validateCart(userId);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Product Test Product is no longer available');
    });

    it('should detect insufficient stock', async () => {
      const mockProduct = {
        id: productId,
        name: 'Test Product',
        price: 99.99,
        stock: 10,
        isActive: true,
        images: [],
        category: { id: 'cat-1', name: 'Category', slug: 'category' },
      };

      (redis.hgetall as jest.Mock).mockResolvedValue({ [productId]: '15' });
      (prisma.product.findMany as jest.Mock).mockResolvedValue([mockProduct]);
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
      (redis.expire as jest.Mock).mockResolvedValue(1);

      const result = await cartService.validateCart(userId);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Only 10 items of Test Product available (you have 15 in cart)');
    });

    it('should detect price changes', async () => {
      const mockProduct = {
        id: productId,
        name: 'Test Product',
        price: 99.99,
        stock: 10,
        isActive: true,
        images: [],
        category: { id: 'cat-1', name: 'Category', slug: 'category' },
      };

      (redis.hgetall as jest.Mock).mockResolvedValue({ [productId]: '2' });
      (prisma.product.findMany as jest.Mock).mockResolvedValue([mockProduct]);
      (prisma.product.findUnique as jest.Mock).mockResolvedValue({
        ...mockProduct,
        price: 89.99,
      });
      (redis.expire as jest.Mock).mockResolvedValue(1);

      const result = await cartService.validateCart(userId);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Price of Test Product has changed');
    });
  });
});
