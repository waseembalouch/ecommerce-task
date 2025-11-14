import { prisma } from '../config/database';
import { AppError } from '../utils/AppError';

interface CreateReviewInput {
  userId: string;
  productId: string;
  rating: number;
  comment?: string;
}

interface UpdateReviewInput {
  rating?: number;
  comment?: string;
}

interface GetReviewsParams {
  productId?: string;
  userId?: string;
  page?: number;
  limit?: number;
}

export const createReview = async (input: CreateReviewInput) => {
  const { userId, productId, rating, comment } = input;

  // Validate product exists
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
  }

  // Check if user has already reviewed this product
  const existingReview = await prisma.review.findUnique({
    where: {
      productId_userId: {
        productId,
        userId,
      },
    },
  });

  if (existingReview) {
    throw new AppError(
      'You have already reviewed this product',
      400,
      'REVIEW_EXISTS'
    );
  }

  // Optional: Check if user has purchased this product
  const hasPurchased = await prisma.orderItem.findFirst({
    where: {
      productId,
      order: {
        userId,
        status: { in: ['DELIVERED', 'CONFIRMED', 'PROCESSING', 'SHIPPED'] },
      },
    },
  });

  if (!hasPurchased) {
    throw new AppError(
      'You can only review products you have purchased',
      403,
      'PURCHASE_REQUIRED'
    );
  }

  // Create review
  const review = await prisma.review.create({
    data: {
      userId,
      productId,
      rating,
      comment,
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  return review;
};

export const getReviews = async (params: GetReviewsParams) => {
  const { productId, userId, page = 1, limit = 20 } = params;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (productId) {
    where.productId = productId;
  }

  if (userId) {
    where.userId = userId;
  }

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.review.count({ where }),
  ]);

  return {
    reviews,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getReviewById = async (reviewId: string) => {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  if (!review) {
    throw new AppError('Review not found', 404, 'REVIEW_NOT_FOUND');
  }

  return review;
};

export const updateReview = async (
  reviewId: string,
  userId: string,
  input: UpdateReviewInput
) => {
  // Verify review exists and belongs to user
  const existingReview = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!existingReview) {
    throw new AppError('Review not found', 404, 'REVIEW_NOT_FOUND');
  }

  if (existingReview.userId !== userId) {
    throw new AppError('Access denied', 403, 'FORBIDDEN');
  }

  // Update review
  const review = await prisma.review.update({
    where: { id: reviewId },
    data: input,
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  return review;
};

export const deleteReview = async (reviewId: string, userId: string) => {
  // Verify review exists and belongs to user
  const existingReview = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!existingReview) {
    throw new AppError('Review not found', 404, 'REVIEW_NOT_FOUND');
  }

  if (existingReview.userId !== userId) {
    throw new AppError('Access denied', 403, 'FORBIDDEN');
  }

  // Delete review
  await prisma.review.delete({
    where: { id: reviewId },
  });
};

export const getProductRatingStats = async (productId: string) => {
  // Validate product exists
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
  }

  // Get rating statistics
  const stats = await prisma.review.groupBy({
    by: ['rating'],
    where: { productId },
    _count: {
      rating: true,
    },
  });

  // Calculate average rating and total reviews
  const totalReviews = stats.reduce((sum, stat) => sum + stat._count.rating, 0);
  const totalRating = stats.reduce(
    (sum, stat) => sum + stat.rating * stat._count.rating,
    0
  );
  const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;

  // Format rating distribution
  const distribution = [1, 2, 3, 4, 5].map((rating) => {
    const stat = stats.find((s) => s.rating === rating);
    const count = stat?._count.rating || 0;
    const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

    return {
      rating,
      count,
      percentage: parseFloat(percentage.toFixed(2)),
    };
  });

  return {
    productId,
    averageRating: parseFloat(averageRating.toFixed(2)),
    totalReviews,
    distribution,
  };
};
