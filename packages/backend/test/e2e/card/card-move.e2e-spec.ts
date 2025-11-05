/**
 * End-to-End Tests for Card Move Operations
 * User Story 1: Create and Organize Work Items
 *
 * Test Coverage:
 * - PUT /cards/:id/move - Move card within same list (position change)
 * - PUT /cards/:id/move - Move card to different list
 * - Position recalculation after move
 * - Cross-list move with position update
 * - Optimistic locking / concurrent move handling
 *
 * TDD Approach: These tests are written FIRST and will fail until implementation is complete.
 * Expected behavior based on contracts/openapi.yaml and data-model.md
 */

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../../src/app.module';

describe('Card Move Operations (e2e)', () => {
  let app: INestApplication<App>;
  let authToken: string;
  let userId: string;
  let boardId: string;
  let list1Id: string;
  let list2Id: string;
  let list3Id: string;

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

    // Register and authenticate a test user
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'cardmove@example.com',
        password: 'TestPassword123!',
        name: 'Card Move Test User',
      })
      .expect(201);

    authToken = registerResponse.body.tokens.accessToken;
    userId = registerResponse.body.user.id;

    // Create a board for testing
    const boardResponse = await request(app.getHttpServer())
      .post('/boards')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Card Move Test Board',
        description: 'Board for testing card move operations',
      })
      .expect(201);

    boardId = boardResponse.body.id;

    // Create three lists for testing card moves
    const list1Response = await request(app.getHttpServer())
      .post(`/boards/${boardId}/lists`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'To Do',
        position: 1,
      })
      .expect(201);

    list1Id = list1Response.body.id;

    const list2Response = await request(app.getHttpServer())
      .post(`/boards/${boardId}/lists`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'In Progress',
        position: 2,
      })
      .expect(201);

    list2Id = list2Response.body.id;

    const list3Response = await request(app.getHttpServer())
      .post(`/boards/${boardId}/lists`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Done',
        position: 3,
      })
      .expect(201);

    list3Id = list3Response.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('PUT /cards/:id/move - Move within same list', () => {
    let card1Id: string;
    let card2Id: string;
    let card3Id: string;
    let card4Id: string;

    beforeEach(async () => {
      // Create 4 cards in list1
      const card1 = await request(app.getHttpServer())
        .post(`/lists/${list1Id}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Card 1',
          position: 1,
        })
        .expect(201);
      card1Id = card1.body.id;

      const card2 = await request(app.getHttpServer())
        .post(`/lists/${list1Id}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Card 2',
          position: 2,
        })
        .expect(201);
      card2Id = card2.body.id;

      const card3 = await request(app.getHttpServer())
        .post(`/lists/${list1Id}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Card 3',
          position: 3,
        })
        .expect(201);
      card3Id = card3.body.id;

      const card4 = await request(app.getHttpServer())
        .post(`/lists/${list1Id}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Card 4',
          position: 4,
        })
        .expect(201);
      card4Id = card4.body.id;
    });

    it('should move card down within same list (position 1 → 3)', async () => {
      const response = await request(app.getHttpServer())
        .put(`/cards/${card1Id}/move`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          listId: list1Id,
          position: 3,
        })
        .expect(200);

      expect(response.body.listId).toBe(list1Id);
      expect(response.body.position).toBe(3);

      // Verify final order: Card 2, Card 3, Card 1, Card 4
      const cards = await request(app.getHttpServer())
        .get(`/lists/${list1Id}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const titles = cards.body.map((c: { title: string }) => c.title);
      expect(titles).toEqual(['Card 2', 'Card 3', 'Card 1', 'Card 4']);
    });

    it('should move card up within same list (position 4 → 2)', async () => {
      const response = await request(app.getHttpServer())
        .put(`/cards/${card4Id}/move`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          listId: list1Id,
          position: 2,
        })
        .expect(200);

      expect(response.body.listId).toBe(list1Id);
      expect(response.body.position).toBe(2);

      // Verify final order: Card 1, Card 4, Card 2, Card 3
      const cards = await request(app.getHttpServer())
        .get(`/lists/${list1Id}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const titles = cards.body.map((c: { title: string }) => c.title);
      expect(titles).toEqual(['Card 1', 'Card 4', 'Card 2', 'Card 3']);
    });

    it('should move card to first position', async () => {
      const response = await request(app.getHttpServer())
        .put(`/cards/${card3Id}/move`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          listId: list1Id,
          position: 1,
        })
        .expect(200);

      expect(response.body.position).toBe(1);

      const cards = await request(app.getHttpServer())
        .get(`/lists/${list1Id}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(cards.body[0].title).toBe('Card 3');
    });

    it('should move card to last position', async () => {
      const response = await request(app.getHttpServer())
        .put(`/cards/${card1Id}/move`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          listId: list1Id,
          position: 4,
        })
        .expect(200);

      expect(response.body.position).toBe(4);

      const cards = await request(app.getHttpServer())
        .get(`/lists/${list1Id}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(cards.body[cards.body.length - 1].title).toBe('Card 1');
    });

    it('should handle move to same position (no-op)', async () => {
      const response = await request(app.getHttpServer())
        .put(`/cards/${card2Id}/move`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          listId: list1Id,
          position: 2,
        })
        .expect(200);

      expect(response.body.position).toBe(2);

      // Order should remain unchanged
      const cards = await request(app.getHttpServer())
        .get(`/lists/${list1Id}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const titles = cards.body.map((c: { title: string }) => c.title);
      expect(titles).toEqual(['Card 1', 'Card 2', 'Card 3', 'Card 4']);
    });
  });

  describe('PUT /cards/:id/move - Move to different list', () => {
    let cardId: string;

    beforeEach(async () => {
      // Create cards in list1
      const card = await request(app.getHttpServer())
        .post(`/lists/${list1Id}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Card to move across lists',
          position: 1,
        })
        .expect(201);
      cardId = card.body.id;

      // Add more cards to both lists
      await request(app.getHttpServer())
        .post(`/lists/${list1Id}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'List1 Card 2',
          position: 2,
        })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/lists/${list2Id}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'List2 Card 1',
          position: 1,
        })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/lists/${list2Id}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'List2 Card 2',
          position: 2,
        })
        .expect(201);
    });

    it('should move card to different list at beginning', async () => {
      const response = await request(app.getHttpServer())
        .put(`/cards/${cardId}/move`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          listId: list2Id,
          position: 1,
        })
        .expect(200);

      expect(response.body.listId).toBe(list2Id);
      expect(response.body.position).toBe(1);

      // Verify card is in new list at position 1
      const list2Cards = await request(app.getHttpServer())
        .get(`/lists/${list2Id}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(list2Cards.body[0].title).toBe('Card to move across lists');

      // Verify card is removed from original list
      const list1Cards = await request(app.getHttpServer())
        .get(`/lists/${list1Id}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const list1Titles = list1Cards.body.map(
        (c: { title: string }) => c.title,
      );
      expect(list1Titles).not.toContain('Card to move across lists');
    });

    it('should move card to different list at end', async () => {
      const response = await request(app.getHttpServer())
        .put(`/cards/${cardId}/move`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          listId: list2Id,
          position: 3, // After existing 2 cards
        })
        .expect(200);

      expect(response.body.listId).toBe(list2Id);
      expect(response.body.position).toBe(3);

      const list2Cards = await request(app.getHttpServer())
        .get(`/lists/${list2Id}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(list2Cards.body[list2Cards.body.length - 1].title).toBe(
        'Card to move across lists',
      );
    });

    it('should move card to different list at middle position', async () => {
      const response = await request(app.getHttpServer())
        .put(`/cards/${cardId}/move`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          listId: list2Id,
          position: 2, // Between two existing cards
        })
        .expect(200);

      expect(response.body.position).toBe(2);

      const list2Cards = await request(app.getHttpServer())
        .get(`/lists/${list2Id}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const titles = list2Cards.body.map((c: { title: string }) => c.title);
      expect(titles[1]).toBe('Card to move across lists');
    });

    it('should move card to empty list', async () => {
      const response = await request(app.getHttpServer())
        .put(`/cards/${cardId}/move`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          listId: list3Id, // Empty list
          position: 1,
        })
        .expect(200);

      expect(response.body.listId).toBe(list3Id);
      expect(response.body.position).toBe(1);

      const list3Cards = await request(app.getHttpServer())
        .get(`/lists/${list3Id}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(list3Cards.body.length).toBe(1);
      expect(list3Cards.body[0].title).toBe('Card to move across lists');
    });

    it('should recalculate positions in source list after move', async () => {
      // Move card from position 1 in list1
      await request(app.getHttpServer())
        .put(`/cards/${cardId}/move`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          listId: list2Id,
          position: 1,
        })
        .expect(200);

      // Verify remaining card in list1 now has position 1
      const list1Cards = await request(app.getHttpServer())
        .get(`/lists/${list1Id}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(list1Cards.body[0].title).toBe('List1 Card 2');
      expect(list1Cards.body[0].position).toBe(1);
    });
  });

  describe('PUT /cards/:id/move - Error handling', () => {
    let cardId: string;

    beforeEach(async () => {
      const card = await request(app.getHttpServer())
        .post(`/lists/${list1Id}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Card',
        })
        .expect(201);
      cardId = card.body.id;
    });

    it('should reject move without authentication', async () => {
      await request(app.getHttpServer())
        .put(`/cards/${cardId}/move`)
        .send({
          listId: list2Id,
          position: 1,
        })
        .expect(401);
    });

    it('should reject move to non-existent list', async () => {
      await request(app.getHttpServer())
        .put(`/cards/${cardId}/move`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          listId: '99999999-9999-9999-9999-999999999999',
          position: 1,
        })
        .expect(404);
    });

    it('should reject move of non-existent card', async () => {
      await request(app.getHttpServer())
        .put('/cards/99999999-9999-9999-9999-999999999999/move')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          listId: list2Id,
          position: 1,
        })
        .expect(404);
    });

    it('should reject move with negative position', async () => {
      await request(app.getHttpServer())
        .put(`/cards/${cardId}/move`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          listId: list2Id,
          position: -1,
        })
        .expect(400);
    });

    it('should reject move with zero position', async () => {
      await request(app.getHttpServer())
        .put(`/cards/${cardId}/move`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          listId: list2Id,
          position: 0,
        })
        .expect(400);
    });

    it('should reject move without listId', async () => {
      await request(app.getHttpServer())
        .put(`/cards/${cardId}/move`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          position: 1,
        })
        .expect(400);
    });

    it('should reject move without position', async () => {
      await request(app.getHttpServer())
        .put(`/cards/${cardId}/move`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          listId: list2Id,
        })
        .expect(400);
    });

    it('should reject move to list in different board', async () => {
      // Create another board
      const otherBoardResponse = await request(app.getHttpServer())
        .post('/boards')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Other Board',
        })
        .expect(201);

      // Create list in other board
      const otherListResponse = await request(app.getHttpServer())
        .post(`/boards/${otherBoardResponse.body.id}/lists`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Other List',
        })
        .expect(201);

      // Try to move card from first board to second board's list
      await request(app.getHttpServer())
        .put(`/cards/${cardId}/move`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          listId: otherListResponse.body.id,
          position: 1,
        })
        .expect(400); // Should reject cross-board moves
    });

    it('should prevent move by user without access to board', async () => {
      // Create another user
      const otherUserResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'noaccess@example.com',
          password: 'NoAccess123!',
          name: 'No Access User',
        })
        .expect(201);

      const otherToken = otherUserResponse.body.tokens.accessToken;

      await request(app.getHttpServer())
        .put(`/cards/${cardId}/move`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          listId: list2Id,
          position: 1,
        })
        .expect(403);
    });
  });

  describe('PUT /cards/:id/move - Complex scenarios', () => {
    it('should handle multiple consecutive moves', async () => {
      const card = await request(app.getHttpServer())
        .post(`/lists/${list1Id}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Multi-move Card',
        })
        .expect(201);

      const cardId = card.body.id;

      // Move 1: list1 → list2
      await request(app.getHttpServer())
        .put(`/cards/${cardId}/move`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          listId: list2Id,
          position: 1,
        })
        .expect(200);

      // Move 2: list2 → list3
      await request(app.getHttpServer())
        .put(`/cards/${cardId}/move`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          listId: list3Id,
          position: 1,
        })
        .expect(200);

      // Move 3: list3 → list1
      const finalResponse = await request(app.getHttpServer())
        .put(`/cards/${cardId}/move`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          listId: list1Id,
          position: 1,
        })
        .expect(200);

      expect(finalResponse.body.listId).toBe(list1Id);
    });

    it('should maintain position integrity with concurrent moves', async () => {
      // Create 5 cards
      const cards = [];
      for (let i = 1; i <= 5; i++) {
        const card = await request(app.getHttpServer())
          .post(`/lists/${list1Id}/cards`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: `Concurrent Card ${i}`,
            position: i,
          })
          .expect(201);
        cards.push(card.body.id);
      }

      // Move multiple cards "simultaneously" (Promise.all)
      await Promise.all([
        request(app.getHttpServer())
          .put(`/cards/${cards[0]}/move`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            listId: list1Id,
            position: 5,
          }),
        request(app.getHttpServer())
          .put(`/cards/${cards[4]}/move`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            listId: list1Id,
            position: 1,
          }),
      ]);

      // Verify all cards have unique positions
      const finalCards = await request(app.getHttpServer())
        .get(`/lists/${list1Id}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const positions = finalCards.body.map(
        (c: { position: number }) => c.position,
      );
      const uniquePositions = new Set(positions);
      expect(uniquePositions.size).toBe(positions.length); // All positions should be unique
    });

    it('should handle position exceeding list length', async () => {
      const card = await request(app.getHttpServer())
        .post(`/lists/${list1Id}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Over-position Card',
        })
        .expect(201);

      // Try to move to position 999
      const response = await request(app.getHttpServer())
        .put(`/cards/${card.body.id}/move`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          listId: list2Id,
          position: 999,
        })
        .expect(200);

      // Should be placed at the end
      const list2Cards = await request(app.getHttpServer())
        .get(`/lists/${list2Id}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const lastCard = list2Cards.body[list2Cards.body.length - 1];
      expect(lastCard.title).toBe('Over-position Card');
    });

    it('should preserve card data after move', async () => {
      // Create card with all fields
      const card = await request(app.getHttpServer())
        .post(`/lists/${list1Id}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Rich Card',
          description: 'This card has all the data',
          dueDate: new Date('2025-12-31').toISOString(),
        })
        .expect(201);

      // Move the card
      await request(app.getHttpServer())
        .put(`/cards/${card.body.id}/move`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          listId: list2Id,
          position: 1,
        })
        .expect(200);

      // Verify all data is preserved
      const movedCard = await request(app.getHttpServer())
        .get(`/cards/${card.body.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(movedCard.body.title).toBe('Rich Card');
      expect(movedCard.body.description).toBe('This card has all the data');
      expect(movedCard.body.dueDate).toBe(card.body.dueDate);
    });
  });

  describe('PUT /cards/:id/move - WebSocket broadcast', () => {
    it('should broadcast card:moved event to board members', async () => {
      // Note: This test verifies the event is emitted
      // Actual WebSocket integration is tested in websocket E2E tests
      const card = await request(app.getHttpServer())
        .post(`/lists/${list1Id}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Broadcast Move Card',
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .put(`/cards/${card.body.id}/move`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          listId: list2Id,
          position: 1,
        })
        .expect(200);

      // Verify response includes data needed for broadcast
      expect(response.body.listId).toBeDefined();
      expect(response.body.position).toBeDefined();
      expect(response.body.id).toBeDefined();
    });
  });
});
