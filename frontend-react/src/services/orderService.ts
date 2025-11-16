import api from './api';
import type { ApiResponse, Order } from '../types/api';

export const orderService = {
  // Get user's orders
  getOrders: async (): Promise<Order[]> => {
    const response = await api.get<ApiResponse<Order[]>>('/orders');
    return response.data.data;
  },

  // Get order by ID
  getOrderById: async (id: string): Promise<Order> => {
    const response = await api.get<ApiResponse<Order>>(`/orders/${id}`);
    return response.data.data;
  },

  // Create order
  createOrder: async (orderData: any): Promise<Order> => {
    const response = await api.post<ApiResponse<Order>>('/orders', orderData);
    return response.data.data;
  },

  // Cancel order
  cancelOrder: async (id: string): Promise<Order> => {
    const response = await api.patch<ApiResponse<Order>>(`/orders/${id}/cancel`);
    return response.data.data;
  },

  // Update order status (admin only)
  updateOrderStatus: async (id: string, status: string): Promise<Order> => {
    const response = await api.patch<ApiResponse<Order>>(`/orders/${id}/status`, { status });
    return response.data.data;
  },
};
