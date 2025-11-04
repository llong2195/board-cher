/**
 * Get Card Activity Query
 * Retrieves activity history for a specific card
 */
export class GetCardActivityQuery {
  constructor(
    public readonly cardId: string,
    public readonly page: number = 1,
    public readonly limit: number = 20,
  ) {}
}
