import api from './api';
import type { ApiResponse, PaginatedResponse, Product } from '../types/api';

interface GetProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
}

// Transform product to convert price strings to numbers
const transformProduct = (product: any): Product => ({
  ...product,
  price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
  comparePrice: product.comparePrice ? (typeof product.comparePrice === 'string' ? parseFloat(product.comparePrice) : product.comparePrice) : undefined,
  images: product.images || [],
});

export const productService = {
  // Get all products with filters
  getProducts: async (params?: GetProductsParams): Promise<PaginatedResponse<Product>> => {
    const response = await api.get<any>('/products', { params });
    return {
      ...response.data,
      data: response.data.data.map(transformProduct),
    };
  },

  // Get product by ID
  getProductById: async (id: string): Promise<Product> => {
    const response = await api.get<ApiResponse<any>>(`/products/${id}`);
    return transformProduct(response.data.data);
  },

  // Create product (Admin)
  createProduct: async (data: Partial<Product>): Promise<Product> => {
    const response = await api.post<ApiResponse<Product>>('/products', data);
    return response.data.data;
  },

  // Update product (Admin)
  updateProduct: async (id: string, data: Partial<Product>): Promise<Product> => {
    const response = await api.put<ApiResponse<Product>>(`/products/${id}`, data);
    return response.data.data;
  },

  // Delete product (Admin)
  deleteProduct: async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`);
  },
};
