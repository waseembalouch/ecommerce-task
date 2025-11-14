import { z } from 'zod';

export const createReviewSchema = z.object({
  body: z.object({
    productId: z.string().uuid('Invalid product ID'),
    rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
    comment: z.string().min(1).max(1000).optional(),
  }),
});

export const updateReviewSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid review ID'),
  }),
  body: z.object({
    rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5').optional(),
    comment: z.string().min(1).max(1000).optional(),
  }),
});

export const getReviewsSchema = z.object({
  query: z.object({
    productId: z.string().uuid('Invalid product ID').optional(),
    userId: z.string().uuid('Invalid user ID').optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  }),
});

export const getReviewByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid review ID'),
  }),
});

export const deleteReviewSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid review ID'),
  }),
});

export const getProductRatingStatsSchema = z.object({
  params: z.object({
    productId: z.string().uuid('Invalid product ID'),
  }),
});
