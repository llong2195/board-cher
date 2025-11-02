/**
 * T201 [US6] Card Assignment API E2E Tests
 * User Story 6: Card Assignment and Notifications
 *
 * Tests card assignment operations:
 * - POST /cards/:id/assignments/:userId - Assign user to card
 * - DELETE /cards/:id/assignments/:userId - Unassign user from card
 * - GET /cards/:id - Include assignees in card details
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../../src/app.module';
import { DataSource } from 'typeorm';

describe('Card Assignment API (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let userToken: string;
  let userId: string;
  let assigneeToken: string;
  let assigneeId: string;
  let organizationId: string;
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
    dataSource = moduleFixture.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    await dataSource.dropDatabase();
    await app.close();
  });

  beforeEach(async () => {
    // Clean database
    const entities = dataSource.entityMetadatas;
    for (const entity of entities) {
      const repository = dataSource.getRepository(entity.name);
      await repository.clear();
    }

    // Create owner user
    const ownerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'owner@example.com',
        password: 'Password123!',
        name: 'Card Owner',
      })
      .expect(201);

    userToken = ownerResponse.body.accessToken;
    userId = ownerResponse.body.user.id;

    // Create assignee user
    const assigneeResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'assignee@example.com',
        password: 'Password123!',
        name: 'Assignee User',
      })
      .expect(201);

    assigneeToken = assigneeResponse.body.accessToken;
    assigneeId = assigneeResponse.body.user.id;

    // Create organization
    const orgResponse = await request(app.getHttpServer())
      .post('/organizations')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Test Organization',
      })
      .expect(201);

    organizationId = orgResponse.body.id;

    // Create board
    const boardResponse = await request(app.getHttpServer())
      .post('/boards')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        organizationId,
        name: 'Test Board',
      })
      .expect(201);

    boardId = boardResponse.body.id;

    // Add assignee to board as member
    await request(app.getHttpServer())
      .post(`/boards/${boardId}/members`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        userId: assigneeId,
        role: 'MEMBER',
      })
      .expect(201);

    // Create list
    const listResponse = await request(app.getHttpServer())
      .post(`/boards/${boardId}/lists`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Test List',
      })
      .expect(201);

    listId = listResponse.body.id;

    // Create card
    const cardResponse = await request(app.getHttpServer())
      .post(`/lists/${listId}/cards`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Test Card for Assignment',
      })
      .expect(201);

    cardId = cardResponse.body.id;
  });

  describe('POST /cards/:id/assignments/:userId - Assign User', () => {
    it('should assign user to card', async () => {
      const response = await request(app.getHttpServer())
        .post(`/cards/${cardId}/assignments/${assigneeId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(201);

      expect(response.body).toMatchObject({
        cardId,
        userId: assigneeId,
      });
      expect(response.body.assignedAt).toBeDefined();
      expect(response.body.assignedBy).toBe(userId);
    });

    it('should allow self-assignment', async () => {
      const response = await request(app.getHttpServer())
        .post(`/cards/${cardId}/assignments/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(201);

      expect(response.body.userId).toBe(userId);
      expect(response.body.assignedBy).toBe(userId);
    });

    it('should allow board member to assign others', async () => {
      const response = await request(app.getHttpServer())
        .post(`/cards/${cardId}/assignments/${userId}`)
        .set('Authorization', `Bearer ${assigneeToken}`)
        .expect(201);

      expect(response.body.userId).toBe(userId);
      expect(response.body.assignedBy).toBe(assigneeId);
    });

    it('should fail if user already assigned', async () => {
      // First assignment
      await request(app.getHttpServer())
        .post(`/cards/${cardId}/assignments/${assigneeId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(201);

      // Duplicate assignment
      await request(app.getHttpServer())
        .post(`/cards/${cardId}/assignments/${assigneeId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(409); // Conflict
    });

    it('should fail if user not a board member', async () => {
      // Create outsider user
      const outsiderResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'outsider@example.com',
          password: 'Password123!',
          name: 'Outsider User',
        })
        .expect(201);

      const outsiderId = outsiderResponse.body.user.id;

      await request(app.getHttpServer())
        .post(`/cards/${cardId}/assignments/${outsiderId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403); // User not on board
    });

    it('should fail for guest role', async () => {
      // Create guest user
      const guestResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'guest@example.com',
          password: 'Password123!',
          name: 'Guest User',
        })
        .expect(201);

      const guestId = guestResponse.body.user.id;
      const guestToken = guestResponse.body.accessToken;

      // Add as guest to board
      await request(app.getHttpServer())
        .post(`/boards/${boardId}/members`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          userId: guestId,
          role: 'GUEST',
        })
        .expect(201);

      // Guest tries to assign
      await request(app.getHttpServer())
        .post(`/cards/${cardId}/assignments/${assigneeId}`)
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(403);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .post(`/cards/${cardId}/assignments/${assigneeId}`)
        .expect(401);
    });

    it('should fail for non-existent card', async () => {
      await request(app.getHttpServer())
        .post(
          '/cards/00000000-0000-0000-0000-000000000000/assignments/' +
            assigneeId,
        )
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });

    it('should fail for non-existent user', async () => {
      await request(app.getHttpServer())
        .post(
          `/cards/${cardId}/assignments/00000000-0000-0000-0000-000000000000`,
        )
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });
  });

  describe('DELETE /cards/:id/assignments/:userId - Unassign User', () => {
    beforeEach(async () => {
      // Assign user first
      await request(app.getHttpServer())
        .post(`/cards/${cardId}/assignments/${assigneeId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(201);
    });

    it('should unassign user from card', async () => {
      await request(app.getHttpServer())
        .delete(`/cards/${cardId}/assignments/${assigneeId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Verify assignment removed
      const cardResponse = await request(app.getHttpServer())
        .get(`/cards/${cardId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(cardResponse.body.assignees).toHaveLength(0);
    });

    it('should allow self-unassignment', async () => {
      await request(app.getHttpServer())
        .delete(`/cards/${cardId}/assignments/${assigneeId}`)
        .set('Authorization', `Bearer ${assigneeToken}`)
        .expect(200);
    });

    it('should allow board member to unassign others', async () => {
      await request(app.getHttpServer())
        .delete(`/cards/${cardId}/assignments/${assigneeId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
    });

    it('should fail if assignment does not exist', async () => {
      // Unassign once
      await request(app.getHttpServer())
        .delete(`/cards/${cardId}/assignments/${assigneeId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Try again
      await request(app.getHttpServer())
        .delete(`/cards/${cardId}/assignments/${assigneeId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });

    it('should fail for guest role', async () => {
      // Create guest user
      const guestResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'guest@example.com',
          password: 'Password123!',
          name: 'Guest User',
        })
        .expect(201);

      const guestToken = guestResponse.body.accessToken;
      const guestId = guestResponse.body.user.id;

      // Add as guest to board
      await request(app.getHttpServer())
        .post(`/boards/${boardId}/members`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          userId: guestId,
          role: 'GUEST',
        })
        .expect(201);

      // Guest tries to unassign
      await request(app.getHttpServer())
        .delete(`/cards/${cardId}/assignments/${assigneeId}`)
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(403);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .delete(`/cards/${cardId}/assignments/${assigneeId}`)
        .expect(401);
    });
  });

  describe('GET /cards/:id - Include Assignees', () => {
    it('should include empty assignees array when no assignments', async () => {
      const response = await request(app.getHttpServer())
        .get(`/cards/${cardId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.assignees).toEqual([]);
    });

    it('should include assignees with user details', async () => {
      // Assign users
      await request(app.getHttpServer())
        .post(`/cards/${cardId}/assignments/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(201);

      await request(app.getHttpServer())
        .post(`/cards/${cardId}/assignments/${assigneeId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(201);

      const response = await request(app.getHttpServer())
        .get(`/cards/${cardId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.assignees).toHaveLength(2);

      const assigneeUsers = response.body.assignees.map((a: any) => a.userId);
      expect(assigneeUsers).toContain(userId);
      expect(assigneeUsers).toContain(assigneeId);

      // Check user details are included
      const firstAssignee = response.body.assignees[0];
      expect(firstAssignee.user).toBeDefined();
      expect(firstAssignee.user.name).toBeDefined();
      expect(firstAssignee.user.email).toBeDefined();
    });

    it('should include assignment metadata', async () => {
      await request(app.getHttpServer())
        .post(`/cards/${cardId}/assignments/${assigneeId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(201);

      const response = await request(app.getHttpServer())
        .get(`/cards/${cardId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const assignment = response.body.assignees[0];
      expect(assignment.assignedAt).toBeDefined();
      expect(assignment.assignedBy).toBe(userId);
    });
  });

  describe('Multiple Assignments', () => {
    it('should support multiple users assigned to same card', async () => {
      // Create additional users
      const user2Response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'user2@example.com',
          password: 'Password123!',
          name: 'User 2',
        })
        .expect(201);

      const user2Id = user2Response.body.user.id;

      const user3Response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'user3@example.com',
          password: 'Password123!',
          name: 'User 3',
        })
        .expect(201);

      const user3Id = user3Response.body.user.id;

      // Add to board
      await request(app.getHttpServer())
        .post(`/boards/${boardId}/members`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ userId: user2Id, role: 'MEMBER' })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/boards/${boardId}/members`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ userId: user3Id, role: 'MEMBER' })
        .expect(201);

      // Assign all to card
      await request(app.getHttpServer())
        .post(`/cards/${cardId}/assignments/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(201);

      await request(app.getHttpServer())
        .post(`/cards/${cardId}/assignments/${assigneeId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(201);

      await request(app.getHttpServer())
        .post(`/cards/${cardId}/assignments/${user2Id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(201);

      await request(app.getHttpServer())
        .post(`/cards/${cardId}/assignments/${user3Id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(201);

      // Verify all assigned
      const response = await request(app.getHttpServer())
        .get(`/cards/${cardId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.assignees).toHaveLength(4);
    });
  });
});
