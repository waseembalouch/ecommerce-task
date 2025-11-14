import { redis } from '../config/redis';
import { prisma } from '../config/database';
import { AppError } from '../utils/AppError';

interface CartItem {
  product: any;
  quantity: number;
}

interface Cart {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
}

const CART_PREFIX = 'cart:';
const CART_TTL = 60 * 60 * 24 * 7; // 7 days

export const getCart = async (userId: string): Promise<Cart> => {
  const cartKey = `${CART_PREFIX}${userId}`;

  // Get all cart items from Redis hash
  const cartData = await redis.hgetall(cartKey);

  if (!cartData || Object.keys(cartData).length === 0) {
    return {
      items: [],
      totalItems: 0,
      subtotal: 0,
    };
  }

  // Get product details for all items in cart
  const productIds = Object.keys(cartData);
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      isActive: true,
    },
    include: {
      images: true,
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  // Build cart items with product details
  const items: CartItem[] = products.map((product) => {
    const quantity = parseInt(cartData[product.id], 10);
    return {
      product: {
        ...product,
        price: product.price.toString(),
        comparePrice: product.comparePrice?.toString(),
      },
      quantity,
    };
  });

  // Calculate totals
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + parseFloat(item.product.price) * item.quantity, 0);

  // Refresh TTL
  await redis.expire(cartKey, CART_TTL);

  return {
    items,
    totalItems,
    subtotal,
  };
};

export const addToCart = async (
  userId: string,
  productId: string,
  quantity: number
): Promise<Cart> => {
  // Validate product exists and is active
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      images: {
        where: { isPrimary: true },
        take: 1,
      },
    },
  });

  if (!product) {
    throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
  }

  if (!product.isActive) {
    throw new AppError('Product is not available', 400, 'PRODUCT_UNAVAILABLE');
  }

  // Check stock availability
  const cartKey = `${CART_PREFIX}${userId}`;
  const currentQuantity = await redis.hget(cartKey, productId);
  const newQuantity = (parseInt(currentQuantity || '0', 10) + quantity);

  if (newQuantity > product.stock) {
    throw new AppError(
      `Only ${product.stock} items available in stock`,
      400,
      'INSUFFICIENT_STOCK'
    );
  }

  if (newQuantity <= 0) {
    // Remove item if quantity is 0 or less
    await redis.hdel(cartKey, productId);
  } else {
    // Add/update item in cart
    await redis.hset(cartKey, productId, newQuantity.toString());
    await redis.expire(cartKey, CART_TTL);
  }

  // Return updated cart
  return getCart(userId);
};

export const updateCartItem = async (
  userId: string,
  productId: string,
  quantity: number
): Promise<Cart> => {
  if (quantity < 0) {
    throw new AppError('Quantity cannot be negative', 400, 'INVALID_QUANTITY');
  }

  // Validate product exists and is active
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
  }

  if (!product.isActive) {
    throw new AppError('Product is not available', 400, 'PRODUCT_UNAVAILABLE');
  }

  // Check stock
  if (quantity > product.stock) {
    throw new AppError(
      `Only ${product.stock} items available in stock`,
      400,
      'INSUFFICIENT_STOCK'
    );
  }

  const cartKey = `${CART_PREFIX}${userId}`;

  if (quantity === 0) {
    // Remove item from cart
    await redis.hdel(cartKey, productId);
  } else {
    // Update quantity
    await redis.hset(cartKey, productId, quantity.toString());
    await redis.expire(cartKey, CART_TTL);
  }

  // Return updated cart
  return getCart(userId);
};

export const removeFromCart = async (
  userId: string,
  productId: string
): Promise<Cart> => {
  const cartKey = `${CART_PREFIX}${userId}`;
  await redis.hdel(cartKey, productId);

  // Return updated cart
  return getCart(userId);
};

export const clearCart = async (userId: string): Promise<void> => {
  const cartKey = `${CART_PREFIX}${userId}`;
  await redis.del(cartKey);
};

export const validateCart = async (userId: string): Promise<{
  isValid: boolean;
  errors: string[];
  cart: Cart;
}> => {
  const cart = await getCart(userId);
  const errors: string[] = [];

  // Validate each item
  for (const item of cart.items) {
    const product = await prisma.product.findUnique({
      where: { id: item.product.id },
    });

    if (!product) {
      errors.push(`Product ${item.product.name} is no longer available`);
      await removeFromCart(userId, item.product.id);
      continue;
    }

    if (!product.isActive) {
      errors.push(`Product ${item.product.name} is no longer available`);
      await removeFromCart(userId, item.product.id);
      continue;
    }

    if (item.quantity > product.stock) {
      errors.push(
        `Only ${product.stock} items of ${item.product.name} available (you have ${item.quantity} in cart)`
      );
    }

    // Check if price has changed
    if (parseFloat(product.price.toString()) !== parseFloat(item.product.price)) {
      errors.push(`Price of ${item.product.name} has changed`);
    }
  }

  // Get updated cart after removing unavailable items
  const updatedCart = await getCart(userId);

  return {
    isValid: errors.length === 0,
    errors,
    cart: updatedCart,
  };
};
