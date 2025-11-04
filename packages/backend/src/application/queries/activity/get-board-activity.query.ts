/**
 * Get Board Activity Query
 * Retrieves activity history for a specific board
 */
export class GetBoardActivityQuery {
  constructor(
    public readonly boardId: string,
    public readonly page: number = 1,
    public readonly limit: number = 20,
  ) {}
}
