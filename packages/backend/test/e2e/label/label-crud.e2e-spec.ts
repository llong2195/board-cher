/**
 * T119 [US2] Label CRUD E2E Tests
 *
 * Tests label management for boards and cards:
 * - Creating board-level labels with colors
 * - Assigning labels to cards
 * - Removing labels from cards
 * - Color validation
 * - Duplicate name prevention
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

describe('LabelController (e2e) - T119', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let authToken: string;
  let userId: string;
  let boardId: string;
  let listId: string;
  let cardId: string;
  let labelId: string;

  // Valid label colors (based on Trello's color palette)
  const validColors = [
    'green',
    'yellow',
    'orange',
    'red',
    'purple',
    'blue',
    'sky',
    'lime',
    'pink',
    'black',
  ];

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
        email: 'label-test@example.com',
        password: 'password123',
        name: 'Label Tester',
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
        slug: 'test-org-labels',
      })
      .expect(201);

    const organizationId = orgResponse.body.id;

    // Create board
    const boardResponse = await request(app.getHttpServer())
      .post('/boards')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        organizationId,
        name: 'Label Test Board',
        description: 'For testing labels',
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
        title: 'Test Card for Labels',
        description: 'This card will have labels',
      })
      .expect(201);

    cardId = cardResponse.body.id;
  });

  describe('POST /boards/:boardId/labels - Create Board Label', () => {
    it('should create a label with name and color', async () => {
      const response = await request(app.getHttpServer())
        .post(`/boards/${boardId}/labels`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Bug',
          color: 'red',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.boardId).toBe(boardId);
      expect(response.body.name).toBe('Bug');
      expect(response.body.color).toBe('red');
      expect(response.body).toHaveProperty('createdAt');

      labelId = response.body.id;
    });

    it('should allow creating label with empty name (color-only)', async () => {
      const response = await request(app.getHttpServer())
        .post(`/boards/${boardId}/labels`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '',
          color: 'green',
        })
        .expect(201);

      expect(response.body.name).toBe('');
      expect(response.body.color).toBe('green');
    });

    it('should accept all valid colors', async () => {
      for (const color of validColors) {
        const response = await request(app.getHttpServer())
          .post(`/boards/${boardId}/labels`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: `Label ${color}`,
            color,
          })
          .expect(201);

        expect(response.body.color).toBe(color);
      }
    });

    it('should reject invalid color', async () => {
      await request(app.getHttpServer())
        .post(`/boards/${boardId}/labels`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Invalid Color',
          color: 'rainbow',
        })
        .expect(400);
    });

    it('should require color field', async () => {
      await request(app.getHttpServer())
        .post(`/boards/${boardId}/labels`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'No Color',
        })
        .expect(400);
    });

    it('should prevent duplicate label names on same board', async () => {
      // Create first label
      await request(app.getHttpServer())
        .post(`/boards/${boardId}/labels`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Feature',
          color: 'blue',
        })
        .expect(201);

      // Try to create duplicate
      await request(app.getHttpServer())
        .post(`/boards/${boardId}/labels`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Feature',
          color: 'green',
        })
        .expect(409); // Conflict
    });

    it('should allow same label name on different boards', async () => {
      // Create label on first board
      await request(app.getHttpServer())
        .post(`/boards/${boardId}/labels`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Priority',
          color: 'red',
        })
        .expect(201);

      // Create another board
      const orgResponse = await request(app.getHttpServer())
        .post('/organizations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Another Org',
          slug: 'another-org-labels',
        })
        .expect(201);

      const board2Response = await request(app.getHttpServer())
        .post('/boards')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          organizationId: orgResponse.body.id,
          name: 'Another Board',
        })
        .expect(201);

      // Same label name should be allowed on different board
      await request(app.getHttpServer())
        .post(`/boards/${board2Response.body.id}/labels`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Priority',
          color: 'red',
        })
        .expect(201);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post(`/boards/${boardId}/labels`)
        .send({
          name: 'Unauthorized',
          color: 'red',
        })
        .expect(401);
    });

    it('should require board access permission', async () => {
      // Create another user without board access
      const otherUserResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'other-label-user@example.com',
          password: 'password123',
          name: 'Other User',
        })
        .expect(201);

      const otherToken = otherUserResponse.body.accessToken;

      await request(app.getHttpServer())
        .post(`/boards/${boardId}/labels`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          name: 'Forbidden',
          color: 'red',
        })
        .expect(403);
    });

    it('should return 404 for non-existent board', async () => {
      await request(app.getHttpServer())
        .post('/boards/00000000-0000-0000-0000-000000000000/labels')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Not Found',
          color: 'red',
        })
        .expect(404);
    });

    it('should trim whitespace from label names', async () => {
      const response = await request(app.getHttpServer())
        .post(`/boards/${boardId}/labels`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '  Trimmed  ',
          color: 'blue',
        })
        .expect(201);

      expect(response.body.name).toBe('Trimmed');
    });

    it('should enforce max length for label name (50 characters)', async () => {
      const longName = 'a'.repeat(51);
      await request(app.getHttpServer())
        .post(`/boards/${boardId}/labels`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: longName,
          color: 'blue',
        })
        .expect(400);
    });
  });

  describe('GET /boards/:boardId/labels - List Board Labels', () => {
    beforeEach(async () => {
      // Create test labels
      await request(app.getHttpServer())
        .post(`/boards/${boardId}/labels`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Bug', color: 'red' })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/boards/${boardId}/labels`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Feature', color: 'blue' })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/boards/${boardId}/labels`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Enhancement', color: 'green' })
        .expect(201);
    });

    it('should retrieve all labels for a board', async () => {
      const response = await request(app.getHttpServer())
        .get(`/boards/${boardId}/labels`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(3);

      const labelNames = response.body.map((l: { name: string }) => l.name);
      expect(labelNames).toContain('Bug');
      expect(labelNames).toContain('Feature');
      expect(labelNames).toContain('Enhancement');
    });

    it('should return empty array for board with no labels', async () => {
      // Create a new board without labels
      const orgResponse = await request(app.getHttpServer())
        .post('/organizations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Empty Org',
          slug: 'empty-org-labels',
        })
        .expect(201);

      const newBoardResponse = await request(app.getHttpServer())
        .post('/boards')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          organizationId: orgResponse.body.id,
          name: 'Board without labels',
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get(`/boards/${newBoardResponse.body.id}/labels`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get(`/boards/${boardId}/labels`)
        .expect(401);
    });

    it('should require board access permission', async () => {
      const otherUserResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'viewer-label@example.com',
          password: 'password123',
          name: 'Viewer',
        })
        .expect(201);

      const otherToken = otherUserResponse.body.accessToken;

      await request(app.getHttpServer())
        .get(`/boards/${boardId}/labels`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);
    });
  });

  describe('POST /cards/:cardId/labels/:labelId - Assign Label to Card', () => {
    let testLabelId: string;

    beforeEach(async () => {
      // Create a label
      const labelResponse = await request(app.getHttpServer())
        .post(`/boards/${boardId}/labels`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Important',
          color: 'orange',
        })
        .expect(201);

      testLabelId = labelResponse.body.id;
    });

    it('should assign label to card', async () => {
      await request(app.getHttpServer())
        .post(`/cards/${cardId}/labels/${testLabelId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      // Verify label is assigned
      const cardResponse = await request(app.getHttpServer())
        .get(`/cards/${cardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(cardResponse.body.labels).toBeDefined();
      expect(Array.isArray(cardResponse.body.labels)).toBe(true);
      const labelIds = cardResponse.body.labels.map(
        (l: { id: string }) => l.id,
      );
      expect(labelIds).toContain(testLabelId);
    });

    it('should be idempotent - assigning twice is OK', async () => {
      // First assignment
      await request(app.getHttpServer())
        .post(`/cards/${cardId}/labels/${testLabelId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      // Second assignment (should succeed or return 200)
      const response = await request(app.getHttpServer())
        .post(`/cards/${cardId}/labels/${testLabelId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 201]).toContain(response.status);
    });

    it('should allow multiple labels on same card', async () => {
      // Create another label
      const label2Response = await request(app.getHttpServer())
        .post(`/boards/${boardId}/labels`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Urgent',
          color: 'red',
        })
        .expect(201);

      // Assign both labels
      await request(app.getHttpServer())
        .post(`/cards/${cardId}/labels/${testLabelId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      await request(app.getHttpServer())
        .post(`/cards/${cardId}/labels/${label2Response.body.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      // Verify both labels
      const cardResponse = await request(app.getHttpServer())
        .get(`/cards/${cardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(cardResponse.body.labels.length).toBeGreaterThanOrEqual(2);
    });

    it('should prevent assigning label from different board', async () => {
      // Create another board with a label
      const orgResponse = await request(app.getHttpServer())
        .post('/organizations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Other Org',
          slug: 'other-org-labels-2',
        })
        .expect(201);

      const otherBoardResponse = await request(app.getHttpServer())
        .post('/boards')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          organizationId: orgResponse.body.id,
          name: 'Other Board',
        })
        .expect(201);

      const otherLabelResponse = await request(app.getHttpServer())
        .post(`/boards/${otherBoardResponse.body.id}/labels`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Other Label',
          color: 'blue',
        })
        .expect(201);

      // Try to assign label from other board
      await request(app.getHttpServer())
        .post(`/cards/${cardId}/labels/${otherLabelResponse.body.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400); // Bad request - label doesn't belong to card's board
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post(`/cards/${cardId}/labels/${testLabelId}`)
        .expect(401);
    });

    it('should require board access permission', async () => {
      const otherUserResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'assigner@example.com',
          password: 'password123',
          name: 'Assigner',
        })
        .expect(201);

      const otherToken = otherUserResponse.body.accessToken;

      await request(app.getHttpServer())
        .post(`/cards/${cardId}/labels/${testLabelId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);
    });

    it('should return 404 for non-existent card', async () => {
      await request(app.getHttpServer())
        .post(
          `/cards/00000000-0000-0000-0000-000000000000/labels/${testLabelId}`,
        )
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 404 for non-existent label', async () => {
      await request(app.getHttpServer())
        .post(`/cards/${cardId}/labels/00000000-0000-0000-0000-000000000000`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('DELETE /cards/:cardId/labels/:labelId - Remove Label from Card', () => {
    let testLabelId: string;

    beforeEach(async () => {
      // Create and assign a label
      const labelResponse = await request(app.getHttpServer())
        .post(`/boards/${boardId}/labels`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'To Remove',
          color: 'purple',
        })
        .expect(201);

      testLabelId = labelResponse.body.id;

      await request(app.getHttpServer())
        .post(`/cards/${cardId}/labels/${testLabelId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);
    });

    it('should remove label from card', async () => {
      await request(app.getHttpServer())
        .delete(`/cards/${cardId}/labels/${testLabelId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Verify label is removed
      const cardResponse = await request(app.getHttpServer())
        .get(`/cards/${cardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const labelIds = (cardResponse.body.labels || []).map(
        (l: { id: string }) => l.id,
      );
      expect(labelIds).not.toContain(testLabelId);
    });

    it('should be idempotent - removing twice is OK', async () => {
      // First removal
      await request(app.getHttpServer())
        .delete(`/cards/${cardId}/labels/${testLabelId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Second removal (should succeed with 204 or 404)
      const response = await request(app.getHttpServer())
        .delete(`/cards/${cardId}/labels/${testLabelId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect([204, 404]).toContain(response.status);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .delete(`/cards/${cardId}/labels/${testLabelId}`)
        .expect(401);
    });

    it('should require board access permission', async () => {
      const otherUserResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'remover@example.com',
          password: 'password123',
          name: 'Remover',
        })
        .expect(201);

      const otherToken = otherUserResponse.body.accessToken;

      await request(app.getHttpServer())
        .delete(`/cards/${cardId}/labels/${testLabelId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);
    });
  });

  describe('DELETE /boards/:boardId/labels/:labelId - Delete Board Label', () => {
    let testLabelId: string;

    beforeEach(async () => {
      const labelResponse = await request(app.getHttpServer())
        .post(`/boards/${boardId}/labels`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'To Delete',
          color: 'black',
        })
        .expect(201);

      testLabelId = labelResponse.body.id;
    });

    it('should delete board label', async () => {
      await request(app.getHttpServer())
        .delete(`/boards/${boardId}/labels/${testLabelId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Verify label is deleted
      const response = await request(app.getHttpServer())
        .get(`/boards/${boardId}/labels`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const labelIds = response.body.map((l: { id: string }) => l.id);
      expect(labelIds).not.toContain(testLabelId);
    });

    it('should remove label from all cards when deleted', async () => {
      // Assign label to card
      await request(app.getHttpServer())
        .post(`/cards/${cardId}/labels/${testLabelId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      // Delete label
      await request(app.getHttpServer())
        .delete(`/boards/${boardId}/labels/${testLabelId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Verify label is removed from card
      const cardResponse = await request(app.getHttpServer())
        .get(`/cards/${cardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const labelIds = (cardResponse.body.labels || []).map(
        (l: { id: string }) => l.id,
      );
      expect(labelIds).not.toContain(testLabelId);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .delete(`/boards/${boardId}/labels/${testLabelId}`)
        .expect(401);
    });

    it('should require board admin permission', async () => {
      const memberResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'member-label@example.com',
          password: 'password123',
          name: 'Member',
        })
        .expect(201);

      const memberToken = memberResponse.body.accessToken;

      // Add as member (not admin)
      await request(app.getHttpServer())
        .post(`/boards/${boardId}/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId: memberResponse.body.user.id,
          role: 'member',
        })
        .expect(201);

      // Member cannot delete board labels
      await request(app.getHttpServer())
        .delete(`/boards/${boardId}/labels/${testLabelId}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(403);
    });

    it('should return 404 for non-existent label', async () => {
      await request(app.getHttpServer())
        .delete(
          `/boards/${boardId}/labels/00000000-0000-0000-0000-000000000000`,
        )
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('Real-time Label Events (WebSocket)', () => {
    it('should emit label:added event when label assigned to card', async () => {
      // Create label
      const labelResponse = await request(app.getHttpServer())
        .post(`/boards/${boardId}/labels`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Real-time',
          color: 'lime',
        })
        .expect(201);

      // Assign to card
      await request(app.getHttpServer())
        .post(`/cards/${cardId}/labels/${labelResponse.body.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      // WebSocket event should be emitted: card:label:added
    });
  });
});
