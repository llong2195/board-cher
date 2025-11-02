/**
 * T172 [US4] Organization Member Management E2E Tests
 * User Story 4: Team Organization and Access Control
 *
 * Tests organization member operations:
 * - POST /organizations/:id/members - Invite member
 * - DELETE /organizations/:id/members/:userId - Remove member
 * - PUT /organizations/:id/members/:userId/role - Change member role
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../../src/app.module';
import { DataSource } from 'typeorm';

describe('Organization Member Management (e2e)', () => {
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

    // Create owner user
    const ownerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'owner@example.com',
        password: 'Password123!',
        name: 'Owner User',
      })
      .expect(201);

    ownerToken = ownerResponse.body.accessToken;
    ownerId = ownerResponse.body.user.id;

    // Create organization
    const orgResponse = await request(app.getHttpServer())
      .post('/organizations')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Test Organization',
        description: 'Test org for member management',
      })
      .expect(201);

    organizationId = orgResponse.body.id;

    // Create additional users for testing
    const adminResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'admin@example.com',
        password: 'Password123!',
        name: 'Admin User',
      })
      .expect(201);

    adminToken = adminResponse.body.accessToken;
    adminId = adminResponse.body.user.id;

    const memberResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'member@example.com',
        password: 'Password123!',
        name: 'Member User',
      })
      .expect(201);

    memberToken = memberResponse.body.accessToken;
    memberId = memberResponse.body.user.id;

    const guestResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'guest@example.com',
        password: 'Password123!',
        name: 'Guest User',
      })
      .expect(201);

    guestToken = guestResponse.body.accessToken;
    guestId = guestResponse.body.user.id;
  });

  describe('POST /organizations/:id/members - Invite Member', () => {
    it('should allow owner to invite member with ADMIN role', async () => {
      const response = await request(app.getHttpServer())
        .post(`/organizations/${organizationId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          userId: adminId,
          role: 'ADMIN',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        userId: adminId,
        role: 'ADMIN',
        organizationId,
      });
      expect(response.body.joinedAt).toBeDefined();
    });

    it('should allow owner to invite member with MEMBER role', async () => {
      const response = await request(app.getHttpServer())
        .post(`/organizations/${organizationId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          userId: memberId,
          role: 'MEMBER',
        })
        .expect(201);

      expect(response.body.role).toBe('MEMBER');
    });

    it('should allow admin to invite member', async () => {
      // First add admin
      await request(app.getHttpServer())
        .post(`/organizations/${organizationId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          userId: adminId,
          role: 'ADMIN',
        })
        .expect(201);

      // Admin invites member
      const response = await request(app.getHttpServer())
        .post(`/organizations/${organizationId}/members`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: memberId,
          role: 'MEMBER',
        })
        .expect(201);

      expect(response.body.userId).toBe(memberId);
    });

    it('should fail if MEMBER tries to invite', async () => {
      // Add member first
      await request(app.getHttpServer())
        .post(`/organizations/${organizationId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          userId: memberId,
          role: 'MEMBER',
        })
        .expect(201);

      // Member tries to invite guest
      await request(app.getHttpServer())
        .post(`/organizations/${organizationId}/members`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          userId: guestId,
          role: 'MEMBER',
        })
        .expect(403);
    });

    it('should fail if user is already a member', async () => {
      // Add member
      await request(app.getHttpServer())
        .post(`/organizations/${organizationId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          userId: memberId,
          role: 'MEMBER',
        })
        .expect(201);

      // Try to add same member again
      await request(app.getHttpServer())
        .post(`/organizations/${organizationId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          userId: memberId,
          role: 'MEMBER',
        })
        .expect(409); // Conflict
    });

    it('should fail with invalid role', async () => {
      await request(app.getHttpServer())
        .post(`/organizations/${organizationId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          userId: memberId,
          role: 'INVALID_ROLE',
        })
        .expect(400);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .post(`/organizations/${organizationId}/members`)
        .send({
          userId: memberId,
          role: 'MEMBER',
        })
        .expect(401);
    });

    it('should fail for non-existent user', async () => {
      await request(app.getHttpServer())
        .post(`/organizations/${organizationId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          userId: '00000000-0000-0000-0000-000000000000',
          role: 'MEMBER',
        })
        .expect(404);
    });
  });

  describe('DELETE /organizations/:id/members/:userId - Remove Member', () => {
    beforeEach(async () => {
      // Add admin and member for each test
      await request(app.getHttpServer())
        .post(`/organizations/${organizationId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          userId: adminId,
          role: 'ADMIN',
        })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/organizations/${organizationId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          userId: memberId,
          role: 'MEMBER',
        })
        .expect(201);
    });

    it('should allow owner to remove member', async () => {
      await request(app.getHttpServer())
        .delete(`/organizations/${organizationId}/members/${memberId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      // Verify member is removed
      const response = await request(app.getHttpServer())
        .get(`/organizations/${organizationId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(
        response.body.find((m: any) => m.userId === memberId),
      ).toBeUndefined();
    });

    it('should allow admin to remove member', async () => {
      await request(app.getHttpServer())
        .delete(`/organizations/${organizationId}/members/${memberId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should fail if admin tries to remove owner', async () => {
      await request(app.getHttpServer())
        .delete(`/organizations/${organizationId}/members/${ownerId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);
    });

    it('should fail if member tries to remove anyone', async () => {
      await request(app.getHttpServer())
        .delete(`/organizations/${organizationId}/members/${adminId}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(403);
    });

    it('should allow member to remove themselves', async () => {
      await request(app.getHttpServer())
        .delete(`/organizations/${organizationId}/members/${memberId}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);
    });

    it('should fail to remove last owner', async () => {
      await request(app.getHttpServer())
        .delete(`/organizations/${organizationId}/members/${ownerId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(403); // Or 409 - cannot remove last owner
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .delete(`/organizations/${organizationId}/members/${memberId}`)
        .expect(401);
    });
  });

  describe('PUT /organizations/:id/members/:userId/role - Change Member Role', () => {
    beforeEach(async () => {
      // Add member for each test
      await request(app.getHttpServer())
        .post(`/organizations/${organizationId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          userId: memberId,
          role: 'MEMBER',
        })
        .expect(201);
    });

    it('should allow owner to promote member to admin', async () => {
      const response = await request(app.getHttpServer())
        .put(`/organizations/${organizationId}/members/${memberId}/role`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          role: 'ADMIN',
        })
        .expect(200);

      expect(response.body.role).toBe('ADMIN');
    });

    it('should allow owner to demote admin to member', async () => {
      // First promote to admin
      await request(app.getHttpServer())
        .put(`/organizations/${organizationId}/members/${memberId}/role`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          role: 'ADMIN',
        })
        .expect(200);

      // Then demote to member
      const response = await request(app.getHttpServer())
        .put(`/organizations/${organizationId}/members/${memberId}/role`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          role: 'MEMBER',
        })
        .expect(200);

      expect(response.body.role).toBe('MEMBER');
    });

    it('should allow owner to transfer ownership', async () => {
      const response = await request(app.getHttpServer())
        .put(`/organizations/${organizationId}/members/${memberId}/role`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          role: 'OWNER',
        })
        .expect(200);

      expect(response.body.role).toBe('OWNER');

      // Original owner should be demoted to ADMIN
      const membersResponse = await request(app.getHttpServer())
        .get(`/organizations/${organizationId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      const originalOwner = membersResponse.body.find(
        (m: any) => m.userId === ownerId,
      );
      expect(originalOwner.role).toBe('ADMIN');
    });

    it('should fail if admin tries to change roles', async () => {
      // Add admin
      await request(app.getHttpServer())
        .post(`/organizations/${organizationId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          userId: adminId,
          role: 'ADMIN',
        })
        .expect(201);

      // Admin tries to change role
      await request(app.getHttpServer())
        .put(`/organizations/${organizationId}/members/${memberId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: 'ADMIN',
        })
        .expect(403);
    });

    it('should fail if member tries to change roles', async () => {
      await request(app.getHttpServer())
        .put(`/organizations/${organizationId}/members/${ownerId}/role`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          role: 'MEMBER',
        })
        .expect(403);
    });

    it('should fail with invalid role', async () => {
      await request(app.getHttpServer())
        .put(`/organizations/${organizationId}/members/${memberId}/role`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          role: 'INVALID_ROLE',
        })
        .expect(400);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .put(`/organizations/${organizationId}/members/${memberId}/role`)
        .send({
          role: 'ADMIN',
        })
        .expect(401);
    });
  });

  describe('GET /organizations/:id/members - List Members', () => {
    beforeEach(async () => {
      // Add various members
      await request(app.getHttpServer())
        .post(`/organizations/${organizationId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          userId: adminId,
          role: 'ADMIN',
        })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/organizations/${organizationId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          userId: memberId,
          role: 'MEMBER',
        })
        .expect(201);
    });

    it('should list all members for owner', async () => {
      const response = await request(app.getHttpServer())
        .get(`/organizations/${organizationId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(response.body).toHaveLength(3); // owner + admin + member
      expect(
        response.body.some(
          (m: any) => m.userId === ownerId && m.role === 'OWNER',
        ),
      ).toBe(true);
      expect(
        response.body.some(
          (m: any) => m.userId === adminId && m.role === 'ADMIN',
        ),
      ).toBe(true);
      expect(
        response.body.some(
          (m: any) => m.userId === memberId && m.role === 'MEMBER',
        ),
      ).toBe(true);
    });

    it('should list all members for admin', async () => {
      const response = await request(app.getHttpServer())
        .get(`/organizations/${organizationId}/members`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveLength(3);
    });

    it('should list all members for regular member', async () => {
      const response = await request(app.getHttpServer())
        .get(`/organizations/${organizationId}/members`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      expect(response.body).toHaveLength(3);
    });

    it('should fail for non-member', async () => {
      await request(app.getHttpServer())
        .get(`/organizations/${organizationId}/members`)
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(403);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .get(`/organizations/${organizationId}/members`)
        .expect(401);
    });
  });
});
