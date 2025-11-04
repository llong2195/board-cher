/**
 * T228 [US5] - Card Filter API E2E Tests
 * User Story 5: Search and Filter Work Items
 *
 * Tests the filter endpoint for cards:
 * GET /boards/:id/cards?labelId=...&assigneeId=...&dueDate=...
 *
 * Requirements:
 * - Filter by labels
 * - Filter by assignees
 * - Filter by due date ranges
 * - Multiple filters can be combined
 * - Pagination support
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
import { LabelEntity } from '../../../src/infrastructure/persistence/entities/label.entity';
import { CardAssignmentEntity } from '../../../src/infrastructure/persistence/entities/card-assignment.entity';

describe('Card Filter API (E2E)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authToken: string;
  let testUser: UserEntity;
  let testUser2: UserEntity;
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
    await dataSource.query('DELETE FROM labels');
    await dataSource.query('DELETE FROM cards');
    await dataSource.query('DELETE FROM lists');
    await dataSource.query('DELETE FROM boards');
    await dataSource.query('DELETE FROM organization_members');
    await dataSource.query('DELETE FROM organizations');
    await dataSource.query('DELETE FROM users');

    // Create test users
    testUser = await dataSource.getRepository(UserEntity).save({
      email: 'filter-test@example.com',
      passwordHash: 'hashed_password',
      name: 'Filter Test User',
    });

    testUser2 = await dataSource.getRepository(UserEntity).save({
      email: 'filter-test2@example.com',
      passwordHash: 'hashed_password',
      name: 'Filter Test User 2',
    });

    // Login to get token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'filter-test@example.com',
        password: 'testpassword',
      });

    authToken = loginResponse.body.accessToken;

    // Create test organization
    testOrg = await dataSource.getRepository(OrganizationEntity).save({
      name: 'Filter Test Org',
      slug: 'filter-test-org',
    });

    // Create test board
    testBoard = await dataSource.getRepository(BoardEntity).save({
      name: 'Filter Test Board',
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

  describe('GET /boards/:id/cards - Filter by label', () => {
    it('should filter cards by single label', async () => {
      // Arrange: Create labels
      const urgentLabel = await dataSource.getRepository(LabelEntity).save({
        name: 'Urgent',
        color: '#ef4444',
        boardId: testBoard.id,
      });

      const bugLabel = await dataSource.getRepository(LabelEntity).save({
        name: 'Bug',
        color: '#eab308',
        boardId: testBoard.id,
      });

      // Create cards
      const card1 = await dataSource.getRepository(CardEntity).save({
        title: 'Card with urgent label',
        listId: testList.id,
        position: 0,
        createdBy: testUser.id,
      });

      const card2 = await dataSource.getRepository(CardEntity).save({
        title: 'Card with bug label',
        listId: testList.id,
        position: 1,
        createdBy: testUser.id,
      });

      const _card3 = await dataSource.getRepository(CardEntity).save({
        title: 'Card with no labels',
        listId: testList.id,
        position: 2,
        createdBy: testUser.id,
      });

      // Add labels to cards
      await dataSource.query(
        'INSERT INTO card_labels ("cardId", "labelId") VALUES ($1, $2), ($3, $4)',
        [card1.id, urgentLabel.id, card2.id, bugLabel.id],
      );

      // Act: Filter by urgent label
      const response = await request(app.getHttpServer())
        .get(`/boards/${testBoard.id}/cards`)
        .query({ labelId: urgentLabel.id })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Assert
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Card with urgent label');
    });

    it('should filter cards by multiple labels (OR logic)', async () => {
      // Arrange
      const label1 = await dataSource.getRepository(LabelEntity).save({
        name: 'Label1',
        color: '#ef4444',
        boardId: testBoard.id,
      });

      const label2 = await dataSource.getRepository(LabelEntity).save({
        name: 'Label2',
        color: '#eab308',
        boardId: testBoard.id,
      });

      const card1 = await dataSource.getRepository(CardEntity).save({
        title: 'Card with label1',
        listId: testList.id,
        position: 0,
        createdBy: testUser.id,
      });

      const card2 = await dataSource.getRepository(CardEntity).save({
        title: 'Card with label2',
        listId: testList.id,
        position: 1,
        createdBy: testUser.id,
      });

      await dataSource.query(
        'INSERT INTO card_labels ("cardId", "labelId") VALUES ($1, $2), ($3, $4)',
        [card1.id, label1.id, card2.id, label2.id],
      );

      // Act: Filter by multiple labels
      const response = await request(app.getHttpServer())
        .get(`/boards/${testBoard.id}/cards`)
        .query({ labelId: [label1.id, label2.id] })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Assert: Should return cards with either label
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe('GET /boards/:id/cards - Filter by assignee', () => {
    it('should filter cards by single assignee', async () => {
      // Arrange: Create cards
      const card1 = await dataSource.getRepository(CardEntity).save({
        title: 'Card assigned to user1',
        listId: testList.id,
        position: 0,
        createdBy: testUser.id,
      });

      const card2 = await dataSource.getRepository(CardEntity).save({
        title: 'Card assigned to user2',
        listId: testList.id,
        position: 1,
        createdBy: testUser.id,
      });

      const _card3 = await dataSource.getRepository(CardEntity).save({
        title: 'Unassigned card',
        listId: testList.id,
        position: 2,
        createdBy: testUser.id,
      });

      // Add assignments
      await dataSource.getRepository(CardAssignmentEntity).save([
        {
          cardId: card1.id,
          userId: testUser.id,
          assignedBy: testUser.id,
        },
        {
          cardId: card2.id,
          userId: testUser2.id,
          assignedBy: testUser.id,
        },
      ]);

      // Act: Filter by testUser
      const response = await request(app.getHttpServer())
        .get(`/boards/${testBoard.id}/cards`)
        .query({ assigneeId: testUser.id })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Assert
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Card assigned to user1');
    });

    it('should filter cards by multiple assignees', async () => {
      // Arrange
      const card1 = await dataSource.getRepository(CardEntity).save({
        title: 'Card 1',
        listId: testList.id,
        position: 0,
        createdBy: testUser.id,
      });

      const card2 = await dataSource.getRepository(CardEntity).save({
        title: 'Card 2',
        listId: testList.id,
        position: 1,
        createdBy: testUser.id,
      });

      await dataSource.getRepository(CardAssignmentEntity).save([
        { cardId: card1.id, userId: testUser.id, assignedBy: testUser.id },
        { cardId: card2.id, userId: testUser2.id, assignedBy: testUser.id },
      ]);

      // Act
      const response = await request(app.getHttpServer())
        .get(`/boards/${testBoard.id}/cards`)
        .query({ assigneeId: [testUser.id, testUser2.id] })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Assert
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe('GET /boards/:id/cards - Filter by due date', () => {
    it('should filter cards due today', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Arrange
      const _cardDueToday = await dataSource.getRepository(CardEntity).save({
        title: 'Due today',
        listId: testList.id,
        position: 0,
        dueDate: today,
        createdBy: testUser.id,
      });

      const _cardDueTomorrow = await dataSource.getRepository(CardEntity).save({
        title: 'Due tomorrow',
        listId: testList.id,
        position: 1,
        dueDate: tomorrow,
        createdBy: testUser.id,
      });

      // Act
      const response = await request(app.getHttpServer())
        .get(`/boards/${testBoard.id}/cards`)
        .query({ dueDate: 'today' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Assert
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Due today');
    });

    it('should filter cards overdue', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Arrange
      const _cardOverdue = await dataSource.getRepository(CardEntity).save({
        title: 'Overdue card',
        listId: testList.id,
        position: 0,
        dueDate: yesterday,
        createdBy: testUser.id,
      });

      const _cardFuture = await dataSource.getRepository(CardEntity).save({
        title: 'Future card',
        listId: testList.id,
        position: 1,
        dueDate: tomorrow,
        createdBy: testUser.id,
      });

      // Act
      const response = await request(app.getHttpServer())
        .get(`/boards/${testBoard.id}/cards`)
        .query({ dueDate: 'overdue' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Assert
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Overdue card');
    });

    it('should filter cards by date range', async () => {
      const startDate = new Date('2025-11-01');
      const endDate = new Date('2025-11-30');
      const cardDate = new Date('2025-11-15');

      // Arrange
      const _cardInRange = await dataSource.getRepository(CardEntity).save({
        title: 'Card in range',
        listId: testList.id,
        position: 0,
        dueDate: cardDate,
        createdBy: testUser.id,
      });

      const _cardOutOfRange = await dataSource.getRepository(CardEntity).save({
        title: 'Card out of range',
        listId: testList.id,
        position: 1,
        dueDate: new Date('2025-12-15'),
        createdBy: testUser.id,
      });

      // Act
      const response = await request(app.getHttpServer())
        .get(`/boards/${testBoard.id}/cards`)
        .query({
          dueDateStart: startDate.toISOString(),
          dueDateEnd: endDate.toISOString(),
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Assert
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Card in range');
    });
  });

  describe('GET /boards/:id/cards - Combined filters', () => {
    it('should combine multiple filters (AND logic)', async () => {
      // Arrange: Create label
      const urgentLabel = await dataSource.getRepository(LabelEntity).save({
        name: 'Urgent',
        color: '#ef4444',
        boardId: testBoard.id,
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Create cards
      const card1 = await dataSource.getRepository(CardEntity).save({
        title: 'Urgent card assigned to me due today',
        listId: testList.id,
        position: 0,
        dueDate: today,
        createdBy: testUser.id,
      });

      const card2 = await dataSource.getRepository(CardEntity).save({
        title: 'Urgent card not assigned',
        listId: testList.id,
        position: 1,
        dueDate: today,
        createdBy: testUser.id,
      });

      // Add label and assignment to card1
      await dataSource.query(
        'INSERT INTO card_labels ("cardId", "labelId") VALUES ($1, $2), ($3, $4)',
        [card1.id, urgentLabel.id, card2.id, urgentLabel.id],
      );

      await dataSource.getRepository(CardAssignmentEntity).save({
        cardId: card1.id,
        userId: testUser.id,
        assignedBy: testUser.id,
      });

      // Act: Filter by label, assignee, and due date
      const response = await request(app.getHttpServer())
        .get(`/boards/${testBoard.id}/cards`)
        .query({
          labelId: urgentLabel.id,
          assigneeId: testUser.id,
          dueDate: 'today',
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Assert: Only card1 matches all filters
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe(
        'Urgent card assigned to me due today',
      );
    });
  });

  describe('GET /boards/:id/cards - Pagination with filters', () => {
    it('should support pagination with filters', async () => {
      // Arrange: Create label
      const label = await dataSource.getRepository(LabelEntity).save({
        name: 'Feature',
        color: '#22c55e',
        boardId: testBoard.id,
      });

      // Create 15 cards with the label
      const cards = [];
      for (let i = 0; i < 15; i++) {
        const card = await dataSource.getRepository(CardEntity).save({
          title: `Feature card ${i}`,
          listId: testList.id,
          position: i,
          createdBy: testUser.id,
        });
        cards.push(card);
        await dataSource.query(
          'INSERT INTO card_labels ("cardId", "labelId") VALUES ($1, $2)',
          [card.id, label.id],
        );
      }

      // Act: Get first page
      const response = await request(app.getHttpServer())
        .get(`/boards/${testBoard.id}/cards`)
        .query({ labelId: label.id, limit: 10, offset: 0 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Assert
      expect(response.body.data).toHaveLength(10);
      expect(response.body.total).toBe(15);
      expect(response.body.hasMore).toBe(true);
    });
  });

  describe('GET /boards/:id/cards - Error cases', () => {
    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get(`/boards/${testBoard.id}/cards`)
        .query({ labelId: 'some-id' })
        .expect(401);
    });

    it('should verify board access', async () => {
      // Arrange: Create another user without board access
      const _otherUser = await dataSource.getRepository(UserEntity).save({
        email: 'noaccess@example.com',
        passwordHash: 'hashed_password',
        name: 'No Access User',
      });

      const otherLoginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'noaccess@example.com',
          password: 'password',
        });

      const otherToken = otherLoginResponse.body.accessToken;

      // Act
      await request(app.getHttpServer())
        .get(`/boards/${testBoard.id}/cards`)
        .query({ labelId: 'some-id' })
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);
    });

    it('should return empty array when no filters match', async () => {
      // Arrange: Create a card
      await dataSource.getRepository(CardEntity).save({
        title: 'Test card',
        listId: testList.id,
        position: 0,
        createdBy: testUser.id,
      });

      // Act: Filter by non-existent label
      const response = await request(app.getHttpServer())
        .get(`/boards/${testBoard.id}/cards`)
        .query({ labelId: 'non-existent-id' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Assert
      expect(response.body.data).toHaveLength(0);
    });
  });
});
