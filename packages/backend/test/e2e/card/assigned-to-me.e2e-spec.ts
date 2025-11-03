/**
 * T202 [US6] Assigned Cards Query API E2E Tests
 * User Story 6: Card Assignment and Notifications
 *
 * Tests "assigned to me" query functionality:
 * - GET /cards/assigned-to-me - Get all cards assigned to current user
 * - Supports pagination
 * - Filters across all boards user has access to
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../../src/app.module';
import { DataSource } from 'typeorm';

describe('Assigned Cards Query API (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let userToken: string;
  let userId: string;
  let user2Token: string;
  let user2Id: string;
  let organizationId: string;
  let boardId: string;
  let board2Id: string;
  let listId: string;
  let list2Id: string;

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

    // Create user 1
    const user1Response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'user1@example.com',
        password: 'Password123!',
        name: 'User One',
      })
      .expect(201);

    userToken = user1Response.body.accessToken;
    userId = user1Response.body.user.id;

    // Create user 2
    const user2Response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'user2@example.com',
        password: 'Password123!',
        name: 'User Two',
      })
      .expect(201);

    user2Token = user2Response.body.accessToken;
    user2Id = user2Response.body.user.id;

    // Create organization
    const orgResponse = await request(app.getHttpServer())
      .post('/organizations')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Test Organization',
      })
      .expect(201);

    organizationId = orgResponse.body.id;

    // Create board 1
    const board1Response = await request(app.getHttpServer())
      .post('/boards')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        organizationId,
        name: 'Board 1',
      })
      .expect(201);

    boardId = board1Response.body.id;

    // Create board 2
    const board2Response = await request(app.getHttpServer())
      .post('/boards')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        organizationId,
        name: 'Board 2',
      })
      .expect(201);

    board2Id = board2Response.body.id;

    // Add user2 to both boards
    await request(app.getHttpServer())
      .post(`/boards/${boardId}/members`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        userId: user2Id,
        role: 'MEMBER',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/boards/${board2Id}/members`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        userId: user2Id,
        role: 'MEMBER',
      })
      .expect(201);

    // Create lists
    const list1Response = await request(app.getHttpServer())
      .post(`/boards/${boardId}/lists`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'List 1',
      })
      .expect(201);

    listId = list1Response.body.id;

    const list2Response = await request(app.getHttpServer())
      .post(`/boards/${board2Id}/lists`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'List 2',
      })
      .expect(201);

    list2Id = list2Response.body.id;
  });

  describe('GET /cards/assigned-to-me', () => {
    it('should return empty array when no cards assigned', async () => {
      const response = await request(app.getHttpServer())
        .get('/cards/assigned-to-me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data).toEqual([]);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 50,
        total: 0,
      });
    });

    it('should return all cards assigned to user', async () => {
      // Create 3 cards on board 1
      const card1Response = await request(app.getHttpServer())
        .post(`/lists/${listId}/cards`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Card 1' })
        .expect(201);

      const card2Response = await request(app.getHttpServer())
        .post(`/lists/${listId}/cards`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Card 2' })
        .expect(201);

      // Create 2 cards on board 2
      const card3Response = await request(app.getHttpServer())
        .post(`/lists/${list2Id}/cards`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Card 3' })
        .expect(201);

      const card4Response = await request(app.getHttpServer())
        .post(`/lists/${list2Id}/cards`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Card 4 - Not Assigned' })
        .expect(201);

      // Assign user2 to cards 1, 2, 3 (not card 4)
      await request(app.getHttpServer())
        .post(`/cards/${card1Response.body.id}/assignments/${user2Id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(201);

      await request(app.getHttpServer())
        .post(`/cards/${card2Response.body.id}/assignments/${user2Id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(201);

      await request(app.getHttpServer())
        .post(`/cards/${card3Response.body.id}/assignments/${user2Id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(201);

      // Query as user2
      const response = await request(app.getHttpServer())
        .get('/cards/assigned-to-me')
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      expect(response.body.data).toHaveLength(3);
      expect(response.body.pagination.total).toBe(3);

      const cardTitles = response.body.data.map((c: any) => c.title);
      expect(cardTitles).toContain('Card 1');
      expect(cardTitles).toContain('Card 2');
      expect(cardTitles).toContain('Card 3');
      expect(cardTitles).not.toContain('Card 4 - Not Assigned');
    });

    it('should include card details with list and board info', async () => {
      // Create and assign a card
      const cardResponse = await request(app.getHttpServer())
        .post(`/lists/${listId}/cards`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Test Card',
          description: 'Card description',
        })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/cards/${cardResponse.body.id}/assignments/${user2Id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(201);

      // Query as user2
      const response = await request(app.getHttpServer())
        .get('/cards/assigned-to-me')
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);

      const card = response.body.data[0];
      expect(card).toMatchObject({
        id: cardResponse.body.id,
        title: 'Test Card',
        description: 'Card description',
        listId: listId,
      });

      // Should include list and board information
      expect(card.list).toBeDefined();
      expect(card.list.id).toBe(listId);
      expect(card.list.name).toBe('List 1');

      expect(card.list.board).toBeDefined();
      expect(card.list.board.id).toBe(boardId);
      expect(card.list.board.name).toBe('Board 1');
    });

    it('should support pagination with page and limit', async () => {
      // Create 10 cards and assign all to user2
      const cardIds = [];
      for (let i = 1; i <= 10; i++) {
        const cardResponse = await request(app.getHttpServer())
          .post(`/lists/${listId}/cards`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({ title: `Card ${i}` })
          .expect(201);

        cardIds.push(cardResponse.body.id);

        await request(app.getHttpServer())
          .post(`/cards/${cardResponse.body.id}/assignments/${user2Id}`)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(201);
      }

      // Get first page (5 items)
      const page1 = await request(app.getHttpServer())
        .get('/cards/assigned-to-me?page=1&limit=5')
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      expect(page1.body.data).toHaveLength(5);
      expect(page1.body.pagination).toMatchObject({
        page: 1,
        limit: 5,
        total: 10,
      });

      // Get second page (5 items)
      const page2 = await request(app.getHttpServer())
        .get('/cards/assigned-to-me?page=2&limit=5')
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      expect(page2.body.data).toHaveLength(5);
      expect(page2.body.pagination).toMatchObject({
        page: 2,
        limit: 5,
        total: 10,
      });

      // Verify no overlap
      const page1Ids = page1.body.data.map((c: any) => c.id);
      const page2Ids = page2.body.data.map((c: any) => c.id);
      const overlap = page1Ids.filter((id: string) => page2Ids.includes(id));
      expect(overlap).toHaveLength(0);
    });

    it('should respect default pagination limits', async () => {
      // Create many cards
      for (let i = 1; i <= 100; i++) {
        const cardResponse = await request(app.getHttpServer())
          .post(`/lists/${listId}/cards`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({ title: `Card ${i}` })
          .expect(201);

        await request(app.getHttpServer())
          .post(`/cards/${cardResponse.body.id}/assignments/${user2Id}`)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(201);
      }

      // Query without pagination params (should use defaults)
      const response = await request(app.getHttpServer())
        .get('/cards/assigned-to-me')
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(50); // Default limit
      expect(response.body.pagination.limit).toBe(50);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .get('/cards/assigned-to-me')
        .expect(401);
    });

    it('should only return cards from boards user has access to', async () => {
      // Create board 3 (user2 not added)
      const board3Response = await request(app.getHttpServer())
        .post('/boards')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          organizationId,
          name: 'Board 3 - Private',
        })
        .expect(201);

      const list3Response = await request(app.getHttpServer())
        .post(`/boards/${board3Response.body.id}/lists`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'List 3' })
        .expect(201);

      // Create card on private board
      const privateCardResponse = await request(app.getHttpServer())
        .post(`/lists/${list3Response.body.id}/cards`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Private Card' })
        .expect(201);

      // Assign user2 to private card (but they don't have board access)
      await request(app.getHttpServer())
        .post(`/cards/${privateCardResponse.body.id}/assignments/${user2Id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403); // Should fail - user2 not on board

      // Create accessible card
      const accessibleCardResponse = await request(app.getHttpServer())
        .post(`/lists/${listId}/cards`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Accessible Card' })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/cards/${accessibleCardResponse.body.id}/assignments/${user2Id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(201);

      // Query as user2
      const response = await request(app.getHttpServer())
        .get('/cards/assigned-to-me')
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      // Should only see accessible card
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Accessible Card');
    });

    it('should order cards by due date ascending (nearest first)', async () => {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Create cards with different due dates
      const card1Response = await request(app.getHttpServer())
        .post(`/lists/${listId}/cards`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Due Next Week',
          dueDate: nextWeek.toISOString(),
        })
        .expect(201);

      const card2Response = await request(app.getHttpServer())
        .post(`/lists/${listId}/cards`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Due Tomorrow',
          dueDate: tomorrow.toISOString(),
        })
        .expect(201);

      const card3Response = await request(app.getHttpServer())
        .post(`/lists/${listId}/cards`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'No Due Date',
        })
        .expect(201);

      // Assign all to user2
      await request(app.getHttpServer())
        .post(`/cards/${card1Response.body.id}/assignments/${user2Id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(201);

      await request(app.getHttpServer())
        .post(`/cards/${card2Response.body.id}/assignments/${user2Id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(201);

      await request(app.getHttpServer())
        .post(`/cards/${card3Response.body.id}/assignments/${user2Id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(201);

      // Query as user2
      const response = await request(app.getHttpServer())
        .get('/cards/assigned-to-me')
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      expect(response.body.data).toHaveLength(3);

      // Cards with due dates should come first, in ascending order
      expect(response.body.data[0].title).toBe('Due Tomorrow');
      expect(response.body.data[1].title).toBe('Due Next Week');
      expect(response.body.data[2].title).toBe('No Due Date');
    });
  });
});
