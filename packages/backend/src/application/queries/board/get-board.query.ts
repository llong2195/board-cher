/**
 * Get Board Query
 * Task: T083 [US1]
 */

export class GetBoardQuery {
  constructor(
    public readonly boardId: string,
    public readonly userId: string,
  ) {}
}
