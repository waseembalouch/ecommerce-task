import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as reviewService from '../services/review.service';

export const createReview = asyncHandler(async (req: Request, res: Response) => {
  const { productId, rating, comment } = req.body;

  const review = await reviewService.createReview({
    userId: req.user!.id,
    productId,
    rating,
    comment,
  });

  res.status(201).json({
    success: true,
    message: 'Review created successfully',
    data: review,
  });
});

export const getReviews = asyncHandler(async (req: Request, res: Response) => {
  const { productId, userId, page, limit } = req.query;

  const result = await reviewService.getReviews({
    productId: productId as string,
    userId: userId as string,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });

  res.json({
    success: true,
    data: result.reviews,
    meta: result.pagination,
  });
});

export const getReviewById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const review = await reviewService.getReviewById(id);

  res.json({
    success: true,
    data: review,
  });
});

export const updateReview = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;

  const review = await reviewService.updateReview(id, req.user!.id, updateData);

  res.json({
    success: true,
    message: 'Review updated successfully',
    data: review,
  });
});

export const deleteReview = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  await reviewService.deleteReview(id, req.user!.id);

  res.json({
    success: true,
    message: 'Review deleted successfully',
  });
});

export const getProductRatingStats = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = req.params;

  const stats = await reviewService.getProductRatingStats(productId);

  res.json({
    success: true,
    data: stats,
  });
});
