import { Router } from 'express';
import * as cartController from '../controllers/cart.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import {
  addToCartSchema,
  updateCartItemSchema,
  removeCartItemSchema,
} from '../validators/cart.schema';

const router = Router();

// All cart routes require authentication
router.use(authenticate);

// Get cart
router.get('/', cartController.getCart);

// Add item to cart
router.post('/items', validate(addToCartSchema), cartController.addToCart);

// Update cart item quantity
router.put('/items/:productId', validate(updateCartItemSchema), cartController.updateCartItem);

// Remove item from cart
router.delete('/items/:productId', validate(removeCartItemSchema), cartController.removeCartItem);

// Clear entire cart
router.delete('/', cartController.clearCart);

// Validate cart (check stock, prices, availability)
router.get('/validate', cartController.validateCart);

export default router;
