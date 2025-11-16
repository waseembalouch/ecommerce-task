import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard E2E', () => {
  // Note: In a real scenario, you'd create an admin user or use seeded data
  const adminUser = {
    email: 'admin@example.com',
    password: 'AdminPassword123!',
  };

  let adminToken: string;

  test.beforeAll(async ({ request }) => {
    // Login as admin (assuming admin user exists or needs to be created first)
    // In real tests, you'd seed admin user in database
    const loginResponse = await request.post('http://localhost:3000/api/auth/login', {
      data: {
        email: adminUser.email,
        password: adminUser.password,
      },
    });

    if (loginResponse.ok()) {
      const data = await loginResponse.json();
      adminToken = data.data.token;
    }
  });

  test('should get dashboard statistics', async ({ request }) => {
    test.skip(!adminToken, 'Admin user not available');

    const response = await request.get('http://localhost:3000/api/admin/dashboard', {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.overview).toBeDefined();
    expect(data.data.overview.totalUsers).toBeGreaterThanOrEqual(0);
    expect(data.data.overview.totalProducts).toBeGreaterThanOrEqual(0);
    expect(data.data.overview.totalOrders).toBeGreaterThanOrEqual(0);
    expect(data.data.overview.totalRevenue).toBeGreaterThanOrEqual(0);
  });

  test('should get sales statistics for different periods', async ({ request }) => {
    test.skip(!adminToken, 'Admin user not available');

    // Test week period
    const weekResponse = await request.get('http://localhost:3000/api/admin/sales-stats?period=week', {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    expect(weekResponse.ok()).toBeTruthy();
    const weekData = await weekResponse.json();
    expect(weekData.data.period).toBe('week');

    // Test month period
    const monthResponse = await request.get('http://localhost:3000/api/admin/sales-stats?period=month', {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    expect(monthResponse.ok()).toBeTruthy();
    const monthData = await monthResponse.json();
    expect(monthData.data.period).toBe('month');
  });

  test('should get user statistics', async ({ request }) => {
    test.skip(!adminToken, 'Admin user not available');

    const response = await request.get('http://localhost:3000/api/admin/user-stats', {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.summary).toBeDefined();
    expect(data.data.summary.totalUsers).toBeGreaterThanOrEqual(0);
  });

  test('should get product statistics', async ({ request }) => {
    test.skip(!adminToken, 'Admin user not available');

    const response = await request.get('http://localhost:3000/api/admin/product-stats', {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.summary).toBeDefined();
    expect(data.data.summary.totalProducts).toBeGreaterThanOrEqual(0);
  });

  test('should not allow non-admin access to admin endpoints', async ({ request }) => {
    // Create a regular user
    const regularUser = {
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      firstName: 'John',
      lastName: 'Doe',
    };

    const registerResponse = await request.post('http://localhost:3000/api/auth/register', {
      data: regularUser,
    });

    const registerData = await registerResponse.json();
    const userToken = registerData.data.token;

    // Try to access admin endpoint with user token
    const response = await request.get('http://localhost:3000/api/admin/dashboard', {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    });

    expect(response.status()).toBe(403);
  });
});

test.describe('Admin User Management E2E', () => {
  let adminToken: string;
  let testUserId: string;

  test.beforeAll(async ({ request }) => {
    // Login as admin
    const loginResponse = await request.post('http://localhost:3000/api/auth/login', {
      data: {
        email: 'admin@example.com',
        password: 'AdminPassword123!',
      },
    });

    if (loginResponse.ok()) {
      const data = await loginResponse.json();
      adminToken = data.data.token;
    }

    // Create a test user
    const registerResponse = await request.post('http://localhost:3000/api/auth/register', {
      data: {
        email: `test-user-${Date.now()}@example.com`,
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User',
      },
    });

    if (registerResponse.ok()) {
      const registerData = await registerResponse.json();
      testUserId = registerData.data.user.id;
    }
  });

  test('should list all users', async ({ request }) => {
    test.skip(!adminToken, 'Admin user not available');

    const response = await request.get('http://localhost:3000/api/users', {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBeTruthy();
    expect(data.meta).toBeDefined();
  });

  test('should get user by ID', async ({ request }) => {
    test.skip(!adminToken || !testUserId, 'Admin user or test user not available');

    const response = await request.get(`http://localhost:3000/api/users/${testUserId}`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.id).toBe(testUserId);
  });

  test('should update user role', async ({ request }) => {
    test.skip(!adminToken || !testUserId, 'Admin user or test user not available');

    const response = await request.patch(`http://localhost:3000/api/users/${testUserId}/role`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
      data: { role: 'ADMIN' },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.role).toBe('ADMIN');
  });
});
