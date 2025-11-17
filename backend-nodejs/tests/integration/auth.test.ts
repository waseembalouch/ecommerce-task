import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/config/database';
import { hashPassword } from '../../src/utils/password';
import { generateToken } from '../../src/utils/jwt';

describe('Auth API Integration Tests', () => {
  describe('POST /api/auth/register', () => {
    const validRegistration = {
      email: 'newuser@example.com',
      password: 'Password123!',
      firstName: 'John',
      lastName: 'Doe',
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should register a new user successfully', async () => {
      const mockUser = {
        id: 'user-1',
        email: validRegistration.email,
        firstName: validRegistration.firstName,
        lastName: validRegistration.lastName,
        role: 'CUSTOMER',
        createdAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegistration)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(validRegistration.email);
      expect(response.body.data.user.passwordHash).toBeUndefined();
      expect(response.body.data.token).toBeDefined();
    });

    it('should return 400 if email already exists', async () => {
      const existingUser = {
        id: 'existing-user',
        email: validRegistration.email,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);

      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegistration)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('EMAIL_EXISTS');
      expect(response.body.error.message).toBe('Email already registered');
    });

    it('should return 400 for invalid email format', async () => {
      const invalidData = {
        ...validRegistration,
        email: 'invalid-email',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for weak password', async () => {
      const weakPassword = {
        ...validRegistration,
        password: '123',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(weakPassword)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for missing required fields', async () => {
      const incompleteData = {
        email: 'test@example.com',
        password: 'Password123!',
        // Missing firstName and lastName
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(incompleteData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/login', () => {
    const validLogin = {
      email: 'test@example.com',
      password: 'Password123!',
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should login successfully with valid credentials', async () => {
      const mockUser = {
        id: 'user-1',
        email: validLogin.email,
        passwordHash: await hashPassword(validLogin.password),
        firstName: 'John',
        lastName: 'Doe',
        role: 'CUSTOMER',
        createdAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLogin)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(validLogin.email);
      expect(response.body.data.user.passwordHash).toBeUndefined();
      expect(response.body.data.token).toBeDefined();
    });

    it('should return 401 for non-existent user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLogin)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 401 for incorrect password', async () => {
      const mockUser = {
        id: 'user-1',
        email: validLogin.email,
        passwordHash: await hashPassword('DifferentPassword123!'),
        firstName: 'John',
        lastName: 'Doe',
        role: 'CUSTOMER',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLogin)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 400 for missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user profile with valid token', async () => {
      const mockUserId = '550e8400-e29b-41d4-a716-446655440000';
      const mockUser = {
        id: mockUserId,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'CUSTOMER',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      // Generate a valid JWT token
      const token = generateToken({
        userId: mockUserId,
        email: mockUser.email,
        role: mockUser.role,
      });

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(mockUser.email);
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('token');
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
