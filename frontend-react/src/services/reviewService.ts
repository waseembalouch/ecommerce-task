import api from './api';
import type { ApiResponse, Review } from '../types/api';

interface CreateReviewData {
  productId: string;
  rating: number;
  comment: string;
}

export const reviewService = {
  // Get reviews for a product
  getProductReviews: async (productId: string): Promise<Review[]> => {
    const response = await api.get<ApiResponse<Review[]>>(`/products/${productId}/reviews`);
    return response.data.data;
  },

  // Create a review
  createReview: async (data: CreateReviewData): Promise<Review> => {
    const response = await api.post<ApiResponse<Review>>('/reviews', data);
    return response.data.data;
  },

  // Update a review
  updateReview: async (id: string, data: { rating?: number; comment?: string }): Promise<Review> => {
    const response = await api.patch<ApiResponse<Review>>(`/reviews/${id}`, data);
    return response.data.data;
  },

  // Delete a review
  deleteReview: async (id: string): Promise<void> => {
    await api.delete(`/reviews/${id}`);
  },
};
