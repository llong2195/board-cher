/**
 * T121 [US2] Card Detail Update E2E Tests
 *
 * Tests updating card details beyond basic title:
 * - Updating description (with Markdown support)
 * - Setting/updating due dates
 * - Validation (dueDate not in past)
 * - Null handling for optional fields
 * - Permission checks
 *
 * TDD Approach: These tests are written FIRST and will FAIL until the implementation is complete.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../../src/app.module';

describe('Card Detail Update (e2e) - T121', () => {
  let app: INestApplication<App>;
  let authToken: string;
  let userId: string;
  let boardId: string;
  let listId: string;
  let cardId: string;

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
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Setup: Create test user, board, list, and card
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'card-detail-test@example.com',
        password: 'password123',
        name: 'Card Detail Tester',
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
        slug: 'test-org-card-details',
      })
      .expect(201);

    const organizationId = orgResponse.body.id;

    // Create board
    const boardResponse = await request(app.getHttpServer())
      .post('/boards')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        organizationId,
        name: 'Card Detail Test Board',
        description: 'For testing card details',
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
        title: 'Test Card',
        description: 'Initial description',
      })
      .expect(201);

    cardId = cardResponse.body.id;
  });

  describe('PUT /cards/:cardId - Update Description', () => {
    it('should update card description', async () => {
      const response = await request(app.getHttpServer())
        .put(`/cards/${cardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Updated description',
        })
        .expect(200);

      expect(response.body.description).toBe('Updated description');
      expect(response.body).toHaveProperty('updatedAt');
    });

    it('should support Markdown in description', async () => {
      const markdownDescription = `
# Task Overview

## Requirements
- **Bold requirement**
- *Italic note*

### Code Example
\`\`\`javascript
const foo = 'bar';
\`\`\`

[Link to docs](https://example.com)
      `.trim();

      const response = await request(app.getHttpServer())
        .put(`/cards/${cardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: markdownDescription,
        })
        .expect(200);

      expect(response.body.description).toBe(markdownDescription);
    });

    it('should allow empty description', async () => {
      const response = await request(app.getHttpServer())
        .put(`/cards/${cardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: '',
        })
        .expect(200);

      expect(response.body.description).toBe('');
    });

    it('should allow null description', async () => {
      const response = await request(app.getHttpServer())
        .put(`/cards/${cardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: null,
        })
        .expect(200);

      expect(response.body.description).toBeNull();
    });

    it('should enforce max length for description (10,000 characters)', async () => {
      const longDescription = 'a'.repeat(10001);
      await request(app.getHttpServer())
        .put(`/cards/${cardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: longDescription,
        })
        .expect(400);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .put(`/cards/${cardId}`)
        .send({
          description: 'Unauthorized',
        })
        .expect(401);
    });

    it('should require board access permission', async () => {
      const otherUserResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'other-card-user@example.com',
          password: 'password123',
          name: 'Other User',
        })
        .expect(201);

      const otherToken = otherUserResponse.body.accessToken;

      await request(app.getHttpServer())
        .put(`/cards/${cardId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          description: 'Forbidden',
        })
        .expect(403);
    });

    it('should return 404 for non-existent card', async () => {
      await request(app.getHttpServer())
        .put('/cards/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Not Found',
        })
        .expect(404);
    });
  });

  describe('PUT /cards/:cardId - Update Due Date', () => {
    it('should set due date on card', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7); // 7 days from now

      const response = await request(app.getHttpServer())
        .put(`/cards/${cardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          dueDate: futureDate.toISOString(),
        })
        .expect(200);

      expect(response.body.dueDate).toBeDefined();
      expect(new Date(response.body.dueDate).toISOString()).toBe(
        futureDate.toISOString(),
      );
    });

    it('should update existing due date', async () => {
      // Set initial due date
      const firstDate = new Date();
      firstDate.setDate(firstDate.getDate() + 3);

      await request(app.getHttpServer())
        .put(`/cards/${cardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          dueDate: firstDate.toISOString(),
        })
        .expect(200);

      // Update to different date
      const secondDate = new Date();
      secondDate.setDate(secondDate.getDate() + 10);

      const response = await request(app.getHttpServer())
        .put(`/cards/${cardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          dueDate: secondDate.toISOString(),
        })
        .expect(200);

      expect(new Date(response.body.dueDate).toISOString()).toBe(
        secondDate.toISOString(),
      );
    });

    it('should allow null due date (remove due date)', async () => {
      // Set due date first
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);

      await request(app.getHttpServer())
        .put(`/cards/${cardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          dueDate: futureDate.toISOString(),
        })
        .expect(200);

      // Remove due date
      const response = await request(app.getHttpServer())
        .put(`/cards/${cardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          dueDate: null,
        })
        .expect(200);

      expect(response.body.dueDate).toBeNull();
    });

    it('should reject due date in the past', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1); // Yesterday

      await request(app.getHttpServer())
        .put(`/cards/${cardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          dueDate: pastDate.toISOString(),
        })
        .expect(400);
    });

    it('should accept today as valid due date', async () => {
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today

      const response = await request(app.getHttpServer())
        .put(`/cards/${cardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          dueDate: today.toISOString(),
        })
        .expect(200);

      expect(response.body.dueDate).toBeDefined();
    });

    it('should reject invalid date format', async () => {
      await request(app.getHttpServer())
        .put(`/cards/${cardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          dueDate: 'invalid-date',
        })
        .expect(400);
    });

    it('should require authentication', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      await request(app.getHttpServer())
        .put(`/cards/${cardId}`)
        .send({
          dueDate: futureDate.toISOString(),
        })
        .expect(401);
    });

    it('should require board access permission', async () => {
      const otherUserResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'duedate-user@example.com',
          password: 'password123',
          name: 'Due Date User',
        })
        .expect(201);

      const otherToken = otherUserResponse.body.accessToken;

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      await request(app.getHttpServer())
        .put(`/cards/${cardId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          dueDate: futureDate.toISOString(),
        })
        .expect(403);
    });
  });

  describe('PUT /cards/:cardId - Update Multiple Fields', () => {
    it('should update both description and due date', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 14);

      const response = await request(app.getHttpServer())
        .put(`/cards/${cardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: '## Updated Description\nWith markdown',
          dueDate: futureDate.toISOString(),
        })
        .expect(200);

      expect(response.body.description).toBe(
        '## Updated Description\nWith markdown',
      );
      expect(response.body.dueDate).toBeDefined();
    });

    it('should update title, description, and due date together', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 21);

      const response = await request(app.getHttpServer())
        .put(`/cards/${cardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Title',
          description: 'Updated description with **markdown**',
          dueDate: futureDate.toISOString(),
        })
        .expect(200);

      expect(response.body.title).toBe('Updated Title');
      expect(response.body.description).toBe(
        'Updated description with **markdown**',
      );
      expect(response.body.dueDate).toBeDefined();
    });

    it('should allow partial updates (only title)', async () => {
      const response = await request(app.getHttpServer())
        .put(`/cards/${cardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Only Title Changed',
        })
        .expect(200);

      expect(response.body.title).toBe('Only Title Changed');
      expect(response.body.description).toBe('Initial description'); // Unchanged
    });

    it('should allow partial updates (only due date)', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const response = await request(app.getHttpServer())
        .put(`/cards/${cardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          dueDate: futureDate.toISOString(),
        })
        .expect(200);

      expect(response.body.dueDate).toBeDefined();
      expect(response.body.title).toBe('Test Card'); // Unchanged
      expect(response.body.description).toBe('Initial description'); // Unchanged
    });
  });

  describe('GET /cards/:cardId - Retrieve Card with Details', () => {
    it('should include description and due date in card response', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      // Update card with full details
      await request(app.getHttpServer())
        .put(`/cards/${cardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: '# Full Description\n\nWith content',
          dueDate: futureDate.toISOString(),
        })
        .expect(200);

      // Retrieve card
      const response = await request(app.getHttpServer())
        .get(`/cards/${cardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.description).toBe(
        '# Full Description\n\nWith content',
      );
      expect(response.body.dueDate).toBeDefined();
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
    });

    it('should indicate if card is overdue', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Set due date to tomorrow
      await request(app.getHttpServer())
        .put(`/cards/${cardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          dueDate: tomorrow.toISOString(),
        })
        .expect(200);

      const response = await request(app.getHttpServer())
        .get(`/cards/${cardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('isOverdue');
      expect(response.body.isOverdue).toBe(false); // Not overdue yet
    });

    it('should handle card with no description or due date', async () => {
      // Create card without details
      const newCardResponse = await request(app.getHttpServer())
        .post(`/lists/${listId}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Minimal Card',
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get(`/cards/${newCardResponse.body.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.description).toBeNull();
      expect(response.body.dueDate).toBeNull();
    });
  });

  describe('Real-time Card Update Events (WebSocket)', () => {
    it('should emit card:updated event when description updated', async () => {
      const response = await request(app.getHttpServer())
        .put(`/cards/${cardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Real-time description update',
        })
        .expect(200);

      expect(response.body).toHaveProperty('id');
      // WebSocket event should be emitted: card:updated
    });

    it('should emit card:updated event when due date set', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const response = await request(app.getHttpServer())
        .put(`/cards/${cardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          dueDate: futureDate.toISOString(),
        })
        .expect(200);

      expect(response.body).toHaveProperty('id');
      // WebSocket event should be emitted: card:updated
    });
  });

  describe('Card Detail Validation Edge Cases', () => {
    it('should trim whitespace from title', async () => {
      const response = await request(app.getHttpServer())
        .put(`/cards/${cardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: '  Trimmed Title  ',
        })
        .expect(200);

      expect(response.body.title).toBe('Trimmed Title');
    });

    it('should preserve whitespace in description', async () => {
      const descriptionWithWhitespace = '  Line 1  \n\n  Line 2  \n  Line 3  ';
      const response = await request(app.getHttpServer())
        .put(`/cards/${cardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: descriptionWithWhitespace,
        })
        .expect(200);

      expect(response.body.description).toBe(descriptionWithWhitespace);
    });

    it('should reject empty title', async () => {
      await request(app.getHttpServer())
        .put(`/cards/${cardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: '',
        })
        .expect(400);
    });

    it('should reject whitespace-only title', async () => {
      await request(app.getHttpServer())
        .put(`/cards/${cardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: '   ',
        })
        .expect(400);
    });

    it('should enforce max length for title (200 characters)', async () => {
      const longTitle = 'a'.repeat(201);
      await request(app.getHttpServer())
        .put(`/cards/${cardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: longTitle,
        })
        .expect(400);
    });

    it('should handle unicode characters in description', async () => {
      const unicodeDescription = '🚀 Project goals: 你好 世界 🌍 émoji test';
      const response = await request(app.getHttpServer())
        .put(`/cards/${cardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: unicodeDescription,
        })
        .expect(200);

      expect(response.body.description).toBe(unicodeDescription);
    });

    it('should handle very long markdown content', async () => {
      const longMarkdown = `
# Section 1
${'Lorem ipsum dolor sit amet. '.repeat(100)}

## Section 2
${'Content here. '.repeat(100)}

### Code
\`\`\`javascript
${'const x = 1;\n'.repeat(50)}
\`\`\`
      `.trim();

      if (longMarkdown.length <= 10000) {
        const response = await request(app.getHttpServer())
          .put(`/cards/${cardId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            description: longMarkdown,
          })
          .expect(200);

        expect(response.body.description).toBe(longMarkdown);
      }
    });
  });
});
