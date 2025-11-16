import { describe, it, expect, beforeEach} from '@jest/globals';
import { prisma } from '../../../src/config/database';
import * as userService from '../../../src/services/user.service';
import * as bcrypt from 'bcrypt';

// Mock dependencies
jest.mock('../../../src/config/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  },
}));

jest.mock('bcrypt');

describe('User Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'CUSTOMER',
    passwordHash: 'hashed_password',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('getUserProfile', () => {
    it('should return user profile successfully', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(mockUser);

      const result = await userService.getUserProfile('user-123');

      expect(result).toBeDefined();
      expect(result.email).toBe('test@example.com');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: expect.objectContaining({
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        }),
      });
    });

    it('should throw error if user not found', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);

      await expect(userService.getUserProfile('invalid-id')).rejects.toThrow('User not found');
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      const updateData = {
        firstName: 'Jane',
        lastName: 'Smith',
      };

      (prisma.user.update as any).mockResolvedValue({
        ...mockUser,
        ...updateData,
      });

      const result = await userService.updateProfile('user-123', updateData);

      expect(result.firstName).toBe('Jane');
      expect(result.lastName).toBe('Smith');
      expect(prisma.user.update).toHaveBeenCalled();
    });

    it('should throw error if email already in use', async () => {
      const updateData = {
        email: 'existing@example.com',
      };

      (prisma.user.findUnique as any).mockResolvedValue({
        id: 'other-user',
        email: 'existing@example.com',
      });

      await expect(userService.updateProfile('user-123', updateData)).rejects.toThrow(
        'Email already in use'
      );
    });

    it('should allow updating email if not taken', async () => {
      const updateData = {
        email: 'newemail@example.com',
      };

      (prisma.user.findUnique as any).mockResolvedValue(null);
      (prisma.user.update as any).mockResolvedValue({
        ...mockUser,
        email: 'newemail@example.com',
      });

      const result = await userService.updateProfile('user-123', updateData);

      expect(result.email).toBe('newemail@example.com');
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const passwordData = {
        currentPassword: 'OldPassword123',
        newPassword: 'NewPassword123',
      };

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);
      (bcrypt.compare as any).mockResolvedValue(true);
      (bcrypt.hash as any).mockResolvedValue('new_hashed_password');
      (prisma.user.update as any).mockResolvedValue(mockUser);

      const result = await userService.changePassword('user-123', passwordData);

      expect(result.message).toBe('Password changed successfully');
      expect(bcrypt.compare).toHaveBeenCalledWith('OldPassword123', mockUser.passwordHash);
      expect(prisma.user.update).toHaveBeenCalled();
    });

    it('should throw error if current password is incorrect', async () => {
      const passwordData = {
        currentPassword: 'WrongPassword',
        newPassword: 'NewPassword123',
      };

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);
      (bcrypt.compare as any).mockResolvedValue(false);

      await expect(userService.changePassword('user-123', passwordData)).rejects.toThrow(
        'Current password is incorrect'
      );
    });
  });

  describe('getUsers (Admin)', () => {
    it('should return paginated users', async () => {
      const users = [mockUser, { ...mockUser, id: 'user-456' }];

      (prisma.user.findMany as any).mockResolvedValue(users);
      (prisma.user.count as any).mockResolvedValue(2);

      const result = await userService.getUsers({
        page: 1,
        limit: 20,
      });

      expect(result.users).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.totalPages).toBe(1);
    });

    it('should filter users by search query', async () => {
      (prisma.user.findMany as any).mockResolvedValue([mockUser]);
      (prisma.user.count as any).mockResolvedValue(1);

      await userService.getUsers({
        page: 1,
        limit: 20,
        search: 'john',
      });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        })
      );
    });

    it('should filter users by role', async () => {
      (prisma.user.findMany as any).mockResolvedValue([mockUser]);
      (prisma.user.count as any).mockResolvedValue(1);

      await userService.getUsers({
        page: 1,
        limit: 20,
        role: 'ADMIN',
      });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            role: 'ADMIN',
          }),
        })
      );
    });
  });

  describe('getUserById (Admin)', () => {
    it('should return user with stats', async () => {
      const userWithStats = {
        ...mockUser,
        _count: {
          orders: 5,
          reviews: 3,
          addresses: 2,
        },
      };

      (prisma.user.findUnique as any).mockResolvedValue(userWithStats);

      const result = await userService.getUserById('user-123');

      expect(result).toBeDefined();
      expect(result._count.orders).toBe(5);
    });

    it('should throw error if user not found', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);

      await expect(userService.getUserById('invalid-id')).rejects.toThrow('User not found');
    });
  });

  describe('updateUserRole (Admin)', () => {
    it('should update user role successfully', async () => {
      (prisma.user.update as any).mockResolvedValue({
        ...mockUser,
        role: 'ADMIN',
      });

      const result = await userService.updateUserRole('user-123', 'ADMIN');

      expect(result.role).toBe('ADMIN');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { role: 'ADMIN' },
        select: expect.any(Object),
      });
    });
  });

  describe('deleteUser (Admin)', () => {
    it('should delete user successfully', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(mockUser);
      (prisma.user.delete as any).mockResolvedValue(mockUser);

      const result = await userService.deleteUser('user-123');

      expect(result.message).toBe('User deleted successfully');
      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
    });

    it('should throw error if user not found', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);

      await expect(userService.deleteUser('invalid-id')).rejects.toThrow('User not found');
    });
  });
});
