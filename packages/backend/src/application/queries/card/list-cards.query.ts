/**
 * T267 [Phase 10] List Cards Query with Cursor-based Pagination
 *
 * Query to retrieve cards from a list with cursor-based pagination
 * for improved performance with large datasets.
 */

export class ListCardsQuery {
  constructor(
    public readonly listId: string,
    public readonly cursor?: string, // Last card ID from previous page
    public readonly limit: number = 50, // Default 50 cards per page
    public readonly includeArchived: boolean = false,
  ) {}
}
