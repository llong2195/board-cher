/**
 * T227 [US5] - Card Search API E2E Tests
 * User Story 5: Search and Filter Work Items
 *
 * Tests the search endpoint for cards:
 * GET /boards/:id/cards/search?q=text
 *
 * Requirements:
 * - Full-text search on card title and description
 * - Pagination support
 * - Case-insensitive search
 * - Performance: <200ms for typical queries
 */

/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { DataSource } from 'typeorm';
import { UserEntity } from '../../../src/infrastructure/persistence/entities/user.entity';
import { OrganizationEntity } from '../../../src/infrastructure/persistence/entities/organization.entity';
import { BoardEntity } from '../../../src/infrastructure/persistence/entities/board.entity';
import { ListEntity } from '../../../src/infrastructure/persistence/entities/list.entity';
import { CardEntity } from '../../../src/infrastructure/persistence/entities/card.entity';

describe('Card Search API (E2E)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authToken: string;
  let testUser: UserEntity;
  let testOrg: OrganizationEntity;
  let testBoard: BoardEntity;
  let testList: ListEntity;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
  });

  beforeEach(async () => {
    // Clear database
    await dataSource.query('DELETE FROM card_assignments');
    await dataSource.query('DELETE FROM card_labels');
    await dataSource.query('DELETE FROM cards');
    await dataSource.query('DELETE FROM lists');
    await dataSource.query('DELETE FROM boards');
    await dataSource.query('DELETE FROM organization_members');
    await dataSource.query('DELETE FROM organizations');
    await dataSource.query('DELETE FROM users');

    // Create test user
    const hashedPassword = 'hashed_test_password';
    testUser = await dataSource.getRepository(UserEntity).save({
      email: 'search-test@example.com',
      passwordHash: hashedPassword,
      name: 'Search Test User',
    });

    // Login to get token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'search-test@example.com',
        password: 'testpassword',
      });

    authToken = loginResponse.body.accessToken;

    // Create test organization
    testOrg = await dataSource.getRepository(OrganizationEntity).save({
      name: 'Search Test Org',
      slug: 'search-test-org',
    });

    // Create test board
    testBoard = await dataSource.getRepository(BoardEntity).save({
      name: 'Search Test Board',
      organizationId: testOrg.id,
      createdBy: testUser.id,
    });

    // Create test list
    testList = await dataSource.getRepository(ListEntity).save({
      name: 'Test List',
      boardId: testBoard.id,
      position: 0,
    });
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  describe('GET /boards/:id/cards/search', () => {
    it('should search cards by title', async () => {
      // Arrange: Create cards with different titles
      await dataSource.getRepository(CardEntity).save([
        {
          title: 'Fix login bug',
          listId: testList.id,
          position: 0,
          createdBy: testUser.id,
        },
        {
          title: 'Implement user registration',
          listId: testList.id,
          position: 1,
          createdBy: testUser.id,
        },
        {
          title: 'Fix logout issue',
          listId: testList.id,
          position: 2,
          createdBy: testUser.id,
        },
      ]);

      // Act: Search for "login"
      const response = await request(app.getHttpServer())
        .get(`/boards/${testBoard.id}/cards/search`)
        .query({ q: 'login' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Assert: Should find 2 cards containing "login"
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].title).toContain('login');
      expect(response.body.data[1].title).toContain('login');
    });

    it('should search cards by description', async () => {
      // Arrange: Create cards with different descriptions
      await dataSource.getRepository(CardEntity).save([
        {
          title: 'Card 1',
          description: 'This is about authentication flow',
          listId: testList.id,
          position: 0,
          createdBy: testUser.id,
        },
        {
          title: 'Card 2',
          description: 'Database migration scripts',
          listId: testList.id,
          position: 1,
          createdBy: testUser.id,
        },
        {
          title: 'Card 3',
          description: 'Authentication module refactoring',
          listId: testList.id,
          position: 2,
          createdBy: testUser.id,
        },
      ]);

      // Act: Search for "authentication"
      const response = await request(app.getHttpServer())
        .get(`/boards/${testBoard.id}/cards/search`)
        .query({ q: 'authentication' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Assert: Should find 2 cards with "authentication" in description
      expect(response.body.data).toHaveLength(2);
    });

    it('should be case-insensitive', async () => {
      // Arrange
      await dataSource.getRepository(CardEntity).save({
        title: 'FIX LOGIN BUG',
        listId: testList.id,
        position: 0,
        createdBy: testUser.id,
      });

      // Act: Search with lowercase
      const response = await request(app.getHttpServer())
        .get(`/boards/${testBoard.id}/cards/search`)
        .query({ q: 'fix login bug' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Assert
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('FIX LOGIN BUG');
    });

    it('should return empty array for no matches', async () => {
      // Arrange
      await dataSource.getRepository(CardEntity).save({
        title: 'Card about testing',
        listId: testList.id,
        position: 0,
        createdBy: testUser.id,
      });

      // Act
      const response = await request(app.getHttpServer())
        .get(`/boards/${testBoard.id}/cards/search`)
        .query({ q: 'nonexistent' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Assert
      expect(response.body.data).toHaveLength(0);
    });

    it('should support pagination', async () => {
      // Arrange: Create 25 cards
      const cards = [];
      for (let i = 0; i < 25; i++) {
        cards.push({
          title: `Bug ${i}`,
          listId: testList.id,
          position: i,
          createdBy: testUser.id,
        });
      }
      await dataSource.getRepository(CardEntity).save(cards);

      // Act: Search with limit and offset
      const response = await request(app.getHttpServer())
        .get(`/boards/${testBoard.id}/cards/search`)
        .query({ q: 'Bug', limit: 10, offset: 0 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Assert
      expect(response.body.data).toHaveLength(10);
      expect(response.body.total).toBe(25);
      expect(response.body.hasMore).toBe(true);
    });

    it('should handle empty search query', async () => {
      // Act
      const response = await request(app.getHttpServer())
        .get(`/boards/${testBoard.id}/cards/search`)
        .query({ q: '' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      // Assert
      expect(response.body.message).toContain('search query');
    });

    it('should require authentication', async () => {
      // Act
      await request(app.getHttpServer())
        .get(`/boards/${testBoard.id}/cards/search`)
        .query({ q: 'test' })
        .expect(401);
    });

    it('should verify user has access to board', async () => {
      // Arrange: Create another user
      const _otherUser = await dataSource.getRepository(UserEntity).save({
        email: 'other@example.com',
        passwordHash: 'hashed_password',
        name: 'Other User',
      });

      const otherLoginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'other@example.com',
          password: 'password',
        });

      const otherToken = otherLoginResponse.body.accessToken;

      // Act: Try to search in board without access
      await request(app.getHttpServer())
        .get(`/boards/${testBoard.id}/cards/search`)
        .query({ q: 'test' })
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);
    });

    it('should search only within specified board', async () => {
      // Arrange: Create another board with cards
      const otherBoard = await dataSource.getRepository(BoardEntity).save({
        name: 'Other Board',
        organizationId: testOrg.id,
        createdBy: testUser.id,
      });

      const otherList = await dataSource.getRepository(ListEntity).save({
        name: 'Other List',
        boardId: otherBoard.id,
        position: 0,
      });

      await dataSource.getRepository(CardEntity).save([
        {
          title: 'Card in test board about login',
          listId: testList.id,
          position: 0,
          createdBy: testUser.id,
        },
        {
          title: 'Card in other board about login',
          listId: otherList.id,
          position: 0,
          createdBy: testUser.id,
        },
      ]);

      // Act: Search in test board only
      const response = await request(app.getHttpServer())
        .get(`/boards/${testBoard.id}/cards/search`)
        .query({ q: 'login' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Assert: Should only find card from test board
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe(
        'Card in test board about login',
      );
    });

    it('should not include archived cards in search results', async () => {
      // Arrange
      await dataSource.getRepository(CardEntity).save([
        {
          title: 'Active card about bug',
          listId: testList.id,
          position: 0,
          isArchived: false,
          createdBy: testUser.id,
        },
        {
          title: 'Archived card about bug',
          listId: testList.id,
          position: 1,
          isArchived: true,
          createdBy: testUser.id,
        },
      ]);

      // Act
      const response = await request(app.getHttpServer())
        .get(`/boards/${testBoard.id}/cards/search`)
        .query({ q: 'bug' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Assert: Should only find active card
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Active card about bug');
    });
  });
});
