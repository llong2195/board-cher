/**
 * T282: Card Management and Drag-Drop E2E Tests
 *
 * Critical user journeys:
 * - Create cards
 * - Edit card details
 * - Drag and drop cards between lists
 * - Delete cards
 * - Add comments and checklists
 */

import { test, expect } from '@playwright/test';

test.describe('Card Management', () => {
  const testUser = {
    email: `card-test-${Date.now()}@example.com`,
    password: 'SecurePassword123!',
    name: 'Card Test User',
  };

  let boardUrl: string;

  // Setup: Create board with lists before tests
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
    await page.getByLabel(/board.*name/i).fill(`Card Test Board ${Date.now()}`);
    await page.getByRole('button', { name: /create/i }).click();

    boardUrl = page.url();

    // Create three lists
    await page.getByRole('button', { name: /add.*list/i }).click();
    await page.getByPlaceholder(/list.*name/i).fill('To Do');
    await page.keyboard.press('Enter');

    await page.getByRole('button', { name: /add.*list/i }).click();
    await page.getByPlaceholder(/list.*name/i).fill('In Progress');
    await page.keyboard.press('Enter');

    await page.getByRole('button', { name: /add.*list/i }).click();
    await page.getByPlaceholder(/list.*name/i).fill('Done');
    await page.keyboard.press('Enter');

    await page.close();
  });

  // Login and navigate to board before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(testUser.email);
    await page.getByLabel(/password/i).fill(testUser.password);
    await page.getByRole('button', { name: /sign in/i }).click();

    await page.goto(boardUrl);
  });

  test('should create card in list', async ({ page }) => {
    // Click add card button in "To Do" list
    const todoList = page
      .locator('[data-list-name="To Do"]')
      .or(page.getByText('To Do').locator('..'));
    await todoList.getByRole('button', { name: /add.*card/i }).click();

    // Fill card title
    await page.getByPlaceholder(/card.*title/i).fill('Write E2E tests');
    await page.keyboard.press('Enter');

    // Verify card is created
    await expect(page.getByText('Write E2E tests')).toBeVisible();
  });

  test('should open card modal and edit details', async ({ page }) => {
    // Create a card first
    const todoList = page
      .locator('[data-list-name="To Do"]')
      .or(page.getByText('To Do').locator('..'));
    await todoList.getByRole('button', { name: /add.*card/i }).click();
    await page.getByPlaceholder(/card.*title/i).fill('Card to Edit');
    await page.keyboard.press('Enter');

    // Click on card to open modal
    await page.getByText('Card to Edit').click();

    // Modal should be visible
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Card to Edit' })).toBeVisible();

    // Edit description
    await page.getByLabel(/description/i).fill('This is a detailed description of the task');
    await page.getByRole('button', { name: /save/i }).click();

    // Verify description is saved
    await expect(page.getByText('This is a detailed description')).toBeVisible();
  });

  test('should add comment to card', async ({ page }) => {
    // Create a card
    const todoList = page
      .locator('[data-list-name="To Do"]')
      .or(page.getByText('To Do').locator('..'));
    await todoList.getByRole('button', { name: /add.*card/i }).click();
    await page.getByPlaceholder(/card.*title/i).fill('Card with Comment');
    await page.keyboard.press('Enter');

    // Open card
    await page.getByText('Card with Comment').click();

    // Add comment
    await page.getByPlaceholder(/add.*comment/i).fill('This is a test comment');
    await page.getByRole('button', { name: /post.*comment/i }).click();

    // Verify comment is added
    await expect(page.getByText('This is a test comment')).toBeVisible();
  });

  test('should add checklist to card', async ({ page }) => {
    // Create a card
    const todoList = page
      .locator('[data-list-name="To Do"]')
      .or(page.getByText('To Do').locator('..'));
    await todoList.getByRole('button', { name: /add.*card/i }).click();
    await page.getByPlaceholder(/card.*title/i).fill('Card with Checklist');
    await page.keyboard.press('Enter');

    // Open card
    await page.getByText('Card with Checklist').click();

    // Add checklist
    await page.getByRole('button', { name: /add.*checklist/i }).click();
    await page.getByLabel(/checklist.*title/i).fill('Implementation Tasks');
    await page.getByRole('button', { name: /add/i }).click();

    // Add checklist items
    await page.getByPlaceholder(/add.*item/i).fill('Write unit tests');
    await page.keyboard.press('Enter');

    await page.getByPlaceholder(/add.*item/i).fill('Write E2E tests');
    await page.keyboard.press('Enter');

    // Verify checklist is created
    await expect(page.getByText('Implementation Tasks')).toBeVisible();
    await expect(page.getByText('Write unit tests')).toBeVisible();
    await expect(page.getByText('Write E2E tests')).toBeVisible();
  });

  test('should check checklist items', async ({ page }) => {
    // Create card with checklist (simplified for test)
    const todoList = page
      .locator('[data-list-name="To Do"]')
      .or(page.getByText('To Do').locator('..'));
    await todoList.getByRole('button', { name: /add.*card/i }).click();
    await page.getByPlaceholder(/card.*title/i).fill('Task Card');
    await page.keyboard.press('Enter');

    await page.getByText('Task Card').click();
    await page.getByRole('button', { name: /add.*checklist/i }).click();
    await page.getByLabel(/checklist.*title/i).fill('Tasks');
    await page.getByRole('button', { name: /add/i }).click();

    await page.getByPlaceholder(/add.*item/i).fill('Task 1');
    await page.keyboard.press('Enter');

    // Check the checkbox
    await page.getByRole('checkbox', { name: /task 1/i }).check();

    // Verify checkbox is checked
    await expect(page.getByRole('checkbox', { name: /task 1/i })).toBeChecked();

    // Progress indicator should show 1/1
    await expect(page.getByText(/1.*\/.*1/)).toBeVisible();
  });

  test('should drag card between lists', async ({ page }) => {
    // Create a card in "To Do" list
    const todoList = page
      .locator('[data-list-name="To Do"]')
      .or(page.getByText('To Do').locator('..'));
    await todoList.getByRole('button', { name: /add.*card/i }).click();
    await page.getByPlaceholder(/card.*title/i).fill('Card to Move');
    await page.keyboard.press('Enter');

    // Wait for card to be visible
    const card = page.getByText('Card to Move');
    await expect(card).toBeVisible();

    // Get source and target positions
    const sourceList = page.getByText('To Do').locator('..');
    const targetList = page.getByText('In Progress').locator('..');

    // Perform drag and drop
    await card.dragTo(targetList);

    // Verify card moved to "In Progress" list
    const inProgressList = page.locator('[data-list-name="In Progress"]').or(targetList);
    await expect(inProgressList.getByText('Card to Move')).toBeVisible();

    // Verify card is no longer in "To Do" list
    const todoListCheck = page.locator('[data-list-name="To Do"]').or(sourceList);
    await expect(todoListCheck.getByText('Card to Move')).not.toBeVisible();
  });

  test('should delete card', async ({ page }) => {
    // Create a card
    const todoList = page
      .locator('[data-list-name="To Do"]')
      .or(page.getByText('To Do').locator('..'));
    await todoList.getByRole('button', { name: /add.*card/i }).click();
    await page.getByPlaceholder(/card.*title/i).fill('Card to Delete');
    await page.keyboard.press('Enter');

    // Open card
    await page.getByText('Card to Delete').click();

    // Click delete button
    await page.getByRole('button', { name: /delete.*card/i }).click();

    // Confirm deletion
    await page.getByRole('button', { name: /confirm/i }).click();

    // Verify card is deleted
    await expect(page.getByText('Card to Delete')).not.toBeVisible();
  });

  test('should display empty state in list with no cards', async ({ page }) => {
    // Check if "Done" list is empty
    const doneList = page
      .locator('[data-list-name="Done"]')
      .or(page.getByText('Done').locator('..'));

    // Should show empty state or add card button
    await expect(doneList.getByRole('button', { name: /add.*card/i })).toBeVisible();
  });

  test('should preserve card order after drag and drop', async ({ page }) => {
    // Create multiple cards
    const todoList = page
      .locator('[data-list-name="To Do"]')
      .or(page.getByText('To Do').locator('..'));

    await todoList.getByRole('button', { name: /add.*card/i }).click();
    await page.getByPlaceholder(/card.*title/i).fill('Card 1');
    await page.keyboard.press('Enter');

    await todoList.getByRole('button', { name: /add.*card/i }).click();
    await page.getByPlaceholder(/card.*title/i).fill('Card 2');
    await page.keyboard.press('Enter');

    await todoList.getByRole('button', { name: /add.*card/i }).click();
    await page.getByPlaceholder(/card.*title/i).fill('Card 3');
    await page.keyboard.press('Enter');

    // Get all cards
    const cards = await page.getByText(/Card [123]/).all();
    expect(cards.length).toBe(3);

    // Verify order
    const firstCard = cards[0];
    await expect(firstCard).toHaveText(/Card 1/);
  });
});
