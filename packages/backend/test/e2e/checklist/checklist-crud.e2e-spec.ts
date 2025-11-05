/**
 * T120 [US2] Checklist CRUD E2E Tests
 *
 * Tests checklist and checklist item management for cards:
 * - Creating checklists on cards
 * - Adding items to checklists
 * - Toggling item completion
 * - Deleting items and checklists
 * - Progress calculation (completedItems/totalItems)
 * - Permission checks
 *
 * TDD Approach: These tests are written FIRST and will FAIL until the implementation is complete.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../../src/app.module';
import { DataSource } from 'typeorm';

describe('ChecklistController (e2e) - T120', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let authToken: string;
  let userId: string;
  let boardId: string;
  let listId: string;
  let cardId: string;
  let checklistId: string;
  let itemId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    dataSource = moduleFixture.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    await dataSource.dropDatabase();
    await app.close();
  });

  beforeEach(async () => {
    // Setup: Create test user, board, list, and card
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'checklist-test@example.com',
        password: 'password123',
        name: 'Checklist Tester',
      })
      .expect(201);

    authToken = registerResponse.body.accessToken;
    userId = registerResponse.body.user.id;

    // Create organization
    const orgResponse = await request(app.getHttpServer())
      .post('/organizations')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Org',
        slug: 'test-org-checklists',
      })
      .expect(201);

    const organizationId = orgResponse.body.id;

    // Create board
    const boardResponse = await request(app.getHttpServer())
      .post('/boards')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        organizationId,
        name: 'Checklist Test Board',
        description: 'For testing checklists',
      })
      .expect(201);

    boardId = boardResponse.body.id;

    // Create list
    const listResponse = await request(app.getHttpServer())
      .post(`/boards/${boardId}/lists`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test List',
      })
      .expect(201);

    listId = listResponse.body.id;

    // Create card
    const cardResponse = await request(app.getHttpServer())
      .post(`/lists/${listId}/cards`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Test Card for Checklists',
        description: 'This card will have checklists',
      })
      .expect(201);

    cardId = cardResponse.body.id;
  });

  describe('POST /cards/:cardId/checklists - Create Checklist', () => {
    it('should create a checklist on a card', async () => {
      const response = await request(app.getHttpServer())
        .post(`/cards/${cardId}/checklists`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Setup Tasks',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.cardId).toBe(cardId);
      expect(response.body.name).toBe('Setup Tasks');
      expect(response.body.position).toBeDefined();
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body.items).toEqual([]); // Empty initially

      checklistId = response.body.id;
    });

    it('should validate required name field', async () => {
      await request(app.getHttpServer())
        .post(`/cards/${cardId}/checklists`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);
    });

    it('should reject empty name', async () => {
      await request(app.getHttpServer())
        .post(`/cards/${cardId}/checklists`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '',
        })
        .expect(400);
    });

    it('should reject whitespace-only name', async () => {
      await request(app.getHttpServer())
        .post(`/cards/${cardId}/checklists`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '   ',
        })
        .expect(400);
    });

    it('should enforce max length for name (100 characters)', async () => {
      const longName = 'a'.repeat(101);
      await request(app.getHttpServer())
        .post(`/cards/${cardId}/checklists`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: longName,
        })
        .expect(400);
    });

    it('should allow multiple checklists on same card', async () => {
      const response1 = await request(app.getHttpServer())
        .post(`/cards/${cardId}/checklists`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'First Checklist',
        })
        .expect(201);

      const response2 = await request(app.getHttpServer())
        .post(`/cards/${cardId}/checklists`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Second Checklist',
        })
        .expect(201);

      expect(response1.body.id).not.toBe(response2.body.id);
      expect(response1.body.position).toBeLessThan(response2.body.position);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post(`/cards/${cardId}/checklists`)
        .send({
          name: 'Unauthorized',
        })
        .expect(401);
    });

    it('should require board access permission', async () => {
      const otherUserResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'other-checklist-user@example.com',
          password: 'password123',
          name: 'Other User',
        })
        .expect(201);

      const otherToken = otherUserResponse.body.accessToken;

      await request(app.getHttpServer())
        .post(`/cards/${cardId}/checklists`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          name: 'Forbidden',
        })
        .expect(403);
    });

    it('should return 404 for non-existent card', async () => {
      await request(app.getHttpServer())
        .post('/cards/00000000-0000-0000-0000-000000000000/checklists')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Not Found',
        })
        .expect(404);
    });
  });

  describe('POST /checklists/:checklistId/items - Add Checklist Item', () => {
    beforeEach(async () => {
      // Create a checklist
      const checklistResponse = await request(app.getHttpServer())
        .post(`/cards/${cardId}/checklists`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Checklist',
        })
        .expect(201);

      checklistId = checklistResponse.body.id;
    });

    it('should add item to checklist', async () => {
      const response = await request(app.getHttpServer())
        .post(`/checklists/${checklistId}/items`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          text: 'Install dependencies',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.checklistId).toBe(checklistId);
      expect(response.body.text).toBe('Install dependencies');
      expect(response.body.isCompleted).toBe(false);
      expect(response.body.position).toBeDefined();
      expect(response.body).toHaveProperty('createdAt');

      itemId = response.body.id;
    });

    it('should validate required text field', async () => {
      await request(app.getHttpServer())
        .post(`/checklists/${checklistId}/items`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);
    });

    it('should reject empty text', async () => {
      await request(app.getHttpServer())
        .post(`/checklists/${checklistId}/items`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          text: '',
        })
        .expect(400);
    });

    it('should enforce max length for text (200 characters)', async () => {
      const longText = 'a'.repeat(201);
      await request(app.getHttpServer())
        .post(`/checklists/${checklistId}/items`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          text: longText,
        })
        .expect(400);
    });

    it('should add multiple items with sequential positions', async () => {
      const response1 = await request(app.getHttpServer())
        .post(`/checklists/${checklistId}/items`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          text: 'First item',
        })
        .expect(201);

      const response2 = await request(app.getHttpServer())
        .post(`/checklists/${checklistId}/items`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          text: 'Second item',
        })
        .expect(201);

      const response3 = await request(app.getHttpServer())
        .post(`/checklists/${checklistId}/items`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          text: 'Third item',
        })
        .expect(201);

      expect(response1.body.position).toBeLessThan(response2.body.position);
      expect(response2.body.position).toBeLessThan(response3.body.position);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post(`/checklists/${checklistId}/items`)
        .send({
          text: 'Unauthorized',
        })
        .expect(401);
    });

    it('should require board access permission', async () => {
      const otherUserResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'item-adder@example.com',
          password: 'password123',
          name: 'Item Adder',
        })
        .expect(201);

      const otherToken = otherUserResponse.body.accessToken;

      await request(app.getHttpServer())
        .post(`/checklists/${checklistId}/items`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          text: 'Forbidden',
        })
        .expect(403);
    });

    it('should return 404 for non-existent checklist', async () => {
      await request(app.getHttpServer())
        .post('/checklists/00000000-0000-0000-0000-000000000000/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          text: 'Not Found',
        })
        .expect(404);
    });
  });

  describe('PUT /checklist-items/:itemId - Update Checklist Item', () => {
    let testItemId: string;

    beforeEach(async () => {
      // Create checklist and item
      const checklistResponse = await request(app.getHttpServer())
        .post(`/cards/${cardId}/checklists`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Update Test Checklist',
        })
        .expect(201);

      checklistId = checklistResponse.body.id;

      const itemResponse = await request(app.getHttpServer())
        .post(`/checklists/${checklistId}/items`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          text: 'Item to update',
        })
        .expect(201);

      testItemId = itemResponse.body.id;
    });

    it('should toggle item completion', async () => {
      // Mark as completed
      const response1 = await request(app.getHttpServer())
        .put(`/checklist-items/${testItemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          isCompleted: true,
        })
        .expect(200);

      expect(response1.body.isCompleted).toBe(true);

      // Mark as not completed
      const response2 = await request(app.getHttpServer())
        .put(`/checklist-items/${testItemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          isCompleted: false,
        })
        .expect(200);

      expect(response2.body.isCompleted).toBe(false);
    });

    it('should update item text', async () => {
      const response = await request(app.getHttpServer())
        .put(`/checklist-items/${testItemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          text: 'Updated text',
        })
        .expect(200);

      expect(response.body.text).toBe('Updated text');
    });

    it('should update both text and completion', async () => {
      const response = await request(app.getHttpServer())
        .put(`/checklist-items/${testItemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          text: 'Completed task',
          isCompleted: true,
        })
        .expect(200);

      expect(response.body.text).toBe('Completed task');
      expect(response.body.isCompleted).toBe(true);
    });

    it('should validate text length', async () => {
      const longText = 'a'.repeat(201);
      await request(app.getHttpServer())
        .put(`/checklist-items/${testItemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          text: longText,
        })
        .expect(400);
    });

    it('should reject empty text', async () => {
      await request(app.getHttpServer())
        .put(`/checklist-items/${testItemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          text: '',
        })
        .expect(400);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .put(`/checklist-items/${testItemId}`)
        .send({
          isCompleted: true,
        })
        .expect(401);
    });

    it('should require board access permission', async () => {
      const otherUserResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'item-updater@example.com',
          password: 'password123',
          name: 'Item Updater',
        })
        .expect(201);

      const otherToken = otherUserResponse.body.accessToken;

      await request(app.getHttpServer())
        .put(`/checklist-items/${testItemId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          isCompleted: true,
        })
        .expect(403);
    });

    it('should return 404 for non-existent item', async () => {
      await request(app.getHttpServer())
        .put('/checklist-items/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          isCompleted: true,
        })
        .expect(404);
    });
  });

  describe('GET /cards/:cardId/checklists - Get Checklists with Progress', () => {
    beforeEach(async () => {
      // Create checklist with items
      const checklistResponse = await request(app.getHttpServer())
        .post(`/cards/${cardId}/checklists`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Progress Test',
        })
        .expect(201);

      checklistId = checklistResponse.body.id;

      // Add 3 items
      const item1 = await request(app.getHttpServer())
        .post(`/checklists/${checklistId}/items`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ text: 'Item 1' })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/checklists/${checklistId}/items`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ text: 'Item 2' })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/checklists/${checklistId}/items`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ text: 'Item 3' })
        .expect(201);

      // Complete one item
      await request(app.getHttpServer())
        .put(`/checklist-items/${item1.body.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ isCompleted: true })
        .expect(200);
    });

    it('should retrieve checklists with items and progress', async () => {
      const response = await request(app.getHttpServer())
        .get(`/cards/${cardId}/checklists`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);

      const checklist = response.body.find((c: any) => c.id === checklistId);
      expect(checklist).toBeDefined();
      expect(checklist.name).toBe('Progress Test');
      expect(checklist.items).toBeDefined();
      expect(Array.isArray(checklist.items)).toBe(true);
      expect(checklist.items.length).toBe(3);

      // Progress calculation
      expect(checklist.totalItems).toBe(3);
      expect(checklist.completedItems).toBe(1);
      expect(checklist.progress).toBeCloseTo(33.33, 1); // 1/3 = 33.33%
    });

    it('should calculate 0% progress for checklist with no completed items', async () => {
      // Create a new checklist with no completed items
      const newChecklistResponse = await request(app.getHttpServer())
        .post(`/cards/${cardId}/checklists`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Zero Progress',
        })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/checklists/${newChecklistResponse.body.id}/items`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ text: 'Incomplete item' })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get(`/cards/${cardId}/checklists`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const checklist = response.body.find(
        (c: any) => c.id === newChecklistResponse.body.id,
      );
      expect(checklist.progress).toBe(0);
    });

    it('should calculate 100% progress for fully completed checklist', async () => {
      // Create and complete all items
      const newChecklistResponse = await request(app.getHttpServer())
        .post(`/cards/${cardId}/checklists`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Complete',
        })
        .expect(201);

      const item1 = await request(app.getHttpServer())
        .post(`/checklists/${newChecklistResponse.body.id}/items`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ text: 'Item 1' })
        .expect(201);

      const item2 = await request(app.getHttpServer())
        .post(`/checklists/${newChecklistResponse.body.id}/items`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ text: 'Item 2' })
        .expect(201);

      // Complete both
      await request(app.getHttpServer())
        .put(`/checklist-items/${item1.body.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ isCompleted: true })
        .expect(200);

      await request(app.getHttpServer())
        .put(`/checklist-items/${item2.body.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ isCompleted: true })
        .expect(200);

      const response = await request(app.getHttpServer())
        .get(`/cards/${cardId}/checklists`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const checklist = response.body.find(
        (c: any) => c.id === newChecklistResponse.body.id,
      );
      expect(checklist.progress).toBe(100);
      expect(checklist.completedItems).toBe(2);
      expect(checklist.totalItems).toBe(2);
    });

    it('should handle checklist with no items (0 total)', async () => {
      const emptyChecklistResponse = await request(app.getHttpServer())
        .post(`/cards/${cardId}/checklists`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Empty',
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get(`/cards/${cardId}/checklists`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const checklist = response.body.find(
        (c: any) => c.id === emptyChecklistResponse.body.id,
      );
      expect(checklist.totalItems).toBe(0);
      expect(checklist.completedItems).toBe(0);
      expect(checklist.progress).toBe(0);
    });

    it('should return empty array for card with no checklists', async () => {
      // Create a new card
      const newCardResponse = await request(app.getHttpServer())
        .post(`/lists/${listId}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Card without checklists',
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get(`/cards/${newCardResponse.body.id}/checklists`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get(`/cards/${cardId}/checklists`)
        .expect(401);
    });

    it('should require board access permission', async () => {
      const otherUserResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'viewer-checklist@example.com',
          password: 'password123',
          name: 'Viewer',
        })
        .expect(201);

      const otherToken = otherUserResponse.body.accessToken;

      await request(app.getHttpServer())
        .get(`/cards/${cardId}/checklists`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);
    });
  });

  describe('DELETE /checklist-items/:itemId - Delete Checklist Item', () => {
    let testItemId: string;

    beforeEach(async () => {
      const checklistResponse = await request(app.getHttpServer())
        .post(`/cards/${cardId}/checklists`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Delete Test',
        })
        .expect(201);

      const itemResponse = await request(app.getHttpServer())
        .post(`/checklists/${checklistResponse.body.id}/items`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          text: 'Item to delete',
        })
        .expect(201);

      checklistId = checklistResponse.body.id;
      testItemId = itemResponse.body.id;
    });

    it('should delete checklist item', async () => {
      await request(app.getHttpServer())
        .delete(`/checklist-items/${testItemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Verify item is deleted
      const response = await request(app.getHttpServer())
        .get(`/cards/${cardId}/checklists`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const checklist = response.body.find(
        (c: { id: string }) => c.id === checklistId,
      );
      const itemIds = checklist.items.map((i: { id: string }) => i.id);
      expect(itemIds).not.toContain(testItemId);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .delete(`/checklist-items/${testItemId}`)
        .expect(401);
    });

    it('should require board access permission', async () => {
      const otherUserResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'item-deleter@example.com',
          password: 'password123',
          name: 'Item Deleter',
        })
        .expect(201);

      const otherToken = otherUserResponse.body.accessToken;

      await request(app.getHttpServer())
        .delete(`/checklist-items/${testItemId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);
    });

    it('should return 404 for non-existent item', async () => {
      await request(app.getHttpServer())
        .delete('/checklist-items/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('DELETE /checklists/:checklistId - Delete Checklist', () => {
    let testChecklistId: string;

    beforeEach(async () => {
      const checklistResponse = await request(app.getHttpServer())
        .post(`/cards/${cardId}/checklists`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Checklist to delete',
        })
        .expect(201);

      testChecklistId = checklistResponse.body.id;

      // Add some items
      await request(app.getHttpServer())
        .post(`/checklists/${testChecklistId}/items`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ text: 'Item 1' })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/checklists/${testChecklistId}/items`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ text: 'Item 2' })
        .expect(201);
    });

    it('should delete checklist and all its items', async () => {
      await request(app.getHttpServer())
        .delete(`/checklists/${testChecklistId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Verify checklist is deleted
      const response = await request(app.getHttpServer())
        .get(`/cards/${cardId}/checklists`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const checklistIds = response.body.map((c: { id: string }) => c.id);
      expect(checklistIds).not.toContain(testChecklistId);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .delete(`/checklists/${testChecklistId}`)
        .expect(401);
    });

    it('should require board access permission', async () => {
      const otherUserResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'checklist-deleter@example.com',
          password: 'password123',
          name: 'Checklist Deleter',
        })
        .expect(201);

      const otherToken = otherUserResponse.body.accessToken;

      await request(app.getHttpServer())
        .delete(`/checklists/${testChecklistId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);
    });

    it('should return 404 for non-existent checklist', async () => {
      await request(app.getHttpServer())
        .delete('/checklists/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('Real-time Checklist Events (WebSocket)', () => {
    it('should emit checklist:updated event when item toggled', async () => {
      // Create checklist and item
      const checklistResponse = await request(app.getHttpServer())
        .post(`/cards/${cardId}/checklists`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Real-time' })
        .expect(201);

      const itemResponse = await request(app.getHttpServer())
        .post(`/checklists/${checklistResponse.body.id}/items`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ text: 'Real-time item' })
        .expect(201);

      // Toggle completion
      await request(app.getHttpServer())
        .put(`/checklist-items/${itemResponse.body.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ isCompleted: true })
        .expect(200);

      // WebSocket event should be emitted: card:checklist:updated
    });
  });
});
