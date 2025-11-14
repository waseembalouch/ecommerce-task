import { Router } from 'express';
import * as reviewController from '../controllers/review.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import {
  createReviewSchema,
  updateReviewSchema,
  getReviewsSchema,
  getReviewByIdSchema,
  deleteReviewSchema,
  getProductRatingStatsSchema,
} from '../validators/review.schema';

const router = Router();

// Public routes
router.get('/', validate(getReviewsSchema), reviewController.getReviews);
router.get('/:id', validate(getReviewByIdSchema), reviewController.getReviewById);
router.get('/stats/:productId', validate(getProductRatingStatsSchema), reviewController.getProductRatingStats);

// Protected routes
router.post('/', authenticate, validate(createReviewSchema), reviewController.createReview);
router.put('/:id', authenticate, validate(updateReviewSchema), reviewController.updateReview);
router.delete('/:id', authenticate, validate(deleteReviewSchema), reviewController.deleteReview);

export default router;
