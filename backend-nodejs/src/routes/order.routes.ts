import { Router } from 'express';
import * as orderController from '../controllers/order.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import {
  createOrderSchema,
  getOrdersSchema,
  getOrderByIdSchema,
  updateOrderStatusSchema,
  cancelOrderSchema,
} from '../validators/order.schema';

const router = Router();

// All order routes require authentication
router.use(authenticate);

// Create order (checkout)
router.post('/', validate(createOrderSchema), orderController.createOrder);

// Get orders (customers see their orders, admins see all)
router.get('/', validate(getOrdersSchema), orderController.getOrders);

// Get order by ID
router.get('/:id', validate(getOrderByIdSchema), orderController.getOrderById);

// Update order status (admin only)
router.patch(
  '/:id/status',
  authorize('ADMIN'),
  validate(updateOrderStatusSchema),
  orderController.updateOrderStatus
);

// Cancel order
router.post('/:id/cancel', validate(cancelOrderSchema), orderController.cancelOrder);

export default router;
