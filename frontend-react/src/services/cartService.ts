import api from './api';
import { ApiResponse, Cart } from '../types/api';

export const cartService = {
  // Get cart
  getCart: async (): Promise<Cart> => {
    const response = await api.get<ApiResponse<Cart>>('/cart');
    return response.data.data;
  },

  // Add item to cart
  addToCart: async (productId: string, quantity: number): Promise<Cart> => {
    const response = await api.post<ApiResponse<Cart>>('/cart/items', {
      productId,
      quantity,
    });
    return response.data.data;
  },

  // Update cart item
  updateCartItem: async (productId: string, quantity: number): Promise<Cart> => {
    const response = await api.put<ApiResponse<Cart>>(`/cart/items/${productId}`, {
      quantity,
    });
    return response.data.data;
  },

  // Remove cart item
  removeCartItem: async (productId: string): Promise<Cart> => {
    const response = await api.delete<ApiResponse<Cart>>(`/cart/items/${productId}`);
    return response.data.data;
  },

  // Clear cart
  clearCart: async (): Promise<void> => {
    await api.delete('/cart');
  },

  // Validate cart
  validateCart: async (): Promise<{
    isValid: boolean;
    errors: string[];
    cart: Cart;
  }> => {
    const response = await api.get<
      ApiResponse<{
        isValid: boolean;
        errors: string[];
        cart: Cart;
      }>
    >('/cart/validate');
    return response.data.data;
  },
};
