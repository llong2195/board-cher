/**
 * T282: Authentication E2E Tests
 *
 * Critical user journeys:
 * - User registration
 * - User login
 * - User logout
 * - Session persistence
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'SecurePassword123!',
    name: 'Test User',
  };

  test.beforeEach(async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
  });

  test('should display login page', async ({ page }) => {
    await expect(page).toHaveTitle(/Trello Vibe/);
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
  });

  test('should register new user successfully', async ({ page }) => {
    // Click register/signup link
    await page.getByRole('link', { name: /sign up/i }).click();

    // Wait for registration form
    await expect(page.getByRole('heading', { name: /sign up/i })).toBeVisible();

    // Fill registration form
    await page.getByLabel(/name/i).fill(testUser.name);
    await page.getByLabel(/email/i).fill(testUser.email);
    await page.getByLabel(/password/i).fill(testUser.password);

    // Submit form
    await page.getByRole('button', { name: /sign up/i }).click();

    // Should redirect to dashboard after successful registration
    await expect(page).toHaveURL(/\/boards/);
    await expect(page.getByText(testUser.name)).toBeVisible();
  });

  test('should login existing user', async ({ page }) => {
    // Use the test user created in previous test
    // Note: This assumes registration test ran first or test user exists

    await page.getByLabel(/email/i).fill(testUser.email);
    await page.getByLabel(/password/i).fill(testUser.password);

    await page.getByRole('button', { name: /sign in/i }).click();

    // Should redirect to boards page
    await expect(page).toHaveURL(/\/boards/);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.getByLabel(/email/i).fill('invalid@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');

    await page.getByRole('button', { name: /sign in/i }).click();

    // Should show error message
    await expect(page.getByText(/invalid.*credentials/i)).toBeVisible();

    // Should stay on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('should logout user', async ({ page, context }) => {
    // First login
    await page.getByLabel(/email/i).fill(testUser.email);
    await page.getByLabel(/password/i).fill(testUser.password);
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/boards/);

    // Open user menu and logout
    await page.getByRole('button', { name: testUser.name }).click();
    await page.getByRole('menuitem', { name: /logout/i }).click();

    // Should redirect to login page
    await expect(page).toHaveURL(/\/login/);

    // Should clear auth token
    const cookies = await context.cookies();
    const authCookie = cookies.find((c) => c.name.includes('token') || c.name.includes('auth'));
    expect(authCookie).toBeUndefined();
  });

  test('should persist session after page reload', async ({ page }) => {
    // Login first
    await page.getByLabel(/email/i).fill(testUser.email);
    await page.getByLabel(/password/i).fill(testUser.password);
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/boards/);

    // Reload page
    await page.reload();

    // Should still be logged in
    await expect(page).toHaveURL(/\/boards/);
    await expect(page.getByText(testUser.name)).toBeVisible();
  });

  test('should redirect to login when accessing protected route', async ({ page }) => {
    // Try to access boards page without authentication
    await page.goto('/boards');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should validate email format', async ({ page }) => {
    await page.getByRole('link', { name: /sign up/i }).click();

    await page.getByLabel(/name/i).fill(testUser.name);
    await page.getByLabel(/email/i).fill('invalid-email');
    await page.getByLabel(/password/i).fill(testUser.password);

    await page.getByRole('button', { name: /sign up/i }).click();

    // Should show validation error
    await expect(page.getByText(/valid.*email/i)).toBeVisible();
  });

  test('should validate password requirements', async ({ page }) => {
    await page.getByRole('link', { name: /sign up/i }).click();

    await page.getByLabel(/name/i).fill(testUser.name);
    await page.getByLabel(/email/i).fill(testUser.email);
    await page.getByLabel(/password/i).fill('weak'); // Too short password

    await page.getByRole('button', { name: /sign up/i }).click();

    // Should show validation error for password
    await expect(page.getByText(/password.*8.*characters/i)).toBeVisible();
  });
});
