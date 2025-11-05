/**
 * T282: Board and List Management E2E Tests
 *
 * Critical user journeys:
 * - Create board
 * - Create lists
 * - Rename board/lists
 * - Delete board/lists
 */

import { test, expect } from '@playwright/test';

test.describe('Board Management', () => {
  const testUser = {
    email: `board-test-${Date.now()}@example.com`,
    password: 'SecurePassword123!',
    name: 'Board Test User',
  };

  const testBoard = {
    name: `Test Board ${Date.now()}`,
    description: 'E2E test board for automated testing',
  };

  // Setup: Login before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // Register or login
    try {
      await page.getByRole('link', { name: /sign up/i }).click();
      await page.getByLabel(/name/i).fill(testUser.name);
      await page.getByLabel(/email/i).fill(testUser.email);
      await page.getByLabel(/password/i).fill(testUser.password);
      await page.getByRole('button', { name: /sign up/i }).click();
    } catch {
      // User might already exist, try login
      await page.goto('/login');
      await page.getByLabel(/email/i).fill(testUser.email);
      await page.getByLabel(/password/i).fill(testUser.password);
      await page.getByRole('button', { name: /sign in/i }).click();
    }

    await expect(page).toHaveURL(/\/boards/);
  });

  test('should create new board', async ({ page }) => {
    // Click create board button
    await page.getByRole('button', { name: /create.*board/i }).click();

    // Fill board details
    await page.getByLabel(/board.*name/i).fill(testBoard.name);
    await page.getByLabel(/description/i).fill(testBoard.description);

    // Submit form
    await page.getByRole('button', { name: /create/i }).click();

    // Should navigate to the new board
    await expect(page).toHaveURL(/\/boards\/[a-f0-9-]+/);

    // Board name should be visible
    await expect(page.getByRole('heading', { name: testBoard.name })).toBeVisible();
  });

  test('should create lists in board', async ({ page }) => {
    // Create a board first
    await page.getByRole('button', { name: /create.*board/i }).click();
    await page.getByLabel(/board.*name/i).fill(testBoard.name);
    await page.getByRole('button', { name: /create/i }).click();

    await expect(page).toHaveURL(/\/boards\/[a-f0-9-]+/);

    // Create first list
    await page.getByRole('button', { name: /add.*list/i }).click();
    await page.getByPlaceholder(/list.*name/i).fill('To Do');
    await page.keyboard.press('Enter');

    // Verify list is created
    await expect(page.getByText('To Do')).toBeVisible();

    // Create second list
    await page.getByRole('button', { name: /add.*list/i }).click();
    await page.getByPlaceholder(/list.*name/i).fill('In Progress');
    await page.keyboard.press('Enter');

    await expect(page.getByText('In Progress')).toBeVisible();

    // Create third list
    await page.getByRole('button', { name: /add.*list/i }).click();
    await page.getByPlaceholder(/list.*name/i).fill('Done');
    await page.keyboard.press('Enter');

    await expect(page.getByText('Done')).toBeVisible();
  });

  test('should rename board', async ({ page }) => {
    // Create a board
    await page.getByRole('button', { name: /create.*board/i }).click();
    await page.getByLabel(/board.*name/i).fill(testBoard.name);
    await page.getByRole('button', { name: /create/i }).click();

    await expect(page).toHaveURL(/\/boards\/[a-f0-9-]+/);

    // Click board name to edit
    await page.getByRole('heading', { name: testBoard.name }).click();

    // Change name
    const newName = `${testBoard.name} - Renamed`;
    await page.getByRole('textbox', { name: /board.*name/i }).fill(newName);
    await page.keyboard.press('Enter');

    // Verify name changed
    await expect(page.getByRole('heading', { name: newName })).toBeVisible();
  });

  test('should rename list', async ({ page }) => {
    // Create a board with a list
    await page.getByRole('button', { name: /create.*board/i }).click();
    await page.getByLabel(/board.*name/i).fill(testBoard.name);
    await page.getByRole('button', { name: /create/i }).click();

    await page.getByRole('button', { name: /add.*list/i }).click();
    await page.getByPlaceholder(/list.*name/i).fill('To Do');
    await page.keyboard.press('Enter');

    // Click list title to edit
    await page.getByText('To Do').click();

    // Change name
    await page.getByRole('textbox').fill('Backlog');
    await page.keyboard.press('Enter');

    // Verify name changed
    await expect(page.getByText('Backlog')).toBeVisible();
  });

  test('should delete list', async ({ page }) => {
    // Create a board with a list
    await page.getByRole('button', { name: /create.*board/i }).click();
    await page.getByLabel(/board.*name/i).fill(testBoard.name);
    await page.getByRole('button', { name: /create/i }).click();

    await page.getByRole('button', { name: /add.*list/i }).click();
    await page.getByPlaceholder(/list.*name/i).fill('To Delete');
    await page.keyboard.press('Enter');

    // Open list menu
    await page
      .getByRole('button', { name: /list.*menu/i })
      .first()
      .click();

    // Click delete
    await page.getByRole('menuitem', { name: /delete/i }).click();

    // Confirm deletion
    await page.getByRole('button', { name: /confirm/i }).click();

    // Verify list is deleted
    await expect(page.getByText('To Delete')).not.toBeVisible();
  });

  test('should display empty state when no lists', async ({ page }) => {
    // Create a board
    await page.getByRole('button', { name: /create.*board/i }).click();
    await page.getByLabel(/board.*name/i).fill(testBoard.name);
    await page.getByRole('button', { name: /create/i }).click();

    // Should show empty state
    await expect(page.getByText(/add.*first.*list/i)).toBeVisible();
  });

  test('should navigate back to boards page', async ({ page }) => {
    // Create a board
    await page.getByRole('button', { name: /create.*board/i }).click();
    await page.getByLabel(/board.*name/i).fill(testBoard.name);
    await page.getByRole('button', { name: /create/i }).click();

    await expect(page).toHaveURL(/\/boards\/[a-f0-9-]+/);

    // Click back/home button
    await page
      .getByRole('link', { name: /boards/i })
      .first()
      .click();

    // Should navigate back to boards page
    await expect(page).toHaveURL(/\/boards$/);

    // New board should be visible in list
    await expect(page.getByText(testBoard.name)).toBeVisible();
  });

  test('should show board in boards list', async ({ page }) => {
    // Create a board
    await page.getByRole('button', { name: /create.*board/i }).click();
    await page.getByLabel(/board.*name/i).fill(testBoard.name);
    await page.getByRole('button', { name: /create/i }).click();

    // Go back to boards page
    await page.goto('/boards');

    // Board should be in the list
    await expect(page.getByText(testBoard.name)).toBeVisible();

    // Click on board to open it
    await page.getByText(testBoard.name).click();

    // Should navigate to board
    await expect(page).toHaveURL(/\/boards\/[a-f0-9-]+/);
  });
});
