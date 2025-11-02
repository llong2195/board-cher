/**
 * T117 [US2] Comment CRUD E2E Tests
 *
 * Tests the complete lifecycle of card comments:
 * - Creating comments on cards
 * - Retrieving comments for a card
 * - Deleting comments
 * - Permission checks
 * - Validation
 *
 * TDD Approach: These tests are written FIRST and will FAIL until the implementation is complete.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../../src/app.module';

describe('CommentController (e2e) - T117', () => {
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
    // TODO: These will fail until auth, board, list, card endpoints are fully implemented
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'comment-test@example.com',
        password: 'password123',
        name: 'Comment Tester',
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
        slug: 'test-org-comments',
      })
      .expect(201);

    const organizationId = orgResponse.body.id;

    // Create board
    const boardResponse = await request(app.getHttpServer())
      .post('/boards')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        organizationId,
        name: 'Comment Test Board',
        description: 'For testing comments',
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
        title: 'Test Card for Comments',
        description: 'This card will have comments',
      })
      .expect(201);

    cardId = cardResponse.body.id;
  });

  describe('POST /cards/:cardId/comments - Create Comment', () => {
    it('should create a comment on a card', async () => {
      const response = await request(app.getHttpServer())
        .post(`/cards/${cardId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'This is a test comment',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.cardId).toBe(cardId);
      expect(response.body.userId).toBe(userId);
      expect(response.body.content).toBe('This is a test comment');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
      expect(response.body.isEdited).toBe(false);
    });

    it('should validate required content field', async () => {
      await request(app.getHttpServer())
        .post(`/cards/${cardId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);
    });

    it('should reject empty content', async () => {
      await request(app.getHttpServer())
        .post(`/cards/${cardId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: '',
        })
        .expect(400);
    });

    it('should reject whitespace-only content', async () => {
      await request(app.getHttpServer())
        .post(`/cards/${cardId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: '   ',
        })
        .expect(400);
    });

    it('should reject content exceeding 10,000 characters', async () => {
      const longContent = 'a'.repeat(10001);
      await request(app.getHttpServer())
        .post(`/cards/${cardId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: longContent,
        })
        .expect(400);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post(`/cards/${cardId}/comments`)
        .send({
          content: 'Unauthorized comment',
        })
        .expect(401);
    });

    it('should require board access permission', async () => {
      // Create another user without board access
      const otherUserResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'other-user@example.com',
          password: 'password123',
          name: 'Other User',
        })
        .expect(201);

      const otherToken = otherUserResponse.body.accessToken;

      await request(app.getHttpServer())
        .post(`/cards/${cardId}/comments`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          content: 'Unauthorized comment',
        })
        .expect(403);
    });

    it('should return 404 for non-existent card', async () => {
      await request(app.getHttpServer())
        .post('/cards/00000000-0000-0000-0000-000000000000/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Comment on non-existent card',
        })
        .expect(404);
    });

    it('should support markdown in content', async () => {
      const markdownContent =
        '**Bold text** and *italic text* with [links](https://example.com)';
      const response = await request(app.getHttpServer())
        .post(`/cards/${cardId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: markdownContent,
        })
        .expect(201);

      expect(response.body.content).toBe(markdownContent);
    });
  });

  describe('GET /cards/:cardId/comments - Get All Comments', () => {
    beforeEach(async () => {
      // Create multiple comments for testing
      await request(app.getHttpServer())
        .post(`/cards/${cardId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'First comment' })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/cards/${cardId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'Second comment' })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/cards/${cardId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'Third comment' })
        .expect(201);
    });

    it('should retrieve all comments for a card', async () => {
      const response = await request(app.getHttpServer())
        .get(`/cards/${cardId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(3);

      // Comments should be ordered by createdAt (oldest first)
      const timestamps = response.body.map((c: any) =>
        new Date(c.createdAt).getTime(),
      );
      expect(timestamps).toEqual([...timestamps].sort((a, b) => a - b));
    });

    it('should include user information in comments', async () => {
      const response = await request(app.getHttpServer())
        .get(`/cards/${cardId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const comment = response.body[0];
      expect(comment).toHaveProperty('user');
      expect(comment.user).toHaveProperty('id');
      expect(comment.user).toHaveProperty('name');
      expect(comment.user).not.toHaveProperty('passwordHash');
    });

    it('should return empty array for card with no comments', async () => {
      // Create a new card without comments
      const newCardResponse = await request(app.getHttpServer())
        .post(`/lists/${listId}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Card without comments',
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get(`/cards/${newCardResponse.body.id}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get(`/cards/${cardId}/comments`)
        .expect(401);
    });

    it('should require board access permission', async () => {
      // Create another user without board access
      const otherUserResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'viewer@example.com',
          password: 'password123',
          name: 'Viewer',
        })
        .expect(201);

      const otherToken = otherUserResponse.body.accessToken;

      await request(app.getHttpServer())
        .get(`/cards/${cardId}/comments`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);
    });

    it('should return 404 for non-existent card', async () => {
      await request(app.getHttpServer())
        .get('/cards/00000000-0000-0000-0000-000000000000/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('DELETE /comments/:commentId - Delete Comment', () => {
    let testCommentId: string;

    beforeEach(async () => {
      // Create a comment to delete
      const response = await request(app.getHttpServer())
        .post(`/cards/${cardId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Comment to be deleted',
        })
        .expect(201);

      testCommentId = response.body.id;
    });

    it('should delete own comment', async () => {
      await request(app.getHttpServer())
        .delete(`/comments/${testCommentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Verify comment is deleted
      const response = await request(app.getHttpServer())
        .get(`/cards/${cardId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const deletedComment = response.body.find(
        (c: any) => c.id === testCommentId,
      );
      expect(deletedComment).toBeUndefined();
    });

    it('should prevent non-author from deleting comment', async () => {
      // Create another user
      const otherUserResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'other-deleter@example.com',
          password: 'password123',
          name: 'Other Deleter',
        })
        .expect(201);

      const otherToken = otherUserResponse.body.accessToken;

      // Add other user to board
      await request(app.getHttpServer())
        .post(`/boards/${boardId}/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId: otherUserResponse.body.user.id,
          role: 'member',
        })
        .expect(201);

      // Try to delete comment authored by original user
      await request(app.getHttpServer())
        .delete(`/comments/${testCommentId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);
    });

    it('should allow board admin to delete any comment', async () => {
      // Create another user as board admin
      const adminResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'admin@example.com',
          password: 'password123',
          name: 'Admin',
        })
        .expect(201);

      const adminToken = adminResponse.body.accessToken;

      // Add admin to board
      await request(app.getHttpServer())
        .post(`/boards/${boardId}/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId: adminResponse.body.user.id,
          role: 'admin',
        })
        .expect(201);

      // Admin can delete any comment
      await request(app.getHttpServer())
        .delete(`/comments/${testCommentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .delete(`/comments/${testCommentId}`)
        .expect(401);
    });

    it('should return 404 for non-existent comment', async () => {
      await request(app.getHttpServer())
        .delete('/comments/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should be idempotent - deleting twice returns 404', async () => {
      // First delete
      await request(app.getHttpServer())
        .delete(`/comments/${testCommentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Second delete
      await request(app.getHttpServer())
        .delete(`/comments/${testCommentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PUT /comments/:commentId - Update Comment (Optional)', () => {
    let testCommentId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post(`/cards/${cardId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Original comment content',
        })
        .expect(201);

      testCommentId = response.body.id;
    });

    it('should update own comment content', async () => {
      const response = await request(app.getHttpServer())
        .put(`/comments/${testCommentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Updated comment content',
        })
        .expect(200);

      expect(response.body.content).toBe('Updated comment content');
      expect(response.body.isEdited).toBe(true);
      expect(new Date(response.body.updatedAt).getTime()).toBeGreaterThan(
        new Date(response.body.createdAt).getTime(),
      );
    });

    it('should prevent non-author from editing comment', async () => {
      // Create another user
      const otherUserResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'editor@example.com',
          password: 'password123',
          name: 'Editor',
        })
        .expect(201);

      const otherToken = otherUserResponse.body.accessToken;

      // Add other user to board
      await request(app.getHttpServer())
        .post(`/boards/${boardId}/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId: otherUserResponse.body.user.id,
          role: 'member',
        })
        .expect(201);

      await request(app.getHttpServer())
        .put(`/comments/${testCommentId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          content: 'Unauthorized edit',
        })
        .expect(403);
    });

    it('should validate updated content', async () => {
      await request(app.getHttpServer())
        .put(`/comments/${testCommentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: '',
        })
        .expect(400);
    });
  });

  describe('Real-time Comment Events (WebSocket)', () => {
    it('should emit comment:added event when comment created', async () => {
      // TODO: This will need WebSocket test client
      // For now, just verify the comment is created (WebSocket tested separately)
      const response = await request(app.getHttpServer())
        .post(`/cards/${cardId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Real-time comment',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      // WebSocket event should be emitted: card:comment:added
    });
  });
});
