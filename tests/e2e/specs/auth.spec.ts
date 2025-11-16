import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login and register links', async ({ page }) => {
    await expect(page.getByRole('link', { name: /login/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /register/i })).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    await page.getByRole('link', { name: /register/i }).click();
    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByRole('heading', { name: /register/i })).toBeVisible();
  });

  test('should register a new user', async ({ page }) => {
    await page.goto('/register');

    const timestamp = Date.now();
    const email = `test${timestamp}@example.com`;

    await page.getByLabel(/first name/i).fill('John');
    await page.getByLabel(/last name/i).fill('Doe');
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/^password/i).fill('Password123!');

    await page.getByRole('button', { name: /register/i }).click();

    // Should redirect to home page after successful registration
    await expect(page).toHaveURL('/', { timeout: 10000 });
  });

  test('should show validation errors for invalid registration', async ({ page }) => {
    await page.goto('/register');

    await page.getByLabel(/email/i).fill('invalid-email');
    await page.getByLabel(/^password/i).fill('123');

    await page.getByRole('button', { name: /register/i }).click();

    // Should show validation errors
    await expect(page.getByText(/invalid email/i)).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.getByRole('link', { name: /login/i }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    // First register a user
    const timestamp = Date.now();
    const email = `test${timestamp}@example.com`;
    const password = 'Password123!';

    await page.goto('/register');
    await page.getByLabel(/first name/i).fill('John');
    await page.getByLabel(/last name/i).fill('Doe');
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/^password/i).fill(password);
    await page.getByRole('button', { name: /register/i }).click();

    // Wait for registration to complete
    await page.waitForURL('/', { timeout: 10000 });

    // Logout
    await page.getByRole('button', { name: /logout/i }).click();

    // Now login
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /login/i }).click();

    // Should redirect to home page
    await expect(page).toHaveURL('/', { timeout: 10000 });
  });

  test('should show error for invalid login credentials', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel(/email/i).fill('nonexistent@example.com');
    await page.getByLabel(/password/i).fill('WrongPassword123!');

    await page.getByRole('button', { name: /login/i }).click();

    // Should show error message
    await expect(page.getByText(/invalid.*credentials/i)).toBeVisible({ timeout: 5000 });
  });

  test('should logout successfully', async ({ page }) => {
    // Register and login first
    const timestamp = Date.now();
    const email = `test${timestamp}@example.com`;

    await page.goto('/register');
    await page.getByLabel(/first name/i).fill('John');
    await page.getByLabel(/last name/i).fill('Doe');
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/^password/i).fill('Password123!');
    await page.getByRole('button', { name: /register/i }).click();

    await page.waitForURL('/', { timeout: 10000 });

    // Logout
    await page.getByRole('button', { name: /logout/i }).click();

    // Should show login button again
    await expect(page.getByRole('link', { name: /login/i })).toBeVisible();
  });
});
