import api from './api';
import type { ApiResponse, User, Address } from '../types/api';

interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export const userService = {
  // Get current user profile
  getProfile: async (): Promise<User> => {
    const response = await api.get<ApiResponse<User>>('/users/profile');
    return response.data.data;
  },

  // Update user profile
  updateProfile: async (data: UpdateProfileData): Promise<User> => {
    const response = await api.patch<ApiResponse<User>>('/users/profile', data);
    return response.data.data;
  },

  // Change password
  changePassword: async (data: ChangePasswordData): Promise<void> => {
    await api.patch('/users/change-password', data);
  },

  // Get user addresses
  getAddresses: async (): Promise<Address[]> => {
    const response = await api.get<ApiResponse<Address[]>>('/users/addresses');
    return response.data.data;
  },

  // Create new address
  createAddress: async (data: Partial<Address>): Promise<Address> => {
    const response = await api.post<ApiResponse<Address>>('/users/addresses', data);
    return response.data.data;
  },

  // Update address
  updateAddress: async (id: string, data: Partial<Address>): Promise<Address> => {
    const response = await api.patch<ApiResponse<Address>>(`/users/addresses/${id}`, data);
    return response.data.data;
  },

  // Delete address
  deleteAddress: async (id: string): Promise<void> => {
    await api.delete(`/users/addresses/${id}`);
  },
};
