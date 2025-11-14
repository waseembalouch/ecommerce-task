import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as cartService from '../services/cart.service';

export const getCart = asyncHandler(async (req: Request, res: Response) => {
  const cart = await cartService.getCart(req.user!.id);

  res.json({
    success: true,
    data: cart,
  });
});

export const addToCart = asyncHandler(async (req: Request, res: Response) => {
  const { productId, quantity } = req.body;

  const cart = await cartService.addToCart(req.user!.id, productId, quantity);

  res.json({
    success: true,
    message: 'Item added to cart',
    data: cart,
  });
});

export const updateCartItem = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = req.params;
  const { quantity } = req.body;

  const cart = await cartService.updateCartItem(req.user!.id, productId, quantity);

  res.json({
    success: true,
    message: 'Cart item updated',
    data: cart,
  });
});

export const removeCartItem = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = req.params;

  const cart = await cartService.removeFromCart(req.user!.id, productId);

  res.json({
    success: true,
    message: 'Item removed from cart',
    data: cart,
  });
});

export const clearCart = asyncHandler(async (req: Request, res: Response) => {
  await cartService.clearCart(req.user!.id);

  res.json({
    success: true,
    message: 'Cart cleared',
  });
});

export const validateCart = asyncHandler(async (req: Request, res: Response) => {
  const result = await cartService.validateCart(req.user!.id);

  res.json({
    success: true,
    data: result,
  });
});
