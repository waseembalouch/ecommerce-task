import { Router } from 'express';
import * as productController from '../controllers/product.controller';
import * as productImageController from '../controllers/productImage.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { uploadSingle, uploadMultiple } from '../middlewares/upload.middleware';
import {
  createProductSchema,
  updateProductSchema,
  getProductSchema,
  deleteProductSchema,
  getProductsSchema,
} from '../validators/product.schema';

const router = Router();

// Public routes
router.get('/', validate(getProductsSchema), productController.getProducts);
router.get('/:id', validate(getProductSchema), productController.getProduct);

// Admin routes
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  validate(createProductSchema),
  productController.createProduct
);

router.put(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate(updateProductSchema),
  productController.updateProduct
);

router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate(deleteProductSchema),
  productController.deleteProduct
);

// Product Image routes
// Get product images (public)
router.get('/:productId/images', productImageController.getImages);

// Upload single image (admin)
router.post(
  '/:productId/images',
  authenticate,
  authorize('ADMIN'),
  uploadSingle,
  productImageController.uploadImage
);

// Upload multiple images (admin)
router.post(
  '/:productId/images/bulk',
  authenticate,
  authorize('ADMIN'),
  uploadMultiple,
  productImageController.uploadMultipleImages
);

// Update image (admin)
router.put(
  '/:productId/images/:imageId',
  authenticate,
  authorize('ADMIN'),
  productImageController.updateImage
);

// Delete image (admin)
router.delete(
  '/:productId/images/:imageId',
  authenticate,
  authorize('ADMIN'),
  productImageController.deleteImage
);

export default router;
