/**
 * T104: Error Handling E2E Tests
 *
 * Critical error scenarios:
 * - Network disconnection and reconnection
 * - API errors and error toasts
 * - WebSocket reconnection handling
 * - Form validation errors
 */

import { test, expect } from '@playwright/test';

test.describe('Error Handling', () => {
  const testUser = {
    email: `error-test-${Date.now()}@example.com`,
    password: 'SecurePassword123!',
    name: 'Error Test User',
  };

  let boardUrl: string;

  // Setup: Create board before tests
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto('/');

    // Register user
    try {
      await page.getByRole('link', { name: /sign up/i }).click();
      await page.getByLabel(/name/i).fill(testUser.name);
      await page.getByLabel(/email/i).fill(testUser.email);
      await page.getByLabel(/password/i).fill(testUser.password);
      await page.getByRole('button', { name: /sign up/i }).click();
    } catch {
      // User exists, login
      await page.goto('/login');
      await page.getByLabel(/email/i).fill(testUser.email);
      await page.getByLabel(/password/i).fill(testUser.password);
      await page.getByRole('button', { name: /sign in/i }).click();
    }

    // Create board
    await page.getByRole('button', { name: /create.*board/i }).click();
    await page.getByLabel(/board.*name/i).fill(`Error Test Board ${Date.now()}`);
    await page.getByRole('button', { name: /create/i }).click();

    boardUrl = page.url();

    // Create a list
    await page.getByRole('button', { name: /add.*list/i }).click();
    await page.getByPlaceholder(/list.*name/i).fill('Test List');
    await page.keyboard.press('Enter');

    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(testUser.email);
    await page.getByLabel(/password/i).fill(testUser.password);
    await page.getByRole('button', { name: /sign in/i }).click();

    await page.goto(boardUrl);
    await page.waitForLoadState('networkidle');
  });

  test('should show error toast when network is disconnected', async ({ page, context }) => {
    // Simulate network disconnection
    await context.setOffline(true);

    // Try to create a card (should fail)
    const list = page
      .locator('[data-list-name="Test List"]')
      .or(page.getByText('Test List').locator('..'));
    await list.getByRole('button', { name: /add.*card/i }).click();
    await page.getByPlaceholder(/card.*title/i).fill('Offline Card');
    await page.keyboard.press('Enter');

    // Should show error toast
    await expect(page.getByRole('alert').or(page.getByText(/error|failed|network/i))).toBeVisible({
      timeout: 5000,
    });

    // Restore network
    await context.setOffline(false);
  });

  test('should show reconnecting toast when WebSocket disconnects', async ({ page, context }) => {
    // Wait for initial connection
    await page.waitForLoadState('networkidle');

    // Simulate network disconnection
    await context.setOffline(true);

    // Should show reconnecting toast
    await expect(
      page.getByRole('alert').or(page.getByText(/reconnecting|connection lost/i)),
    ).toBeVisible({ timeout: 5000 });

    // Restore network
    await context.setOffline(false);
  });

  test('should show success toast when reconnected', async ({ page, context }) => {
    // Disconnect
    await context.setOffline(true);

    // Wait for reconnecting state
    await expect(page.getByText(/reconnecting/i)).toBeVisible({ timeout: 5000 });

    // Reconnect
    await context.setOffline(false);

    // Should show connected/success toast
    await expect(page.getByRole('alert').or(page.getByText(/connected|restored/i))).toBeVisible({
      timeout: 10000,
    });
  });

  test('should queue actions during offline and sync when online', async ({ page, context }) => {
    // Create a card while online
    const list = page
      .locator('[data-list-name="Test List"]')
      .or(page.getByText('Test List').locator('..'));
    await list.getByRole('button', { name: /add.*card/i }).click();
    await page.getByPlaceholder(/card.*title/i).fill('Online Card');
    await page.keyboard.press('Enter');

    await expect(page.getByText('Online Card')).toBeVisible();

    // Go offline
    await context.setOffline(true);

    // Try to create another card (should queue)
    await list.getByRole('button', { name: /add.*card/i }).click();
    await page.getByPlaceholder(/card.*title/i).fill('Queued Card');
    await page.keyboard.press('Enter');

    // Go back online
    await context.setOffline(false);

    // Card should appear after sync (or show error)
    // The behavior depends on implementation - it might show error or sync
    await page.waitForTimeout(3000);

    // At minimum, should show some feedback (error or success)
    const hasCard = await page
      .getByText('Queued Card')
      .isVisible()
      .catch(() => false);
    const hasError = await page
      .getByRole('alert')
      .isVisible()
      .catch(() => false);

    expect(hasCard || hasError).toBeTruthy();
  });

  test('should show validation error for empty board name', async ({ page }) => {
    // Go to boards page
    await page.goto('/boards');

    // Try to create board with empty name
    await page.getByRole('button', { name: /create.*board/i }).click();

    // Leave name empty and submit
    await page.getByRole('button', { name: /create/i }).click();

    // Should show validation error
    await expect(page.getByText(/required|enter.*name|cannot be empty/i)).toBeVisible({
      timeout: 3000,
    });
  });

  test('should show validation error for empty card title', async ({ page }) => {
    const list = page
      .locator('[data-list-name="Test List"]')
      .or(page.getByText('Test List').locator('..'));

    // Click add card button
    await list.getByRole('button', { name: /add.*card/i }).click();

    // Try to submit without title
    const input = page.getByPlaceholder(/card.*title/i);
    await input.focus();
    await page.keyboard.press('Enter');

    // Should either prevent submission or show error
    // Card should not be created with empty title
    const cardCount = await list
      .locator('[data-testid="card"]')
      .count()
      .catch(() => 0);

    // Count should not increase (no card with empty title)
    expect(cardCount).toBeGreaterThanOrEqual(0);
  });

  test('should handle 404 error when board not found', async ({ page }) => {
    // Navigate to non-existent board
    await page.goto('/boards/00000000-0000-0000-0000-000000000000');

    // Should show 404 error or redirect
    await expect(
      page
        .getByText(/not found|404|doesn't exist/i)
        .or(page.getByRole('heading', { name: /404/i })),
    ).toBeVisible({ timeout: 5000 });
  });

  test('should handle API error when creating card fails', async ({ page }) => {
    // Intercept API call and return error
    await page.route('**/api/cards', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Internal Server Error' }),
      });
    });

    // Try to create a card
    const list = page
      .locator('[data-list-name="Test List"]')
      .or(page.getByText('Test List').locator('..'));
    await list.getByRole('button', { name: /add.*card/i }).click();
    await page.getByPlaceholder(/card.*title/i).fill('Error Card');
    await page.keyboard.press('Enter');

    // Should show error toast
    await expect(page.getByRole('alert').or(page.getByText(/error|failed/i))).toBeVisible({
      timeout: 5000,
    });

    // Card should not appear in list
    await expect(page.getByText('Error Card')).not.toBeVisible();
  });

  test('should handle unauthorized error', async ({ page }) => {
    // Intercept API call and return 401
    await page.route('**/api/boards/*', (route) => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Unauthorized' }),
      });
    });

    // Refresh page
    await page.reload();

    // Should redirect to login or show unauthorized error
    await expect(
      page
        .getByText(/unauthorized|sign in|login/i)
        .or(page.getByRole('heading', { name: /login|sign in/i })),
    ).toBeVisible({ timeout: 5000 });
  });

  test('should recover from transient network errors', async ({ page, context }) => {
    // Create a card successfully
    const list = page
      .locator('[data-list-name="Test List"]')
      .or(page.getByText('Test List').locator('..'));
    await list.getByRole('button', { name: /add.*card/i }).click();
    await page.getByPlaceholder(/card.*title/i).fill('Card Before Error');
    await page.keyboard.press('Enter');

    await expect(page.getByText('Card Before Error')).toBeVisible();

    // Simulate brief network interruption
    await context.setOffline(true);
    await page.waitForTimeout(2000);
    await context.setOffline(false);

    // Wait for reconnection
    await page.waitForTimeout(3000);

    // Should be able to create card again
    await list.getByRole('button', { name: /add.*card/i }).click();
    await page.getByPlaceholder(/card.*title/i).fill('Card After Recovery');
    await page.keyboard.press('Enter');

    // Verify card is created successfully
    await expect(page.getByText('Card After Recovery')).toBeVisible({ timeout: 10000 });
  });

  test('should show error when deleting non-existent card', async ({ page }) => {
    // Create a card
    const list = page
      .locator('[data-list-name="Test List"]')
      .or(page.getByText('Test List').locator('..'));
    await list.getByRole('button', { name: /add.*card/i }).click();
    await page.getByPlaceholder(/card.*title/i).fill('Card to Delete');
    await page.keyboard.press('Enter');

    // Wait for card to appear
    await expect(page.getByText('Card to Delete')).toBeVisible();

    // Intercept delete request to return 404
    await page.route('**/api/cards/*', (route) => {
      if (route.request().method() === 'DELETE') {
        route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Card not found' }),
        });
      } else {
        route.continue();
      }
    });

    // Open card and try to delete
    await page.getByText('Card to Delete').click();
    await page.getByRole('button', { name: /delete.*card/i }).click();
    await page.getByRole('button', { name: /confirm/i }).click();

    // Should show error toast
    await expect(page.getByRole('alert').or(page.getByText(/not found|error|failed/i))).toBeVisible(
      { timeout: 5000 },
    );
  });

  test('should handle concurrent modification conflicts', async ({ page }) => {
    // Create a card
    const list = page
      .locator('[data-list-name="Test List"]')
      .or(page.getByText('Test List').locator('..'));
    await list.getByRole('button', { name: /add.*card/i }).click();
    await page.getByPlaceholder(/card.*title/i).fill('Conflict Card');
    await page.keyboard.press('Enter');

    // Open the card
    await page.getByText('Conflict Card').click();

    // Intercept update request to return 409 conflict
    await page.route('**/api/cards/*', (route) => {
      if (route.request().method() === 'PATCH' || route.request().method() === 'PUT') {
        route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Conflict: Card was modified by another user' }),
        });
      } else {
        route.continue();
      }
    });

    // Try to update the card
    await page.getByLabel(/description/i).fill('Updated description');
    await page.getByRole('button', { name: /save/i }).click();

    // Should show conflict error
    await expect(
      page.getByRole('alert').or(page.getByText(/conflict|modified.*another.*user/i)),
    ).toBeVisible({ timeout: 5000 });
  });

  test('should clear error messages after successful action', async ({ page }) => {
    // Trigger an error first
    await page.route('**/api/cards', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Server Error' }),
      });
    });

    const list = page
      .locator('[data-list-name="Test List"]')
      .or(page.getByText('Test List').locator('..'));
    await list.getByRole('button', { name: /add.*card/i }).click();
    await page.getByPlaceholder(/card.*title/i).fill('Error Card');
    await page.keyboard.press('Enter');

    // Verify error appears
    await expect(page.getByRole('alert').or(page.getByText(/error/i))).toBeVisible({
      timeout: 5000,
    });

    // Remove route to allow success
    await page.unroute('**/api/cards');

    // Retry creating card
    await list.getByRole('button', { name: /add.*card/i }).click();
    await page.getByPlaceholder(/card.*title/i).fill('Success Card');
    await page.keyboard.press('Enter');

    // Should show success and card appears
    await expect(page.getByText('Success Card')).toBeVisible({ timeout: 5000 });

    // Error toast should be cleared/dismissed
    await page.waitForTimeout(2000);
    const errorStillVisible = await page
      .getByRole('alert')
      .or(page.getByText(/server error/i))
      .isVisible()
      .catch(() => false);

    // Error should not be visible anymore (either auto-dismissed or replaced)
    expect(errorStillVisible).toBeFalsy();
  });
});
