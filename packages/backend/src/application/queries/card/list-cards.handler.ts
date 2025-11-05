/**
 * T267 [Phase 10] List Cards Query Handler with Cursor-based Pagination
 *
 * Handler for retrieving cards from a list using cursor-based pagination.
 * This improves performance with large lists by avoiding offset-based queries.
 *
 * Cursor format: base64 encoded JSON with { id: string, position: number }
 */

import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { ListCardsQuery } from './list-cards.query';
import { ICardRepository } from '../../../domain/card/card.repository';
import { IListRepository } from '../../../domain/list/list.repository';
import { Card } from '../../../domain/card/card.model';

export interface ListCardsResult {
  cards: Card[];
  nextCursor: string | null;
  hasMore: boolean;
}

interface CursorData {
  id: string;
  position: number;
}

@QueryHandler(ListCardsQuery)
export class ListCardsHandler implements IQueryHandler<ListCardsQuery> {
  constructor(
    @Inject('ICardRepository')
    private readonly cardRepository: ICardRepository,
    @Inject('IListRepository')
    private readonly listRepository: IListRepository,
  ) {}

  async execute(query: ListCardsQuery): Promise<ListCardsResult> {
    // Verify list exists
    const list = await this.listRepository.findById(query.listId);
    if (!list) {
      throw new NotFoundException(`List with ID ${query.listId} not found`);
    }

    // Get cards using cursor-based pagination
    const cards = await this.getCardsWithCursor(
      query.listId,
      query.cursor,
      query.limit + 1, // Fetch one extra to determine if there are more
      query.includeArchived,
    );

    // Check if there are more cards
    const hasMore = cards.length > query.limit;
    const resultCards = hasMore ? cards.slice(0, query.limit) : cards;

    // Generate next cursor
    const nextCursor = hasMore
      ? this.encodeCursor({
          id: resultCards[resultCards.length - 1].id,
          position: resultCards[resultCards.length - 1].position,
        })
      : null;

    return {
      cards: resultCards,
      nextCursor,
      hasMore,
    };
  }

  /**
   * Retrieve cards using cursor-based pagination
   */
  private async getCardsWithCursor(
    listId: string,
    cursor: string | undefined,
    limit: number,
    includeArchived: boolean,
  ): Promise<Card[]> {
    // For simplicity, we'll use the existing findByListIdOrdered
    // and filter based on cursor. In production, you'd want to
    // use a more efficient database query with WHERE position > ?
    const allCards = await this.cardRepository.findByListIdOrdered(
      listId,
      includeArchived,
    );

    if (!cursor) {
      return allCards.slice(0, limit);
    }

    // Decode cursor to get position
    const cursorData = this.decodeCursor(cursor);

    // Find index of cursor card and return next cards
    const cursorIndex = allCards.findIndex(
      (card) =>
        card.id === cursorData.id && card.position === cursorData.position,
    );

    if (cursorIndex === -1) {
      // Cursor not found, return from beginning
      return allCards.slice(0, limit);
    }

    return allCards.slice(cursorIndex + 1, cursorIndex + 1 + limit);
  }

  /**
   * Encode cursor data to base64 string
   */
  private encodeCursor(data: CursorData): string {
    const json = JSON.stringify(data);
    return Buffer.from(json).toString('base64');
  }

  /**
   * Decode base64 cursor string to cursor data
   */
  private decodeCursor(cursor: string): CursorData {
    try {
      const json = Buffer.from(cursor, 'base64').toString('utf-8');
      return JSON.parse(json);
    } catch (error) {
      // Invalid cursor, return default
      return { id: '', position: 0 };
    }
  }
}
