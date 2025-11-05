/**
 * T282: Real-time Collaboration E2E Tests
 *
 * Critical user journeys:
 * - Two users viewing same board see real-time updates
 * - Card created by one user appears for other user
 * - Card moved by one user updates for other user
 * - Comments added by one user appear for other user
 */

import { test, expect } from '@playwright/test';

test.describe('Real-time Collaboration', () => {
  const user1 = {
    email: `collab-user1-${Date.now()}@example.com`,
    password: 'SecurePassword123!',
    name: 'Collab User 1',
  };

  const user2 = {
    email: `collab-user2-${Date.now()}@example.com`,
    password: 'SecurePassword123!',
    name: 'Collab User 2',
  };

  let boardUrl: string;

  // Setup: Create board and invite second user
  test.beforeAll(async ({ browser }) => {
    // User 1: Create board
    const page1 = await browser.newPage();
    await page1.goto('/');

    await page1.getByRole('link', { name: /sign up/i }).click();
    await page1.getByLabel(/name/i).fill(user1.name);
    await page1.getByLabel(/email/i).fill(user1.email);
    await page1.getByLabel(/password/i).fill(user1.password);
    await page1.getByRole('button', { name: /sign up/i }).click();

    await page1.getByRole('button', { name: /create.*board/i }).click();
    await page1.getByLabel(/board.*name/i).fill(`Collab Board ${Date.now()}`);
    await page1.getByRole('button', { name: /create/i }).click();

    boardUrl = page1.url();

    // Create initial list
    await page1.getByRole('button', { name: /add.*list/i }).click();
    await page1.getByPlaceholder(/list.*name/i).fill('Shared List');
    await page1.keyboard.press('Enter');

    await page1.close();

    // User 2: Register
    const page2 = await browser.newPage();
    await page2.goto('/');

    await page2.getByRole('link', { name: /sign up/i }).click();
    await page2.getByLabel(/name/i).fill(user2.name);
    await page2.getByLabel(/email/i).fill(user2.email);
    await page2.getByLabel(/password/i).fill(user2.password);
    await page2.getByRole('button', { name: /sign up/i }).click();

    await page2.close();

    // Note: In a real scenario, user1 would invite user2 to the board
    // For this test, we'll assume board is public or user2 has access
  });

  test('should show real-time card creation', async ({ browser }) => {
    // Open two browser contexts (two users)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // User 1 login and open board
    await page1.goto('/login');
    await page1.getByLabel(/email/i).fill(user1.email);
    await page1.getByLabel(/password/i).fill(user1.password);
    await page1.getByRole('button', { name: /sign in/i }).click();
    await page1.goto(boardUrl);

    // User 2 login and open same board
    await page2.goto('/login');
    await page2.getByLabel(/email/i).fill(user2.email);
    await page2.getByLabel(/password/i).fill(user2.password);
    await page2.getByRole('button', { name: /sign in/i }).click();
    await page2.goto(boardUrl);

    // Wait for both pages to load
    await page1.waitForLoadState('networkidle');
    await page2.waitForLoadState('networkidle');

    // User 1 creates a card
    const list1 = page1
      .locator('[data-list-name="Shared List"]')
      .or(page1.getByText('Shared List').locator('..'));
    await list1.getByRole('button', { name: /add.*card/i }).click();
    await page1.getByPlaceholder(/card.*title/i).fill('Real-time Test Card');
    await page1.keyboard.press('Enter');

    // User 2 should see the card appear automatically
    await expect(page2.getByText('Real-time Test Card')).toBeVisible({ timeout: 5000 });

    await context1.close();
    await context2.close();
  });

  test('should show real-time card movement', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // Both users login and open board
    await page1.goto('/login');
    await page1.getByLabel(/email/i).fill(user1.email);
    await page1.getByLabel(/password/i).fill(user1.password);
    await page1.getByRole('button', { name: /sign in/i }).click();
    await page1.goto(boardUrl);

    await page2.goto('/login');
    await page2.getByLabel(/email/i).fill(user2.email);
    await page2.getByLabel(/password/i).fill(user2.password);
    await page2.getByRole('button', { name: /sign in/i }).click();
    await page2.goto(boardUrl);

    // Create second list (user 1)
    await page1.getByRole('button', { name: /add.*list/i }).click();
    await page1.getByPlaceholder(/list.*name/i).fill('Done List');
    await page1.keyboard.press('Enter');

    // Wait for user 2 to see the new list
    await expect(page2.getByText('Done List')).toBeVisible({ timeout: 5000 });

    // Create a card in first list (user 1)
    const sharedList1 = page1
      .locator('[data-list-name="Shared List"]')
      .or(page1.getByText('Shared List').locator('..'));
    await sharedList1.getByRole('button', { name: /add.*card/i }).click();
    await page1.getByPlaceholder(/card.*title/i).fill('Card to Move');
    await page1.keyboard.press('Enter');

    // Wait for user 2 to see the card
    await expect(page2.getByText('Card to Move')).toBeVisible({ timeout: 5000 });

    // User 1 moves card to Done list
    const card = page1.getByText('Card to Move');
    const doneList = page1.getByText('Done List').locator('..');
    await card.dragTo(doneList);

    // User 2 should see the card in Done list
    const doneList2 = page2
      .locator('[data-list-name="Done List"]')
      .or(page2.getByText('Done List').locator('..'));
    await expect(doneList2.getByText('Card to Move')).toBeVisible({ timeout: 5000 });

    await context1.close();
    await context2.close();
  });

  test('should show real-time comments', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // Both users login and open board
    await page1.goto('/login');
    await page1.getByLabel(/email/i).fill(user1.email);
    await page1.getByLabel(/password/i).fill(user1.password);
    await page1.getByRole('button', { name: /sign in/i }).click();
    await page1.goto(boardUrl);

    await page2.goto('/login');
    await page2.getByLabel(/email/i).fill(user2.email);
    await page2.getByLabel(/password/i).fill(user2.password);
    await page2.getByRole('button', { name: /sign in/i }).click();
    await page2.goto(boardUrl);

    // User 1 creates a card
    const list1 = page1
      .locator('[data-list-name="Shared List"]')
      .or(page1.getByText('Shared List').locator('..'));
    await list1.getByRole('button', { name: /add.*card/i }).click();
    await page1.getByPlaceholder(/card.*title/i).fill('Comment Test Card');
    await page1.keyboard.press('Enter');

    // Both users open the same card
    await page1.getByText('Comment Test Card').click();
    await page2.getByText('Comment Test Card').click({ timeout: 5000 });

    // User 1 adds a comment
    await page1.getByPlaceholder(/add.*comment/i).fill('Hello from User 1!');
    await page1.getByRole('button', { name: /post.*comment/i }).click();

    // User 2 should see the comment appear
    await expect(page2.getByText('Hello from User 1!')).toBeVisible({ timeout: 5000 });

    // User 2 adds a reply
    await page2.getByPlaceholder(/add.*comment/i).fill('Hi User 1, I see your comment!');
    await page2.getByRole('button', { name: /post.*comment/i }).click();

    // User 1 should see the reply
    await expect(page1.getByText('Hi User 1, I see your comment!')).toBeVisible({ timeout: 5000 });

    await context1.close();
    await context2.close();
  });

  test('should show online users indicator', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // User 1 opens board
    await page1.goto('/login');
    await page1.getByLabel(/email/i).fill(user1.email);
    await page1.getByLabel(/password/i).fill(user1.password);
    await page1.getByRole('button', { name: /sign in/i }).click();
    await page1.goto(boardUrl);

    // Initially only user 1 is online
    await expect(
      page1.getByText(/1.*user.*online/i).or(page1.getByRole('status', { name: /online/i })),
    ).toBeVisible();

    // User 2 opens same board
    await page2.goto('/login');
    await page2.getByLabel(/email/i).fill(user2.email);
    await page2.getByLabel(/password/i).fill(user2.password);
    await page2.getByRole('button', { name: /sign in/i }).click();
    await page2.goto(boardUrl);

    // User 1 should see 2 users online
    await expect(page1.getByText(/2.*users.*online/i).or(page1.getByRole('status'))).toBeVisible({
      timeout: 5000,
    });

    await context1.close();
    await context2.close();
  });

  test('should handle concurrent edits gracefully', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // Both users open board
    await page1.goto('/login');
    await page1.getByLabel(/email/i).fill(user1.email);
    await page1.getByLabel(/password/i).fill(user1.password);
    await page1.getByRole('button', { name: /sign in/i }).click();
    await page1.goto(boardUrl);

    await page2.goto('/login');
    await page2.getByLabel(/email/i).fill(user2.email);
    await page2.getByLabel(/password/i).fill(user2.password);
    await page2.getByRole('button', { name: /sign in/i }).click();
    await page2.goto(boardUrl);

    // User 1 creates a card
    const list1 = page1
      .locator('[data-list-name="Shared List"]')
      .or(page1.getByText('Shared List').locator('..'));
    await list1.getByRole('button', { name: /add.*card/i }).click();
    await page1.getByPlaceholder(/card.*title/i).fill('Concurrent Edit Card');
    await page1.keyboard.press('Enter');

    // Both users try to edit the same card
    await page1.getByText('Concurrent Edit Card').click();
    await page2.getByText('Concurrent Edit Card').click({ timeout: 5000 });

    // Both add descriptions simultaneously
    await page1.getByLabel(/description/i).fill('Description from User 1');
    await page2.getByLabel(/description/i).fill('Description from User 2');

    // Both save
    await Promise.all([
      page1.getByRole('button', { name: /save/i }).click(),
      page2.getByRole('button', { name: /save/i }).click(),
    ]);

    // Last write should win (User 2)
    await expect(page1.getByText('Description from User 2')).toBeVisible({ timeout: 5000 });

    await context1.close();
    await context2.close();
  });
});
