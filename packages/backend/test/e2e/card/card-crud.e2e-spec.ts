/**
 * End-to-End Tests for Card CRUD Operations
 * User Story 1: Create and Organize Work Items
 *
 * Test Coverage:
 * - POST /lists/:id/cards - Create card in list
 * - GET /lists/:id/cards - Get all cards in list (ordered by position)
 * - GET /cards/:id - Get single card with details
 * - PUT /cards/:id - Update card (title, description, dueDate)
 * - DELETE /cards/:id - Delete card and update positions
 *
 * TDD Approach: These tests are written FIRST and will fail until implementation is complete.
 * Expected behavior based on contracts/openapi.yaml
 */

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../../src/app.module';
import { DataSource } from 'typeorm/data-source/DataSource';

describe('Card CRUD Operations (e2e)', () => {
  let app: INestApplication<App>;
  let authToken: string;
  let userId: string;
  let boardId: string;
  let listId: string;
  let dataSource: DataSource;

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
    dataSource = app.get<DataSource>(DataSource);

    // Register and authenticate a test user
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'cardtest@example.com',
        password: 'TestPassword123!',
        name: 'Card Test User',
      })
      .expect(201);

    authToken = registerResponse.body.tokens.accessToken;
    userId = registerResponse.body.user.id;

    // Create a board for testing
    const boardResponse = await request(app.getHttpServer())
      .post('/boards')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Card Test Board',
        description: 'Board for testing card operations',
      })
      .expect(201);

    boardId = boardResponse.body.id;

    // Create a list for testing cards
    const listResponse = await request(app.getHttpServer())
      .post(`/boards/${boardId}/lists`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'To Do',
        position: 1,
      })
      .expect(201);

    listId = listResponse.body.id;
  });

  afterAll(async () => {
    await dataSource.dropDatabase();
    await app.close();
  });

  describe('POST /lists/:id/cards - Create card', () => {
    it('should create a card with valid data', async () => {
      const response = await request(app.getHttpServer())
        .post(`/lists/${listId}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Implement login page',
          description:
            'Create a responsive login page with email/password fields',
          position: 1,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Implement login page');
      expect(response.body.description).toBe(
        'Create a responsive login page with email/password fields',
      );
      expect(response.body.listId).toBe(listId);
      expect(response.body.position).toBe(1);
      expect(response.body.createdAt).toBeDefined();
      expect(response.body.updatedAt).toBeDefined();
    });

    it('should create a card with minimal data (only title)', async () => {
      const response = await request(app.getHttpServer())
        .post(`/lists/${listId}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Fix navbar bug',
        })
        .expect(201);

      expect(response.body.title).toBe('Fix navbar bug');
      expect(response.body.description).toBeNull();
      expect(response.body.listId).toBe(listId);
      expect(response.body.position).toBeGreaterThan(0);
    });

    it('should auto-calculate position when not provided', async () => {
      // Create first card without position
      const response1 = await request(app.getHttpServer())
        .post(`/lists/${listId}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'First auto-position card',
        })
        .expect(201);

      // Create second card without position
      const response2 = await request(app.getHttpServer())
        .post(`/lists/${listId}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Second auto-position card',
        })
        .expect(201);

      expect(response2.body.position).toBeGreaterThan(response1.body.position);
    });

    it('should reject card creation with empty title', async () => {
      await request(app.getHttpServer())
        .post(`/lists/${listId}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: '',
          description: 'This should fail',
        })
        .expect(400);
    });

    it('should reject card creation with title exceeding max length', async () => {
      await request(app.getHttpServer())
        .post(`/lists/${listId}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'A'.repeat(501), // Assuming max length is 500
        })
        .expect(400);
    });

    it('should reject card creation without authentication', async () => {
      await request(app.getHttpServer())
        .post(`/lists/${listId}/cards`)
        .send({
          title: 'Unauthorized card',
        })
        .expect(401);
    });

    it('should reject card creation for non-existent list', async () => {
      await request(app.getHttpServer())
        .post('/lists/99999999-9999-9999-9999-999999999999/cards')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Card in non-existent list',
        })
        .expect(404);
    });

    it('should reject card creation with negative position', async () => {
      await request(app.getHttpServer())
        .post(`/lists/${listId}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Invalid position card',
          position: -1,
        })
        .expect(400);
    });

    it('should create card with due date', async () => {
      const dueDate = new Date('2025-12-31T23:59:59Z').toISOString();

      const response = await request(app.getHttpServer())
        .post(`/lists/${listId}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Card with due date',
          dueDate: dueDate,
        })
        .expect(201);

      expect(response.body.dueDate).toBe(dueDate);
    });

    it('should reject card with invalid due date format', async () => {
      await request(app.getHttpServer())
        .post(`/lists/${listId}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Invalid due date',
          dueDate: 'not-a-date',
        })
        .expect(400);
    });
  });

  describe('GET /lists/:id/cards - Get all cards in list', () => {
    let testListId: string;

    beforeAll(async () => {
      // Create a new list for this test suite
      const listResponse = await request(app.getHttpServer())
        .post(`/boards/${boardId}/lists`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Get Cards Test List',
        })
        .expect(201);

      testListId = listResponse.body.id;

      // Create multiple cards with specific positions
      await request(app.getHttpServer())
        .post(`/lists/${testListId}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Card at position 3',
          position: 3,
        })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/lists/${testListId}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Card at position 1',
          position: 1,
        })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/lists/${testListId}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Card at position 2',
          position: 2,
        })
        .expect(201);
    });

    it('should return all cards in list ordered by position', async () => {
      const response = await request(app.getHttpServer())
        .get(`/lists/${testListId}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(3);

      // Verify cards are ordered by position
      for (let i = 0; i < response.body.length - 1; i++) {
        expect(response.body[i].position).toBeLessThan(
          response.body[i + 1].position,
        );
      }

      // Verify expected titles in order
      const titles = response.body.map((card: { title: string }) => card.title);
      expect(titles).toContain('Card at position 1');
      expect(titles).toContain('Card at position 2');
      expect(titles).toContain('Card at position 3');
    });

    it('should return empty array for list with no cards', async () => {
      // Create an empty list
      const emptyListResponse = await request(app.getHttpServer())
        .post(`/boards/${boardId}/lists`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Empty List',
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get(`/lists/${emptyListResponse.body.id}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should reject request without authentication', async () => {
      await request(app.getHttpServer())
        .get(`/lists/${testListId}/cards`)
        .expect(401);
    });

    it('should return 404 for non-existent list', async () => {
      await request(app.getHttpServer())
        .get('/lists/99999999-9999-9999-9999-999999999999/cards')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('GET /cards/:id - Get single card', () => {
    let cardId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post(`/lists/${listId}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Card for GET test',
          description: 'Detailed description for testing',
        })
        .expect(201);

      cardId = response.body.id;
    });

    it('should return card with all details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/cards/${cardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(cardId);
      expect(response.body.title).toBe('Card for GET test');
      expect(response.body.description).toBe(
        'Detailed description for testing',
      );
      expect(response.body.listId).toBe(listId);
      expect(response.body.position).toBeGreaterThan(0);
      expect(response.body.createdAt).toBeDefined();
      expect(response.body.updatedAt).toBeDefined();
    });

    it('should reject request without authentication', async () => {
      await request(app.getHttpServer()).get(`/cards/${cardId}`).expect(401);
    });

    it('should return 404 for non-existent card', async () => {
      await request(app.getHttpServer())
        .get('/cards/99999999-9999-9999-9999-999999999999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 403 for card in board without access', async () => {
      // Create another user
      const otherUserResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'otheruser@example.com',
          password: 'OtherPassword123!',
          name: 'Other User',
        })
        .expect(201);

      const otherToken = otherUserResponse.body.tokens.accessToken;

      // Try to access card from first user's board
      await request(app.getHttpServer())
        .get(`/cards/${cardId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);
    });
  });

  describe('PUT /cards/:id - Update card', () => {
    let cardId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post(`/lists/${listId}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Original Title',
          description: 'Original Description',
        })
        .expect(201);

      cardId = response.body.id;
    });

    it('should update card title', async () => {
      const response = await request(app.getHttpServer())
        .put(`/cards/${cardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Title',
        })
        .expect(200);

      expect(response.body.title).toBe('Updated Title');
      expect(response.body.description).toBe('Original Description');
    });

    it('should update card description', async () => {
      const response = await request(app.getHttpServer())
        .put(`/cards/${cardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Updated Description',
        })
        .expect(200);

      expect(response.body.title).toBe('Original Title');
      expect(response.body.description).toBe('Updated Description');
    });

    it('should update multiple fields at once', async () => {
      const dueDate = new Date('2025-12-31T23:59:59Z').toISOString();

      const response = await request(app.getHttpServer())
        .put(`/cards/${cardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'New Title',
          description: 'New Description',
          dueDate: dueDate,
        })
        .expect(200);

      expect(response.body.title).toBe('New Title');
      expect(response.body.description).toBe('New Description');
      expect(response.body.dueDate).toBe(dueDate);
    });

    it('should clear description when set to null', async () => {
      const response = await request(app.getHttpServer())
        .put(`/cards/${cardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: null,
        })
        .expect(200);

      expect(response.body.description).toBeNull();
    });

    it('should clear due date when set to null', async () => {
      // First set a due date
      await request(app.getHttpServer())
        .put(`/cards/${cardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          dueDate: new Date('2025-12-31').toISOString(),
        })
        .expect(200);

      // Then clear it
      const response = await request(app.getHttpServer())
        .put(`/cards/${cardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          dueDate: null,
        })
        .expect(200);

      expect(response.body.dueDate).toBeNull();
    });

    it('should reject update with empty title', async () => {
      await request(app.getHttpServer())
        .put(`/cards/${cardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: '',
        })
        .expect(400);
    });

    it('should reject update with title exceeding max length', async () => {
      await request(app.getHttpServer())
        .put(`/cards/${cardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'A'.repeat(501),
        })
        .expect(400);
    });

    it('should reject update without authentication', async () => {
      await request(app.getHttpServer())
        .put(`/cards/${cardId}`)
        .send({
          title: 'Unauthorized Update',
        })
        .expect(401);
    });

    it('should return 404 for non-existent card', async () => {
      await request(app.getHttpServer())
        .put('/cards/99999999-9999-9999-9999-999999999999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Update Non-existent',
        })
        .expect(404);
    });

    it('should prevent update by user without access to board', async () => {
      // Create another user
      const otherUserResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'unauthorized@example.com',
          password: 'UnauthorizedPass123!',
          name: 'Unauthorized User',
        })
        .expect(201);

      const otherToken = otherUserResponse.body.tokens.accessToken;

      await request(app.getHttpServer())
        .put(`/cards/${cardId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          title: 'Unauthorized Update',
        })
        .expect(403);
    });

    it('should update updatedAt timestamp', async () => {
      const beforeUpdate = new Date();

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 100));

      const response = await request(app.getHttpServer())
        .put(`/cards/${cardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Timestamp Test',
        })
        .expect(200);

      const updatedAt = new Date(response.body.updatedAt);
      expect(updatedAt.getTime()).toBeGreaterThan(beforeUpdate.getTime());
    });
  });

  describe('DELETE /cards/:id - Delete card', () => {
    it('should delete card and return 204', async () => {
      // Create a card to delete
      const createResponse = await request(app.getHttpServer())
        .post(`/lists/${listId}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Card to Delete',
        })
        .expect(201);

      const cardId = createResponse.body.id;

      // Delete the card
      await request(app.getHttpServer())
        .delete(`/cards/${cardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Verify card is deleted
      await request(app.getHttpServer())
        .get(`/cards/${cardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should recalculate positions after deletion', async () => {
      // Create a new list for this test
      const listResponse = await request(app.getHttpServer())
        .post(`/boards/${boardId}/lists`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Delete Test List',
        })
        .expect(201);

      const testListId = listResponse.body.id;

      // Create 3 cards
      const card1 = await request(app.getHttpServer())
        .post(`/lists/${testListId}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Card 1',
          position: 1,
        })
        .expect(201);

      const card2 = await request(app.getHttpServer())
        .post(`/lists/${testListId}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Card 2',
          position: 2,
        })
        .expect(201);

      const card3 = await request(app.getHttpServer())
        .post(`/lists/${testListId}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Card 3',
          position: 3,
        })
        .expect(201);

      // Delete middle card
      await request(app.getHttpServer())
        .delete(`/cards/${card2.body.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Verify remaining cards have correct positions
      const remainingCards = await request(app.getHttpServer())
        .get(`/lists/${testListId}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(remainingCards.body.length).toBe(2);
      expect(remainingCards.body[0].title).toBe('Card 1');
      expect(remainingCards.body[1].title).toBe('Card 3');
    });

    it('should reject deletion without authentication', async () => {
      const createResponse = await request(app.getHttpServer())
        .post(`/lists/${listId}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Card for Auth Test',
        })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/cards/${createResponse.body.id}`)
        .expect(401);
    });

    it('should return 404 for non-existent card', async () => {
      await request(app.getHttpServer())
        .delete('/cards/99999999-9999-9999-9999-999999999999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should prevent deletion by user without access', async () => {
      // Create a card
      const createResponse = await request(app.getHttpServer())
        .post(`/lists/${listId}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Protected Card',
        })
        .expect(201);

      // Create another user
      const otherUserResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'noaccess@example.com',
          password: 'NoAccess123!',
          name: 'No Access User',
        })
        .expect(201);

      const otherToken = otherUserResponse.body.tokens.accessToken;

      // Try to delete card from first user's board
      await request(app.getHttpServer())
        .delete(`/cards/${createResponse.body.id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);
    });

    it('should handle deletion of already deleted card', async () => {
      const createResponse = await request(app.getHttpServer())
        .post(`/lists/${listId}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Double Delete Test',
        })
        .expect(201);

      const cardId = createResponse.body.id;

      // First deletion
      await request(app.getHttpServer())
        .delete(`/cards/${cardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Second deletion should return 404
      await request(app.getHttpServer())
        .delete(`/cards/${cardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('Card validation edge cases', () => {
    it('should handle very long descriptions', async () => {
      const longDescription = 'A'.repeat(10000); // 10k characters

      const response = await request(app.getHttpServer())
        .post(`/lists/${listId}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Long Description Card',
          description: longDescription,
        })
        .expect(201);

      expect(response.body.description).toBe(longDescription);
    });

    it('should handle special characters in title', async () => {
      const specialTitle = 'Card with émojis 🎉 and spëcial çhars!';

      const response = await request(app.getHttpServer())
        .post(`/lists/${listId}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: specialTitle,
        })
        .expect(201);

      expect(response.body.title).toBe(specialTitle);
    });

    it('should handle markdown in description', async () => {
      const markdownDescription = `
# Heading
## Subheading
- List item 1
- List item 2

**Bold text** and *italic text*

\`code block\`
      `;

      const response = await request(app.getHttpServer())
        .post(`/lists/${listId}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Markdown Card',
          description: markdownDescription,
        })
        .expect(201);

      expect(response.body.description).toBe(markdownDescription);
    });

    it('should handle XSS attempts in title', async () => {
      const xssTitle = '<script>alert("XSS")</script>';

      const response = await request(app.getHttpServer())
        .post(`/lists/${listId}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: xssTitle,
        })
        .expect(201);

      // Title should be stored but will be sanitized on display
      expect(response.body.title).toBeDefined();
    });
  });
});
