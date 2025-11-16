import { test, expect } from '@playwright/test';

test.describe('User Profile Management E2E', () => {
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    firstName: 'John',
    lastName: 'Doe',
  };

  let authToken: string;

  test.beforeAll(async ({ request }) => {
    // Register test user
    const registerResponse = await request.post('http://localhost:3000/api/auth/register', {
      data: testUser,
    });

    if (registerResponse.ok()) {
      const data = await registerResponse.json();
      authToken = data.data.token;
    }
  });

  test('should view user profile', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/users/profile', {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.email).toBe(testUser.email);
    expect(data.data.firstName).toBe(testUser.firstName);
  });

  test('should update user profile', async ({ request }) => {
    const updateData = {
      firstName: 'Jane',
      lastName: 'Smith',
    };

    const response = await request.put('http://localhost:3000/api/users/profile', {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      data: updateData,
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.firstName).toBe('Jane');
    expect(data.data.lastName).toBe('Smith');
  });

  test('should change password', async ({ request }) => {
    const passwordData = {
      currentPassword: testUser.password,
      newPassword: 'NewPassword123!',
    };

    const response = await request.post('http://localhost:3000/api/users/change-password', {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      data: passwordData,
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.message).toContain('Password changed successfully');
  });

  test('should not allow access without authentication', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/users/profile');

    expect(response.status()).toBe(401);
  });
});

test.describe('Address Management E2E', () => {
  const testUser = {
    email: `test-address-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    firstName: 'John',
    lastName: 'Doe',
  };

  let authToken: string;
  let addressId: string;

  test.beforeAll(async ({ request }) => {
    // Register test user
    const registerResponse = await request.post('http://localhost:3000/api/auth/register', {
      data: testUser,
    });

    if (registerResponse.ok()) {
      const data = await registerResponse.json();
      authToken = data.data.token;
    }
  });

  test('should create a new address', async ({ request }) => {
    const addressData = {
      street: '123 Main St, Apt 4B',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA',
      isDefault: false,
    };

    const response = await request.post('http://localhost:3000/api/addresses', {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      data: addressData,
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.street).toBe(addressData.street);
    addressId = data.data.id;
  });

  test('should get all addresses', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/addresses', {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBeTruthy();
    expect(data.data.length).toBeGreaterThan(0);
  });

  test('should update an address', async ({ request }) => {
    const updateData = {
      street: '456 Oak Ave',
      city: 'Boston',
    };

    const response = await request.put(`http://localhost:3000/api/addresses/${addressId}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      data: updateData,
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.street).toBe(updateData.street);
  });

  test('should set address as default', async ({ request }) => {
    const response = await request.put(`http://localhost:3000/api/addresses/${addressId}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      data: { isDefault: true },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.isDefault).toBe(true);
  });

  test('should delete an address', async ({ request }) => {
    const response = await request.delete(`http://localhost:3000/api/addresses/${addressId}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
  });
});
