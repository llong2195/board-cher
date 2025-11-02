import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../../src/app.module';
import { DataSource } from 'typeorm';

describe('Board CRUD (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let accessToken: string;
  let userId: string;
  let organizationId: string;

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
    // Register a test user
    const registerResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'test@example.com',
        password: 'SecurePass123',
        name: 'Test User',
      })
      .expect(201);

    accessToken = registerResponse.body.accessToken;
    userId = registerResponse.body.user.id;

    // Create a test organization
    const orgResponse = await request(app.getHttpServer())
      .post('/api/v1/organizations')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Test Organization',
        description: 'Test org description',
      })
      .expect(201);

    organizationId = orgResponse.body.id;
  });

  describe('POST /api/v1/boards', () => {
    it('should create a new board with valid data', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/boards')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          organizationId,
          name: 'Marketing Campaign',
          description: 'Q1 marketing tasks',
          color: '#3b82f6',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        organizationId,
        name: 'Marketing Campaign',
        description: 'Q1 marketing tasks',
        color: '#3b82f6',
        isArchived: false,
        createdBy: userId,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('should create board without optional fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/boards')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          organizationId,
          name: 'Simple Board',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        name: 'Simple Board',
        description: null,
        color: null,
      });
    });

    it('should reject board creation without authentication', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/boards')
        .send({
          organizationId,
          name: 'Unauthorized Board',
        })
        .expect(401);
    });

    it('should reject board with invalid organization ID', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/boards')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          organizationId: '00000000-0000-0000-0000-000000000000',
          name: 'Invalid Org Board',
        })
        .expect(404);
    });

    it('should reject board with empty name', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/boards')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          organizationId,
          name: '',
        })
        .expect(400);
    });

    it('should reject board with name exceeding 200 characters', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/boards')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          organizationId,
          name: 'a'.repeat(201),
        })
        .expect(400);
    });

    it('should reject board with invalid color format', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/boards')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          organizationId,
          name: 'Bad Color Board',
          color: 'not-a-hex-color',
        })
        .expect(400);
    });
  });

  describe('GET /api/v1/boards', () => {
    let board1Id: string;
    let board2Id: string;

    beforeEach(async () => {
      // Create multiple boards for testing
      const board1Response = await request(app.getHttpServer())
        .post('/api/v1/boards')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          organizationId,
          name: 'Board 1',
        });
      board1Id = board1Response.body.id;

      const board2Response = await request(app.getHttpServer())
        .post('/api/v1/boards')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          organizationId,
          name: 'Board 2',
        });
      board2Id = board2Response.body.id;
    });

    it('should list all boards for authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/boards')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: board1Id, name: 'Board 1' }),
          expect.objectContaining({ id: board2Id, name: 'Board 2' }),
        ]),
      );
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/boards?page=1&limit=1')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body).toMatchObject({
        meta: {
          page: 1,
          limit: 1,
          total: 2,
        },
      });
    });

    it('should filter out archived boards by default', async () => {
      // Archive board1
      await request(app.getHttpServer())
        .delete(`/api/v1/boards/${board1Id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const response = await request(app.getHttpServer())
        .get('/api/v1/boards')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].id).toBe(board2Id);
    });

    it('should reject request without authentication', async () => {
      await request(app.getHttpServer()).get('/api/v1/boards').expect(401);
    });
  });

  describe('GET /api/v1/boards/:id', () => {
    let boardId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/boards')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          organizationId,
          name: 'Test Board',
          description: 'Test description',
        });
      boardId = response.body.id;
    });

    it('should get board by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/boards/${boardId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: boardId,
        name: 'Test Board',
        description: 'Test description',
        organizationId,
      });
    });

    it('should include lists in board response', async () => {
      // Create a list
      await request(app.getHttpServer())
        .post(`/api/v1/boards/${boardId}/lists`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'To Do' });

      const response = await request(app.getHttpServer())
        .get(`/api/v1/boards/${boardId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('lists');
      expect(response.body.lists).toHaveLength(1);
    });

    it('should return 404 for non-existent board', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/boards/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should return 403 when user lacks access to board', async () => {
      // Register second user
      const user2Response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'user2@example.com',
          password: 'SecurePass123',
          name: 'User Two',
        });

      const user2Token = user2Response.body.accessToken;

      // User2 tries to access user1's board
      await request(app.getHttpServer())
        .get(`/api/v1/boards/${boardId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(403);
    });

    it('should reject request without authentication', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/boards/${boardId}`)
        .expect(401);
    });
  });

  describe('PUT /api/v1/boards/:id', () => {
    let boardId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/boards')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          organizationId,
          name: 'Original Name',
          description: 'Original description',
        });
      boardId = response.body.id;
    });

    it('should update board name', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/v1/boards/${boardId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Updated Name',
        })
        .expect(200);

      expect(response.body).toMatchObject({
        id: boardId,
        name: 'Updated Name',
        description: 'Original description', // unchanged
      });
    });

    it('should update multiple fields', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/v1/boards/${boardId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'New Name',
          description: 'New description',
          color: '#ef4444',
        })
        .expect(200);

      expect(response.body).toMatchObject({
        name: 'New Name',
        description: 'New description',
        color: '#ef4444',
      });
    });

    it('should reject update with empty name', async () => {
      await request(app.getHttpServer())
        .put(`/api/v1/boards/${boardId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: '',
        })
        .expect(400);
    });

    it('should reject update without authentication', async () => {
      await request(app.getHttpServer())
        .put(`/api/v1/boards/${boardId}`)
        .send({
          name: 'Unauthorized Update',
        })
        .expect(401);
    });

    it('should reject update from user without permission', async () => {
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
        .put(`/api/v1/boards/${boardId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          name: 'Forbidden Update',
        })
        .expect(403);
    });

    it('should return 404 for non-existent board', async () => {
      await request(app.getHttpServer())
        .put('/api/v1/boards/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Updated',
        })
        .expect(404);
    });
  });

  describe('DELETE /api/v1/boards/:id', () => {
    let boardId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/boards')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          organizationId,
          name: 'Board to Delete',
        });
      boardId = response.body.id;
    });

    it('should archive board (soft delete)', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/boards/${boardId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Verify board is archived
      const response = await request(app.getHttpServer())
        .get(`/api/v1/boards/${boardId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.isArchived).toBe(true);
    });

    it('should remove archived board from default list', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/boards/${boardId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const response = await request(app.getHttpServer())
        .get('/api/v1/boards')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(0);
    });

    it('should reject delete without authentication', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/boards/${boardId}`)
        .expect(401);
    });

    it('should reject delete from user without permission', async () => {
      // Register second user (guest)
      const user2Response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'guest@example.com',
          password: 'SecurePass123',
          name: 'Guest User',
        });

      const guestToken = user2Response.body.accessToken;

      await request(app.getHttpServer())
        .delete(`/api/v1/boards/${boardId}`)
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(403);
    });

    it('should return 404 for non-existent board', async () => {
      await request(app.getHttpServer())
        .delete('/api/v1/boards/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });
});
