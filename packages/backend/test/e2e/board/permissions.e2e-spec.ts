/**
 * T173 [US4] Board Permission Enforcement E2E Tests
 * User Story 4: Team Organization and Access Control
 *
 * Tests board-level permission enforcement:
 * - Board admins can create/edit/delete boards
 * - Board members can create/edit lists and cards
 * - Board guests can only read (cannot edit)
 * - Non-members cannot access board at all
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../../src/app.module';
import { DataSource } from 'typeorm';

describe('Board Permission Enforcement (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let ownerToken: string;
  let ownerId: string;
  let adminToken: string;
  let adminId: string;
  let memberToken: string;
  let memberId: string;
  let guestToken: string;
  let guestId: string;
  let outsiderToken: string;
  let outsiderId: string;
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
    // Clean database before each test
    const entities = dataSource.entityMetadatas;
    for (const entity of entities) {
      const repository = dataSource.getRepository(entity.name);
      await repository.clear();
    }

    // Create users with different roles
    const ownerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'owner@example.com',
        password: 'Password123!',
        name: 'Board Owner',
      })
      .expect(201);
    ownerToken = ownerResponse.body.accessToken;
    ownerId = ownerResponse.body.user.id;

    const adminResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'admin@example.com',
        password: 'Password123!',
        name: 'Board Admin',
      })
      .expect(201);
    adminToken = adminResponse.body.accessToken;
    adminId = adminResponse.body.user.id;

    const memberResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'member@example.com',
        password: 'Password123!',
        name: 'Board Member',
      })
      .expect(201);
    memberToken = memberResponse.body.accessToken;
    memberId = memberResponse.body.user.id;

    const guestResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'guest@example.com',
        password: 'Password123!',
        name: 'Board Guest',
      })
      .expect(201);
    guestToken = guestResponse.body.accessToken;
    guestId = guestResponse.body.user.id;

    const outsiderResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'outsider@example.com',
        password: 'Password123!',
        name: 'Outsider',
      })
      .expect(201);
    outsiderToken = outsiderResponse.body.accessToken;
    outsiderId = outsiderResponse.body.user.id;

    // Create organization
    const orgResponse = await request(app.getHttpServer())
      .post('/organizations')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Test Organization',
      })
      .expect(201);
    organizationId = orgResponse.body.id;

    // Create board
    const boardResponse = await request(app.getHttpServer())
      .post('/boards')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        organizationId,
        name: 'Test Board',
      })
      .expect(201);
    boardId = boardResponse.body.id;

    // Add board members with different roles
    await request(app.getHttpServer())
      .post(`/boards/${boardId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        userId: adminId,
        role: 'ADMIN',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/boards/${boardId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        userId: memberId,
        role: 'MEMBER',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/boards/${boardId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        userId: guestId,
        role: 'GUEST',
      })
      .expect(201);

    // Create a list and card for testing
    const listResponse = await request(app.getHttpServer())
      .post(`/boards/${boardId}/lists`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Test List',
      })
      .expect(201);
    listId = listResponse.body.id;

    const cardResponse = await request(app.getHttpServer())
      .post(`/lists/${listId}/cards`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        title: 'Test Card',
      })
      .expect(201);
    cardId = cardResponse.body.id;
  });

  describe('Board Access Permissions', () => {
    it('should allow admin to view board', async () => {
      await request(app.getHttpServer())
        .get(`/boards/${boardId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should allow member to view board', async () => {
      await request(app.getHttpServer())
        .get(`/boards/${boardId}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);
    });

    it('should allow guest to view board', async () => {
      await request(app.getHttpServer())
        .get(`/boards/${boardId}`)
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200);
    });

    it('should deny outsider from viewing board', async () => {
      await request(app.getHttpServer())
        .get(`/boards/${boardId}`)
        .set('Authorization', `Bearer ${outsiderToken}`)
        .expect(403);
    });
  });

  describe('Board Edit Permissions', () => {
    it('should allow admin to edit board', async () => {
      await request(app.getHttpServer())
        .put(`/boards/${boardId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Board Name',
        })
        .expect(200);
    });

    it('should deny member from editing board', async () => {
      await request(app.getHttpServer())
        .put(`/boards/${boardId}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          name: 'Hacked Board Name',
        })
        .expect(403);
    });

    it('should deny guest from editing board', async () => {
      await request(app.getHttpServer())
        .put(`/boards/${boardId}`)
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          name: 'Hacked Board Name',
        })
        .expect(403);
    });

    it('should deny outsider from editing board', async () => {
      await request(app.getHttpServer())
        .put(`/boards/${boardId}`)
        .set('Authorization', `Bearer ${outsiderToken}`)
        .send({
          name: 'Hacked Board Name',
        })
        .expect(403);
    });
  });

  describe('Board Delete Permissions', () => {
    it('should allow admin to delete board', async () => {
      await request(app.getHttpServer())
        .delete(`/boards/${boardId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should deny member from deleting board', async () => {
      await request(app.getHttpServer())
        .delete(`/boards/${boardId}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(403);
    });

    it('should deny guest from deleting board', async () => {
      await request(app.getHttpServer())
        .delete(`/boards/${boardId}`)
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(403);
    });
  });

  describe('List Creation Permissions', () => {
    it('should allow admin to create list', async () => {
      await request(app.getHttpServer())
        .post(`/boards/${boardId}/lists`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'New List',
        })
        .expect(201);
    });

    it('should allow member to create list', async () => {
      await request(app.getHttpServer())
        .post(`/boards/${boardId}/lists`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          name: 'New List',
        })
        .expect(201);
    });

    it('should deny guest from creating list', async () => {
      await request(app.getHttpServer())
        .post(`/boards/${boardId}/lists`)
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          name: 'New List',
        })
        .expect(403);
    });

    it('should deny outsider from creating list', async () => {
      await request(app.getHttpServer())
        .post(`/boards/${boardId}/lists`)
        .set('Authorization', `Bearer ${outsiderToken}`)
        .send({
          name: 'New List',
        })
        .expect(403);
    });
  });

  describe('List Edit Permissions', () => {
    it('should allow admin to edit list', async () => {
      await request(app.getHttpServer())
        .put(`/lists/${listId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated List',
        })
        .expect(200);
    });

    it('should allow member to edit list', async () => {
      await request(app.getHttpServer())
        .put(`/lists/${listId}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          name: 'Updated List',
        })
        .expect(200);
    });

    it('should deny guest from editing list', async () => {
      await request(app.getHttpServer())
        .put(`/lists/${listId}`)
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          name: 'Hacked List',
        })
        .expect(403);
    });
  });

  describe('Card Creation Permissions', () => {
    it('should allow admin to create card', async () => {
      await request(app.getHttpServer())
        .post(`/lists/${listId}/cards`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'New Card',
        })
        .expect(201);
    });

    it('should allow member to create card', async () => {
      await request(app.getHttpServer())
        .post(`/lists/${listId}/cards`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          title: 'New Card',
        })
        .expect(201);
    });

    it('should deny guest from creating card', async () => {
      await request(app.getHttpServer())
        .post(`/lists/${listId}/cards`)
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          title: 'New Card',
        })
        .expect(403);
    });

    it('should deny outsider from creating card', async () => {
      await request(app.getHttpServer())
        .post(`/lists/${listId}/cards`)
        .set('Authorization', `Bearer ${outsiderToken}`)
        .send({
          title: 'New Card',
        })
        .expect(403);
    });
  });

  describe('Card Edit Permissions', () => {
    it('should allow admin to edit card', async () => {
      await request(app.getHttpServer())
        .put(`/cards/${cardId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Updated Card',
        })
        .expect(200);
    });

    it('should allow member to edit card', async () => {
      await request(app.getHttpServer())
        .put(`/cards/${cardId}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          title: 'Updated Card',
        })
        .expect(200);
    });

    it('should deny guest from editing card', async () => {
      await request(app.getHttpServer())
        .put(`/cards/${cardId}`)
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          title: 'Hacked Card',
        })
        .expect(403);
    });
  });

  describe('Card Move Permissions', () => {
    let secondListId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post(`/boards/${boardId}/lists`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Second List',
        })
        .expect(201);
      secondListId = response.body.id;
    });

    it('should allow admin to move card', async () => {
      await request(app.getHttpServer())
        .put(`/cards/${cardId}/move`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          listId: secondListId,
          position: 0,
        })
        .expect(200);
    });

    it('should allow member to move card', async () => {
      await request(app.getHttpServer())
        .put(`/cards/${cardId}/move`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          listId: secondListId,
          position: 0,
        })
        .expect(200);
    });

    it('should deny guest from moving card', async () => {
      await request(app.getHttpServer())
        .put(`/cards/${cardId}/move`)
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          listId: secondListId,
          position: 0,
        })
        .expect(403);
    });
  });

  describe('Comment Permissions', () => {
    it('should allow guest to view comments', async () => {
      const response = await request(app.getHttpServer())
        .get(`/cards/${cardId}/comments`)
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should allow member to add comment', async () => {
      await request(app.getHttpServer())
        .post(`/cards/${cardId}/comments`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          content: 'Test comment',
        })
        .expect(201);
    });

    it('should deny guest from adding comment', async () => {
      await request(app.getHttpServer())
        .post(`/cards/${cardId}/comments`)
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          content: 'Test comment',
        })
        .expect(403);
    });
  });

  describe('Label Permissions', () => {
    let labelId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post(`/boards/${boardId}/labels`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Test Label',
          color: '#ff0000',
        })
        .expect(201);
      labelId = response.body.id;
    });

    it('should allow member to apply label to card', async () => {
      await request(app.getHttpServer())
        .post(`/cards/${cardId}/labels/${labelId}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(201);
    });

    it('should deny guest from applying label to card', async () => {
      await request(app.getHttpServer())
        .post(`/cards/${cardId}/labels/${labelId}`)
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(403);
    });
  });

  describe('Attachment Permissions', () => {
    it('should allow member to upload attachment', async () => {
      await request(app.getHttpServer())
        .post(`/cards/${cardId}/attachments`)
        .set('Authorization', `Bearer ${memberToken}`)
        .attach('file', Buffer.from('test content'), 'test.txt')
        .expect(201);
    });

    it('should deny guest from uploading attachment', async () => {
      await request(app.getHttpServer())
        .post(`/cards/${cardId}/attachments`)
        .set('Authorization', `Bearer ${guestToken}`)
        .attach('file', Buffer.from('test content'), 'test.txt')
        .expect(403);
    });

    it('should allow guest to view attachments', async () => {
      // First create attachment as member
      const response = await request(app.getHttpServer())
        .post(`/cards/${cardId}/attachments`)
        .set('Authorization', `Bearer ${memberToken}`)
        .attach('file', Buffer.from('test content'), 'test.txt')
        .expect(201);

      const attachmentId = response.body.id;

      // Guest should be able to download
      await request(app.getHttpServer())
        .get(`/attachments/${attachmentId}/download`)
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200);
    });
  });
});
