import { Router } from 'express';
import * as categoryController from '../controllers/category.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import {
  createCategorySchema,
  updateCategorySchema,
  getCategorySchema,
  deleteCategorySchema,
} from '../validators/category.schema';

const router = Router();

// Public routes
router.get('/', categoryController.getCategories);
router.get('/:id', validate(getCategorySchema), categoryController.getCategory);

// Admin routes
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  validate(createCategorySchema),
  categoryController.createCategory
);

router.put(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate(updateCategorySchema),
  categoryController.updateCategory
);

router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate(deleteCategorySchema),
  categoryController.deleteCategory
);

export default router;
