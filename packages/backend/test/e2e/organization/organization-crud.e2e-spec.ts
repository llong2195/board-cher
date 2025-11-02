/**
 * T171 [US4] Organization CRUD API E2E Tests
 * User Story 4: Team Organization and Access Control
 *
 * Tests all organization CRUD operations:
 * - POST /organizations - Create organization
 * - GET /organizations - List user's organizations
 * - GET /organizations/:id - Get organization details
 * - PUT /organizations/:id - Update organization
 * - DELETE /organizations/:id - Delete organization
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { DataSource } from 'typeorm';
import { App } from 'supertest/types';

describe('Organization CRUD API (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let authToken: string;
  let userId: string;
  let organizationId: string;

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

    // Create test user and login
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User',
      })
      .expect(201);

    authToken = registerResponse.body.accessToken;
    userId = registerResponse.body.user.id;
  });

  describe('POST /organizations', () => {
    it('should create a new organization', async () => {
      const response = await request(app.getHttpServer())
        .post('/organizations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Acme Corporation',
          description: 'A test organization',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        name: 'Acme Corporation',
        description: 'A test organization',
      });
      expect(response.body.id).toBeDefined();
      expect(response.body.createdAt).toBeDefined();

      organizationId = response.body.id;
    });

    it('should automatically assign creator as OWNER', async () => {
      const response = await request(app.getHttpServer())
        .post('/organizations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Org',
        })
        .expect(201);

      const orgId = response.body.id;

      // Get organization members
      const membersResponse = await request(app.getHttpServer())
        .get(`/organizations/${orgId}/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(membersResponse.body).toHaveLength(1);
      expect(membersResponse.body[0]).toMatchObject({
        userId,
        role: 'OWNER',
      });
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .post('/organizations')
        .send({
          name: 'Test Org',
        })
        .expect(401);
    });

    it('should fail with invalid data', async () => {
      await request(app.getHttpServer())
        .post('/organizations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '', // Empty name
        })
        .expect(400);
    });
  });

  describe('GET /organizations', () => {
    beforeEach(async () => {
      // Create test organization
      const response = await request(app.getHttpServer())
        .post('/organizations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Organization',
        })
        .expect(201);

      organizationId = response.body.id;
    });

    it('should list user organizations', async () => {
      const response = await request(app.getHttpServer())
        .get('/organizations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        id: organizationId,
        name: 'Test Organization',
      });
    });

    it('should return empty array for user with no organizations', async () => {
      // Create new user
      const newUserResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'Password123!',
          name: 'New User',
        })
        .expect(201);

      const newUserToken = newUserResponse.body.accessToken;

      const response = await request(app.getHttpServer())
        .get('/organizations')
        .set('Authorization', `Bearer ${newUserToken}`)
        .expect(200);

      expect(response.body).toHaveLength(0);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer()).get('/organizations').expect(401);
    });
  });

  describe('GET /organizations/:id', () => {
    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/organizations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Organization',
        })
        .expect(201);

      organizationId = response.body.id;
    });

    it('should get organization details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/organizations/${organizationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: organizationId,
        name: 'Test Organization',
      });
      expect(response.body.members).toBeDefined();
    });

    it('should fail for non-member', async () => {
      // Create new user
      const newUserResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'outsider@example.com',
          password: 'Password123!',
          name: 'Outsider',
        })
        .expect(201);

      const outsiderToken = newUserResponse.body.accessToken;

      await request(app.getHttpServer())
        .get(`/organizations/${organizationId}`)
        .set('Authorization', `Bearer ${outsiderToken}`)
        .expect(403);
    });

    it('should return 404 for non-existent organization', async () => {
      await request(app.getHttpServer())
        .get('/organizations/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PUT /organizations/:id', () => {
    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/organizations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Organization',
        })
        .expect(201);

      organizationId = response.body.id;
    });

    it('should update organization as owner', async () => {
      const response = await request(app.getHttpServer())
        .put(`/organizations/${organizationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Organization',
          description: 'Updated description',
        })
        .expect(200);

      expect(response.body).toMatchObject({
        id: organizationId,
        name: 'Updated Organization',
        description: 'Updated description',
      });
    });

    it('should fail for non-member', async () => {
      const newUserResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'outsider@example.com',
          password: 'Password123!',
          name: 'Outsider',
        })
        .expect(201);

      await request(app.getHttpServer())
        .put(`/organizations/${organizationId}`)
        .set('Authorization', `Bearer ${newUserResponse.body.accessToken}`)
        .send({
          name: 'Hacked Name',
        })
        .expect(403);
    });
  });

  describe('DELETE /organizations/:id', () => {
    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/organizations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Organization',
        })
        .expect(201);

      organizationId = response.body.id;
    });

    it('should delete organization as owner', async () => {
      await request(app.getHttpServer())
        .delete(`/organizations/${organizationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify organization is deleted
      await request(app.getHttpServer())
        .get(`/organizations/${organizationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should fail for non-owner', async () => {
      // Add member (not owner)
      const memberResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'member@example.com',
          password: 'Password123!',
          name: 'Member User',
        })
        .expect(201);

      const memberId = memberResponse.body.user.id;
      const memberToken = memberResponse.body.accessToken;

      // Invite as MEMBER
      await request(app.getHttpServer())
        .post(`/organizations/${organizationId}/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId: memberId,
          role: 'MEMBER',
        })
        .expect(201);

      // Try to delete as member
      await request(app.getHttpServer())
        .delete(`/organizations/${organizationId}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(403);
    });
  });
});
