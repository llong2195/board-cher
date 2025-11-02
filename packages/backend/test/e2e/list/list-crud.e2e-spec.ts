import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../../src/app.module';
import { DataSource } from 'typeorm';

describe('List CRUD (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let accessToken: string;
  let boardId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    dataSource = moduleFixture.get(DataSource);
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  beforeEach(async () => {
    // Register user
    const registerResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'test@example.com',
        password: 'SecurePass123',
        name: 'Test User',
      });

    accessToken = registerResponse.body.accessToken;

    // Create organization
    const orgResponse = await request(app.getHttpServer())
      .post('/api/v1/organizations')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Test Organization',
      });

    // Create board
    const boardResponse = await request(app.getHttpServer())
      .post('/api/v1/boards')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        organizationId: orgResponse.body.id,
        name: 'Test Board',
      });

    boardId = boardResponse.body.id;
  });

  describe('POST /api/v1/boards/:id/lists', () => {
    it('should create a list in board', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/boards/${boardId}/lists`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'To Do',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        boardId,
        name: 'To Do',
        position: 0,
        isArchived: false,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('should auto-increment position for new lists', async () => {
      const list1Response = await request(app.getHttpServer())
        .post(`/api/v1/boards/${boardId}/lists`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'To Do' });

      expect(list1Response.body.position).toBe(0);

      const list2Response = await request(app.getHttpServer())
        .post(`/api/v1/boards/${boardId}/lists`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'In Progress' });

      expect(list2Response.body.position).toBe(1);

      const list3Response = await request(app.getHttpServer())
        .post(`/api/v1/boards/${boardId}/lists`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Done' });

      expect(list3Response.body.position).toBe(2);
    });

    it('should reject list with empty name', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/boards/${boardId}/lists`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: '',
        })
        .expect(400);
    });

    it('should reject list with name exceeding 100 characters', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/boards/${boardId}/lists`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'a'.repeat(101),
        })
        .expect(400);
    });

    it('should reject creation without authentication', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/boards/${boardId}/lists`)
        .send({
          name: 'Unauthorized List',
        })
        .expect(401);
    });

    it('should reject creation for non-existent board', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/boards/00000000-0000-0000-0000-000000000000/lists')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'List on Non-existent Board',
        })
        .expect(404);
    });

    it('should reject creation by user without board access', async () => {
      // Register second user
      const user2Response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'user2@example.com',
          password: 'SecurePass123',
          name: 'User Two',
        });

      const user2Token = user2Response.body.accessToken;

      await request(app.getHttpServer())
        .post(`/api/v1/boards/${boardId}/lists`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          name: 'Forbidden List',
        })
        .expect(403);
    });
  });

  describe('GET /api/v1/boards/:id/lists', () => {
    beforeEach(async () => {
      // Create multiple lists
      await request(app.getHttpServer())
        .post(`/api/v1/boards/${boardId}/lists`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'To Do' });

      await request(app.getHttpServer())
        .post(`/api/v1/boards/${boardId}/lists`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'In Progress' });

      await request(app.getHttpServer())
        .post(`/api/v1/boards/${boardId}/lists`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Done' });
    });

    it('should get all lists for a board', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/boards/${boardId}/lists`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveLength(3);
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'To Do', position: 0 }),
          expect.objectContaining({ name: 'In Progress', position: 1 }),
          expect.objectContaining({ name: 'Done', position: 2 }),
        ]),
      );
    });

    it('should return lists sorted by position', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/boards/${boardId}/lists`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body[0].name).toBe('To Do');
      expect(response.body[1].name).toBe('In Progress');
      expect(response.body[2].name).toBe('Done');
    });

    it('should exclude archived lists by default', async () => {
      // Get first list ID
      const listsResponse = await request(app.getHttpServer())
        .get(`/api/v1/boards/${boardId}/lists`)
        .set('Authorization', `Bearer ${accessToken}`);

      const listIdToArchive = listsResponse.body[0].id;

      // Archive the list
      await request(app.getHttpServer())
        .delete(`/api/v1/lists/${listIdToArchive}`)
        .set('Authorization', `Bearer ${accessToken}`);

      // Get lists again
      const response = await request(app.getHttpServer())
        .get(`/api/v1/boards/${boardId}/lists`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(
        response.body.find((list: any) => list.id === listIdToArchive),
      ).toBeUndefined();
    });

    it('should include cards in list response', async () => {
      const listsResponse = await request(app.getHttpServer())
        .get(`/api/v1/boards/${boardId}/lists`)
        .set('Authorization', `Bearer ${accessToken}`);

      const listId = listsResponse.body[0].id;

      // Create a card in the list
      await request(app.getHttpServer())
        .post(`/api/v1/lists/${listId}/cards`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Test Card' });

      const response = await request(app.getHttpServer())
        .get(`/api/v1/boards/${boardId}/lists`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const listWithCard = response.body.find(
        (list: any) => list.id === listId,
      );
      expect(listWithCard.cards).toHaveLength(1);
      expect(listWithCard.cards[0].title).toBe('Test Card');
    });

    it('should reject request without authentication', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/boards/${boardId}/lists`)
        .expect(401);
    });

    it('should return 404 for non-existent board', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/boards/00000000-0000-0000-0000-000000000000/lists')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/v1/lists/:id', () => {
    let listId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/boards/${boardId}/lists`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Original Name' });

      listId = response.body.id;
    });

    it('should update list name', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/v1/lists/${listId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Updated Name',
        })
        .expect(200);

      expect(response.body).toMatchObject({
        id: listId,
        name: 'Updated Name',
      });
    });

    it('should reject update with empty name', async () => {
      await request(app.getHttpServer())
        .put(`/api/v1/lists/${listId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: '',
        })
        .expect(400);
    });

    it('should reject update without authentication', async () => {
      await request(app.getHttpServer())
        .put(`/api/v1/lists/${listId}`)
        .send({
          name: 'Unauthorized Update',
        })
        .expect(401);
    });

    it('should return 404 for non-existent list', async () => {
      await request(app.getHttpServer())
        .put('/api/v1/lists/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Updated',
        })
        .expect(404);
    });
  });

  describe('PUT /api/v1/lists/:id/move', () => {
    let list1Id: string;
    let list2Id: string;
    let list3Id: string;

    beforeEach(async () => {
      const list1 = await request(app.getHttpServer())
        .post(`/api/v1/boards/${boardId}/lists`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'List 1' });
      list1Id = list1.body.id;

      const list2 = await request(app.getHttpServer())
        .post(`/api/v1/boards/${boardId}/lists`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'List 2' });
      list2Id = list2.body.id;

      const list3 = await request(app.getHttpServer())
        .post(`/api/v1/boards/${boardId}/lists`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'List 3' });
      list3Id = list3.body.id;
    });

    it('should move list to new position', async () => {
      // Move list 3 (position 2) to position 0
      await request(app.getHttpServer())
        .put(`/api/v1/lists/${list3Id}/move`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          position: 0,
        })
        .expect(200);

      // Verify new order
      const response = await request(app.getHttpServer())
        .get(`/api/v1/boards/${boardId}/lists`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.body[0].id).toBe(list3Id); // List 3 now first
      expect(response.body[1].id).toBe(list1Id); // List 1 now second
      expect(response.body[2].id).toBe(list2Id); // List 2 now third
    });

    it('should handle moving list forward', async () => {
      // Move list 1 (position 0) to position 2 (end)
      await request(app.getHttpServer())
        .put(`/api/v1/lists/${list1Id}/move`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          position: 2,
        })
        .expect(200);

      const response = await request(app.getHttpServer())
        .get(`/api/v1/boards/${boardId}/lists`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.body[0].id).toBe(list2Id);
      expect(response.body[1].id).toBe(list3Id);
      expect(response.body[2].id).toBe(list1Id);
    });

    it('should handle moving list backward', async () => {
      // Move list 3 (position 2) to position 1
      await request(app.getHttpServer())
        .put(`/api/v1/lists/${list3Id}/move`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          position: 1,
        })
        .expect(200);

      const response = await request(app.getHttpServer())
        .get(`/api/v1/boards/${boardId}/lists`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.body[0].id).toBe(list1Id);
      expect(response.body[1].id).toBe(list3Id);
      expect(response.body[2].id).toBe(list2Id);
    });

    it('should reject invalid position (negative)', async () => {
      await request(app.getHttpServer())
        .put(`/api/v1/lists/${list1Id}/move`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          position: -1,
        })
        .expect(400);
    });

    it('should reject position beyond list count', async () => {
      await request(app.getHttpServer())
        .put(`/api/v1/lists/${list1Id}/move`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          position: 10,
        })
        .expect(400);
    });

    it('should reject move without authentication', async () => {
      await request(app.getHttpServer())
        .put(`/api/v1/lists/${list1Id}/move`)
        .send({
          position: 1,
        })
        .expect(401);
    });
  });

  describe('DELETE /api/v1/lists/:id', () => {
    let listId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/boards/${boardId}/lists`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'List to Delete' });

      listId = response.body.id;
    });

    it('should archive list (soft delete)', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/lists/${listId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Verify list is archived but still exists
      const response = await request(app.getHttpServer())
        .get(`/api/v1/boards/${boardId}/lists?includeArchived=true`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const archivedList = response.body.find(
        (list: any) => list.id === listId,
      );
      expect(archivedList).toBeDefined();
      expect(archivedList.isArchived).toBe(true);
    });

    it('should reject deletion of list with unarchived cards', async () => {
      // Create a card in the list
      await request(app.getHttpServer())
        .post(`/api/v1/lists/${listId}/cards`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Test Card' });

      await request(app.getHttpServer())
        .delete(`/api/v1/lists/${listId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);
    });

    it('should allow deletion after archiving all cards', async () => {
      // Create and archive a card
      const cardResponse = await request(app.getHttpServer())
        .post(`/api/v1/lists/${listId}/cards`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Test Card' });

      await request(app.getHttpServer())
        .delete(`/api/v1/cards/${cardResponse.body.id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      // Now list deletion should succeed
      await request(app.getHttpServer())
        .delete(`/api/v1/lists/${listId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('should reject deletion without authentication', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/lists/${listId}`)
        .expect(401);
    });

    it('should return 404 for non-existent list', async () => {
      await request(app.getHttpServer())
        .delete('/api/v1/lists/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });
});
