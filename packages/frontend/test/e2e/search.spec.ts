/**
 * T282: Search and Filter E2E Tests
 *
 * Critical user journeys:
 * - Search cards by text
 * - Filter cards by label
 * - Filter cards by assignee
 * - Clear filters
 */

import { test, expect } from '@playwright/test';

test.describe('Search and Filter', () => {
  const testUser = {
    email: `search-test-${Date.now()}@example.com`,
    password: 'SecurePassword123!',
    name: 'Search Test User',
  };

  let boardUrl: string;

  // Setup: Create board with cards before tests
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto('/');

    // Register
    try {
      await page.getByRole('link', { name: /sign up/i }).click();
      await page.getByLabel(/name/i).fill(testUser.name);
      await page.getByLabel(/email/i).fill(testUser.email);
      await page.getByLabel(/password/i).fill(testUser.password);
      await page.getByRole('button', { name: /sign up/i }).click();
    } catch {
      await page.goto('/login');
      await page.getByLabel(/email/i).fill(testUser.email);
      await page.getByLabel(/password/i).fill(testUser.password);
      await page.getByRole('button', { name: /sign in/i }).click();
    }

    // Create board
    await page.getByRole('button', { name: /create.*board/i }).click();
    await page.getByLabel(/board.*name/i).fill(`Search Test Board ${Date.now()}`);
    await page.getByRole('button', { name: /create/i }).click();

    boardUrl = page.url();

    // Create list
    await page.getByRole('button', { name: /add.*list/i }).click();
    await page.getByPlaceholder(/list.*name/i).fill('Tasks');
    await page.keyboard.press('Enter');

    // Create sample cards with different titles
    const cardTitles = [
      'Fix login bug',
      'Add search feature',
      'Update documentation',
      'Refactor authentication',
      'Write unit tests',
    ];

    const tasksList = page
      .locator('[data-list-name="Tasks"]')
      .or(page.getByText('Tasks').locator('..'));
    for (const title of cardTitles) {
      await tasksList.getByRole('button', { name: /add.*card/i }).click();
      await page.getByPlaceholder(/card.*title/i).fill(title);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(100); // Small delay between cards
    }

    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(testUser.email);
    await page.getByLabel(/password/i).fill(testUser.password);
    await page.getByRole('button', { name: /sign in/i }).click();

    await page.goto(boardUrl);
  });

  test('should search cards by text', async ({ page }) => {
    // Open search bar
    await page.getByPlaceholder(/search.*cards/i).click();

    // Type search query
    await page.getByPlaceholder(/search.*cards/i).fill('bug');

    // Wait for search results
    await page.waitForTimeout(500); // Debounce delay

    // Should show cards containing "bug"
    await expect(page.getByText('Fix login bug')).toBeVisible();

    // Should not show unrelated cards
    await expect(page.getByText('Add search feature')).not.toBeVisible();
    await expect(page.getByText('Update documentation')).not.toBeVisible();
  });

  test('should show all cards when search is cleared', async ({ page }) => {
    // Search first
    await page.getByPlaceholder(/search.*cards/i).fill('authentication');
    await page.waitForTimeout(500);

    // Clear search
    await page.getByPlaceholder(/search.*cards/i).clear();
    await page.waitForTimeout(500);

    // All cards should be visible again
    await expect(page.getByText('Fix login bug')).toBeVisible();
    await expect(page.getByText('Add search feature')).toBeVisible();
    await expect(page.getByText('Update documentation')).toBeVisible();
  });

  test('should search with keyboard shortcut', async ({ page }) => {
    // Press / to focus search
    await page.keyboard.press('/');

    // Search bar should be focused
    const searchBar = page.getByPlaceholder(/search.*cards/i);
    await expect(searchBar).toBeFocused();

    // Type search query
    await page.keyboard.type('tests');
    await page.waitForTimeout(500);

    // Should show matching cards
    await expect(page.getByText('Write unit tests')).toBeVisible();
  });

  test('should filter by label', async ({ page }) => {
    // Create a label first
    await page.getByText('Fix login bug').click();
    await page.getByRole('button', { name: /add.*label/i }).click();
    await page.getByLabel(/label.*name/i).fill('urgent');
    await page.getByLabel(/color/i).selectOption('red');
    await page.getByRole('button', { name: /create/i }).click();

    // Close modal
    await page.keyboard.press('Escape');

    // Open filter panel
    await page.getByRole('button', { name: /filter/i }).click();

    // Select label filter
    await page.getByLabel(/label/i).selectOption('urgent');

    // Should show only cards with "urgent" label
    await expect(page.getByText('Fix login bug')).toBeVisible();
    await expect(page.getByText('Add search feature')).not.toBeVisible();
  });

  test('should show active filter chips', async ({ page }) => {
    // Apply search filter
    await page.getByPlaceholder(/search.*cards/i).fill('feature');
    await page.waitForTimeout(500);

    // Should show filter chip
    await expect(page.getByText(/search.*feature/i)).toBeVisible();

    // Click X to remove filter
    await page.getByRole('button', { name: /clear.*search/i }).click();

    // Filter chip should be removed
    await expect(page.getByText(/search.*feature/i)).not.toBeVisible();
  });

  test('should clear all filters at once', async ({ page }) => {
    // Apply search
    await page.getByPlaceholder(/search.*cards/i).fill('test');
    await page.waitForTimeout(500);

    // Open filter panel and apply filter
    await page.getByRole('button', { name: /filter/i }).click();
    await page.getByLabel(/show.*archived/i).check();

    // Should show "Clear all" button
    await expect(page.getByRole('button', { name: /clear.*all/i })).toBeVisible();

    // Click clear all
    await page.getByRole('button', { name: /clear.*all/i }).click();

    // All filters should be cleared
    await expect(page.getByPlaceholder(/search.*cards/i)).toHaveValue('');
    await expect(page.getByText('Fix login bug')).toBeVisible();
  });

  test('should show "no results" message when search has no matches', async ({ page }) => {
    // Search for non-existent text
    await page.getByPlaceholder(/search.*cards/i).fill('nonexistent123');
    await page.waitForTimeout(500);

    // Should show no results message
    await expect(page.getByText(/no.*cards.*found/i)).toBeVisible();
  });

  test('should search case-insensitively', async ({ page }) => {
    // Search with uppercase
    await page.getByPlaceholder(/search.*cards/i).fill('LOGIN');
    await page.waitForTimeout(500);

    // Should find "Fix login bug" (lowercase)
    await expect(page.getByText('Fix login bug')).toBeVisible();
  });

  test('should search in card descriptions', async ({ page }) => {
    // Add description to a card
    await page.getByText('Update documentation').click();
    await page.getByLabel(/description/i).fill('This card is about updating API documentation');
    await page.getByRole('button', { name: /save/i }).click();
    await page.keyboard.press('Escape');

    // Search for text in description
    await page.getByPlaceholder(/search.*cards/i).fill('API documentation');
    await page.waitForTimeout(500);

    // Should find the card
    await expect(page.getByText('Update documentation')).toBeVisible();
  });

  test('should preserve filters when navigating', async ({ page }) => {
    // Apply search
    await page.getByPlaceholder(/search.*cards/i).fill('authentication');
    await page.waitForTimeout(500);

    // Get current URL
    const urlBeforeReload = page.url();

    // Reload page
    await page.reload();

    // Should still show filtered results
    await expect(page.getByText('Refactor authentication')).toBeVisible();
    await expect(page.getByText('Add search feature')).not.toBeVisible();
  });
});
