import * as authService from '../../../src/services/auth.service';
import { prisma } from '../../../src/config/database';
import { hashPassword, comparePassword } from '../../../src/utils/password';
import { generateToken } from '../../../src/utils/jwt';
import { AppError } from '../../../src/utils/AppError';

jest.mock('../../../src/utils/password');
jest.mock('../../../src/utils/jwt');

describe('Auth Service', () => {
  describe('register', () => {
    const validRegisterData = {
      email: 'test@example.com',
      password: 'Password123!',
      firstName: 'John',
      lastName: 'Doe',
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should successfully register a new user', async () => {
      const hashedPassword = 'hashed_password_123';
      const mockUser = {
        id: 'user-1',
        email: validRegisterData.email,
        firstName: validRegisterData.firstName,
        lastName: validRegisterData.lastName,
        role: 'CUSTOMER',
        createdAt: new Date(),
      };
      const mockToken = 'jwt_token_123';

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (hashPassword as jest.Mock).mockResolvedValue(hashedPassword);
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);
      (generateToken as jest.Mock).mockReturnValue(mockToken);

      const result = await authService.register(validRegisterData);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: validRegisterData.email },
      });
      expect(hashPassword).toHaveBeenCalledWith(validRegisterData.password);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: validRegisterData.email,
          passwordHash: hashedPassword,
          firstName: validRegisterData.firstName,
          lastName: validRegisterData.lastName,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
        },
      });
      expect(generateToken).toHaveBeenCalledWith(mockUser.id, mockUser.role);
      expect(result).toEqual({
        user: mockUser,
        token: mockToken,
      });
    });

    it('should throw error if email already exists', async () => {
      const existingUser = {
        id: 'existing-user',
        email: validRegisterData.email,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);

      await expect(authService.register(validRegisterData)).rejects.toThrow(
        new AppError('Email already registered', 400, 'EMAIL_EXISTS')
      );

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: validRegisterData.email },
      });
      expect(hashPassword).not.toHaveBeenCalled();
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should handle database errors during registration', async () => {
      const dbError = new Error('Database connection failed');

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (hashPassword as jest.Mock).mockResolvedValue('hashed_password');
      (prisma.user.create as jest.Mock).mockRejectedValue(dbError);

      await expect(authService.register(validRegisterData)).rejects.toThrow(dbError);
    });
  });

  describe('login', () => {
    const validLoginData = {
      email: 'test@example.com',
      password: 'Password123!',
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should successfully login with valid credentials', async () => {
      const mockUser = {
        id: 'user-1',
        email: validLoginData.email,
        passwordHash: 'hashed_password',
        firstName: 'John',
        lastName: 'Doe',
        role: 'CUSTOMER',
        createdAt: new Date(),
      };
      const mockToken = 'jwt_token_123';

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (comparePassword as jest.Mock).mockResolvedValue(true);
      (generateToken as jest.Mock).mockReturnValue(mockToken);

      const result = await authService.login(validLoginData);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: validLoginData.email },
      });
      expect(comparePassword).toHaveBeenCalledWith(
        validLoginData.password,
        mockUser.passwordHash
      );
      expect(generateToken).toHaveBeenCalledWith(mockUser.id, mockUser.role);
      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          role: mockUser.role,
          createdAt: mockUser.createdAt,
        },
        token: mockToken,
      });
    });

    it('should throw error if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(authService.login(validLoginData)).rejects.toThrow(
        new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS')
      );

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: validLoginData.email },
      });
      expect(comparePassword).not.toHaveBeenCalled();
    });

    it('should throw error if password is incorrect', async () => {
      const mockUser = {
        id: 'user-1',
        email: validLoginData.email,
        passwordHash: 'hashed_password',
        firstName: 'John',
        lastName: 'Doe',
        role: 'CUSTOMER',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (comparePassword as jest.Mock).mockResolvedValue(false);

      await expect(authService.login(validLoginData)).rejects.toThrow(
        new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS')
      );

      expect(comparePassword).toHaveBeenCalledWith(
        validLoginData.password,
        mockUser.passwordHash
      );
      expect(generateToken).not.toHaveBeenCalled();
    });
  });
});
